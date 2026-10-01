from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from game.models import UserProfile, DailyRecord, ClickEvent


class GameBackendTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(username='alice', password='password123')
        self.user_b = User.objects.create_user(username='bob', password='password123')

    def test_registration_and_profile(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'charlie',
            'password': 'secretpassword',
            'display_name': 'Charlie Champ',
            'avatar_preset': 'bot_3'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['effective_display_name'], 'Charlie Champ')

    def test_login_and_current_user(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'alice',
            'password': 'password123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['token']

        # Access /api/auth/me/ with token
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)
        me_res = self.client.get('/api/auth/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['username'], 'alice')

    def test_click_mechanics_option_a(self):
        # Alice logs in and clicks Bob
        login_res = self.client.post('/api/auth/login/', {'username': 'alice', 'password': 'password123'}, format='json')
        token = login_res.data['token']
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)

        # Click Bob
        click_res = self.client.post('/api/game/click/', {'target_user_id': self.user_b.id}, format='json')
        self.assertEqual(click_res.status_code, status.HTTP_200_OK)
        self.assertEqual(click_res.data['points_gained'], 10)
        self.assertEqual(click_res.data['my_daily_points'], 10)

        # Verify Bob cannot be clicked by himself
        self_click_res = self.client.post('/api/game/click/', {'target_user_id': self.user_a.id}, format='json')
        self.assertEqual(self_click_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bar_chart_and_limiter(self):
        # Set some high points to test dynamic scaling
        self.user_a.profile.daily_points = 500
        self.user_a.profile.save()
        self.user_b.profile.daily_points = 100
        self.user_b.profile.save()

        response = self.client.get('/api/game/bars/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        bars = response.data['bars']
        self.assertEqual(len(bars), 2)
        # Verify rank 1 is alice
        self.assertEqual(bars[0]['username'], 'alice')
        self.assertEqual(bars[0]['rank'], 1)
        # Ensure heights are constrained within 12% to 88%
        self.assertTrue(12.0 <= bars[0]['height_percentage'] <= 88.0)
        self.assertTrue(12.0 <= bars[1]['height_percentage'] <= 88.0)

    def test_daily_rollover_and_history(self):
        self.user_a.profile.daily_points = 250
        self.user_a.profile.save()

        # Trigger rollover
        rollover_res = self.client.post('/api/game/rollover/', {'date': '2026-09-22'}, format='json')
        self.assertEqual(rollover_res.status_code, status.HTTP_200_OK)

        # Verify history list
        history_list = self.client.get('/api/game/history/')
        self.assertEqual(history_list.status_code, status.HTTP_200_OK)
        self.assertTrue(len(history_list.data) >= 1)

        # Verify history detail for that date
        detail_res = self.client.get('/api/game/history/detail/?date=2026-09-22')
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_res.data['standings'][0]['username'], 'alice')
