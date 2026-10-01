import json
import math
import time
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import StreamingHttpResponse, JsonResponse
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from game.models import UserProfile, DailyRecord, ClickEvent
from game.serializers import (
    UserProfileSerializer,
    UserRegisterSerializer,
    ChangePasswordSerializer,
    ProfileUpdateSerializer,
    DailyRecordSerializer,
)

# In-memory timestamp to notify SSE streams of updates
LAST_GAME_UPDATE_TS = time.time()


def trigger_game_update():
    global LAST_GAME_UPDATE_TS
    LAST_GAME_UPDATE_TS = time.time()


def calculate_bar_heights(profiles, current_user=None):
    """
    Calculates dynamic normalized bar heights with an adaptive limiter.
    Ensures all bars fit nicely within 12% to 88% visual height,
    preventing overflow when scores grow large or exponentially.
    """
    if not profiles:
        return [], 0

    scores = [p.daily_points for p in profiles]
    max_score = max(scores) if scores else 0
    # Baseline ceiling to avoid divide by zero and provide nice initial heights
    effective_max = max(max_score, 50)

    # Sort by daily_points descending, then lifetime points descending
    sorted_profiles = sorted(profiles, key=lambda p: (p.daily_points, p.points), reverse=True)

    bars = []
    for rank_idx, profile in enumerate(sorted_profiles, start=1):
        pts = profile.daily_points
        # Adaptive scaling: Linear with smooth curve
        if effective_max > 0:
            ratio = pts / effective_max
            # Minimum base height of 12% so face is always prominently visible
            # Maximum height of 88% so face + name stay inside the chart ceiling
            height_pct = round(12.0 + (ratio * 76.0), 2)
        else:
            height_pct = 12.0

        is_current = (current_user and current_user.is_authenticated and profile.user_id == current_user.id)

        bars.append({
            'user_id': profile.user_id,
            'username': profile.user.username,
            'display_name': profile.effective_display_name,
            'avatar_url': profile.avatar_url,
            'avatar_preset': profile.avatar_preset,
            'daily_points': pts,
            'lifetime_points': profile.points,
            'rank': rank_idx,
            'height_percentage': height_pct,
            'clicks_given': profile.clicks_given,
            'clicks_received': profile.clicks_received,
            'is_current_user': bool(is_current),
        })

    return bars, max_score


class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            profile_serializer = UserProfileSerializer(user.profile)
            trigger_game_update()
            return Response({
                'token': token.key,
                'user': profile_serializer.data,
                'message': 'Registration successful!'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'error': 'Please provide both username and password.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Ensure user profile exists & check daily reset
        if hasattr(user, 'profile'):
            user.profile.check_and_reset_daily()

        token, _ = Token.objects.get_or_create(user=user)
        profile_serializer = UserProfileSerializer(user.profile)
        return Response({
            'token': token.key,
            'user': profile_serializer.data,
            'message': 'Login successful!'
        }, status=status.HTTP_200_OK)


class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        profile.check_and_reset_daily()
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)


class ProfileUpdateView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        profile = request.user.profile
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            trigger_game_update()
            full_serializer = UserProfileSerializer(profile)
            return Response({
                'user': full_serializer.data,
                'message': 'Profile updated successfully!'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            new_password = serializer.validated_data['new_password']
            request.user.set_password(new_password)
            request.user.save()
            # Renew token so user stays logged in
            Token.objects.filter(user=request.user).delete()
            new_token = Token.objects.create(user=request.user)
            return Response({
                'token': new_token.key,
                'message': 'Password updated successfully!'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LiveBarChartView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Auto-check daily reset for all profiles
        today = timezone.localdate()
        profiles = list(UserProfile.objects.select_related('user').all())
        for p in profiles:
            if p.last_active_date < today:
                p.daily_points = 0
                p.last_active_date = today
                p.save(update_fields=['daily_points', 'last_active_date'])

        bars, max_score = calculate_bar_heights(profiles, request.user)
        
        return Response({
            'date': str(today),
            'max_score': max_score,
            'total_players': len(bars),
            'bars': bars,
            'server_timestamp': time.time(),
        })


class ClickUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        target_user_id = request.data.get('target_user_id')
        if not target_user_id:
            return Response({'error': 'target_user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=target_user_id)
        except User.DoesNotExist:
            return Response({'error': 'Target user not found.'}, status=status.HTTP_404_NOT_FOUND)

        clicker = request.user
        if clicker.id == target_user.id:
            return Response({
                'error': 'You cannot click your own face! Click on other users to raise your bar.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Points awarded per click
        points_gained = 10

        clicker_profile = clicker.profile
        clicker_profile.check_and_reset_daily()
        clicker_profile.daily_points += points_gained
        clicker_profile.points += points_gained
        clicker_profile.clicks_given += 1
        clicker_profile.save(update_fields=['daily_points', 'points', 'clicks_given'])

        target_profile = target_user.profile
        target_profile.clicks_received += 1
        target_profile.save(update_fields=['clicks_received'])

        # Record event
        ClickEvent.objects.create(
            clicker=clicker,
            target=target_user,
            points=points_gained
        )

        trigger_game_update()

        # Recalculate rank and heights
        profiles = list(UserProfile.objects.select_related('user').all())
        bars, max_score = calculate_bar_heights(profiles, clicker)

        current_bar = next((b for b in bars if b['user_id'] == clicker.id), None)

        return Response({
            'message': f'+{points_gained} Points! Your bar grew higher.',
            'points_gained': points_gained,
            'my_daily_points': clicker_profile.daily_points,
            'my_lifetime_points': clicker_profile.points,
            'my_rank': current_bar['rank'] if current_bar else 1,
            'my_height_percentage': current_bar['height_percentage'] if current_bar else 12.0,
            'bars': bars,
            'max_score': max_score,
        })


class RealtimeStreamView(views.APIView):
    """
    Server-Sent Events (SSE) stream for real-time multiplayer updates.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        def event_stream():
            last_sent_ts = 0
            while True:
                global LAST_GAME_UPDATE_TS
                if LAST_GAME_UPDATE_TS > last_sent_ts or (time.time() - last_sent_ts) > 5:
                    last_sent_ts = time.time()
                    profiles = list(UserProfile.objects.select_related('user').all())
                    bars, max_score = calculate_bar_heights(profiles, request.user)
                    data = json.dumps({
                        'type': 'chart_update',
                        'date': str(timezone.localdate()),
                        'max_score': max_score,
                        'total_players': len(bars),
                        'bars': bars,
                        'timestamp': last_sent_ts
                    })
                    yield f"data: {data}\n\n"
                else:
                    yield f": keepalive {time.time()}\n\n"
                time.sleep(0.8)

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


class DailyHistoryListView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Get all distinct archived dates
        dates = DailyRecord.objects.values_list('date', flat=True).distinct().order_by('-date')
        summary = []
        for d in dates:
            records = DailyRecord.objects.filter(date=d).select_related('user', 'user__profile').order_by('rank')[:3]
            top_3 = []
            for r in records:
                top_3.append({
                    'rank': r.rank,
                    'username': r.user.username,
                    'display_name': r.user.profile.effective_display_name,
                    'avatar_url': r.user.profile.avatar_url,
                    'points': r.points
                })
            total_count = DailyRecord.objects.filter(date=d).count()
            summary.append({
                'date': str(d),
                'total_players': total_count,
                'podium': top_3
            })
        return Response(summary)


class DailyHistoryDetailView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'Please provide date query parameter (YYYY-MM-DD)'}, status=status.HTTP_400_BAD_REQUEST)

        records = DailyRecord.objects.filter(date=date_str).select_related('user', 'user__profile').order_by('rank')
        serializer = DailyRecordSerializer(records, many=True)
        return Response({
            'date': date_str,
            'total_players': records.count(),
            'standings': serializer.data
        })


class DailyRolloverView(views.APIView):
    """
    Archives current day scores into DailyRecord and resets daily_points.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        today = timezone.localdate()
        target_date_str = request.data.get('date')
        archive_date = timezone.datetime.strptime(target_date_str, '%Y-%m-%d').date() if target_date_str else today

        profiles = list(UserProfile.objects.select_related('user').all())
        sorted_profiles = sorted(profiles, key=lambda p: (p.daily_points, p.points), reverse=True)

        created_count = 0
        for rank_idx, p in enumerate(sorted_profiles, start=1):
            DailyRecord.objects.update_or_create(
                user=p.user,
                date=archive_date,
                defaults={
                    'points': p.daily_points,
                    'rank': rank_idx,
                    'clicks_given': p.clicks_given,
                    'clicks_received': p.clicks_received,
                }
            )
            created_count += 1
            # Reset daily points
            p.daily_points = 0
            p.last_active_date = today + timedelta(days=1)
            p.save(update_fields=['daily_points', 'last_active_date'])

        trigger_game_update()

        return Response({
            'message': f'Successfully archived {created_count} players for {archive_date} and reset daily scores.',
            'date': str(archive_date),
            'archived_count': created_count
        })


class SeedRivalsView(views.APIView):
    """
    Creates fun sample rival bots with realistic avatars & initial points so the board is live immediately.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        rivals_data = [
            {'username': 'cyber_ninja', 'display_name': 'Cyber Ninja', 'preset': 'bot_1', 'daily_points': 140, 'points': 820},
            {'username': 'pixel_queen', 'display_name': 'Pixel Queen 👑', 'preset': 'bot_2', 'daily_points': 220, 'points': 1250},
            {'username': 'neon_blaster', 'display_name': 'Neon Blaster ⚡', 'preset': 'bot_3', 'daily_points': 90, 'points': 540},
            {'username': 'quantum_fox', 'display_name': 'Quantum Fox 🦊', 'preset': 'bot_4', 'daily_points': 180, 'points': 970},
            {'username': 'star_coder', 'display_name': 'Star Coder ✨', 'preset': 'bot_5', 'daily_points': 60, 'points': 310},
            {'username': 'glitch_master', 'display_name': 'Glitch Master 👾', 'preset': 'bot_6', 'daily_points': 310, 'points': 1680},
        ]

        created = 0
        for r in rivals_data:
            user, was_created = User.objects.get_or_create(username=r['username'])
            if was_created:
                user.set_password('rivalpass123')
                user.save()
            profile = user.profile
            profile.display_name = r['display_name']
            profile.avatar_preset = r['preset']
            profile.daily_points = r['daily_points']
            profile.points = r['points']
            profile.save()
            created += 1

        # Also create a sample past day in history
        yesterday = timezone.localdate() - timedelta(days=1)
        for rank, r in enumerate(sorted(rivals_data, key=lambda x: x['points'], reverse=True), start=1):
            u = User.objects.get(username=r['username'])
            DailyRecord.objects.update_or_create(
                user=u,
                date=yesterday,
                defaults={'points': r['points'] // 2, 'rank': rank, 'clicks_given': 15, 'clicks_received': 20}
            )

        trigger_game_update()
        return Response({'message': f'Successfully seeded {created} rival players and past history!'})
