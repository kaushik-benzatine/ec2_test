from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from game.models import UserProfile, DailyRecord, ClickEvent


class UserProfileSerializer(serializers.ModelSerializer):
    effective_display_name = serializers.ReadOnlyField()
    avatar_url = serializers.ReadOnlyField()
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'user_id',
            'username',
            'display_name',
            'effective_display_name',
            'avatar',
            'avatar_preset',
            'avatar_url',
            'points',
            'daily_points',
            'clicks_given',
            'clicks_received',
            'last_active_date',
        ]
        read_only_fields = ['points', 'daily_points', 'clicks_given', 'clicks_received', 'last_active_date']


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=4)
    display_name = serializers.CharField(required=False, allow_blank=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    avatar_preset = serializers.CharField(required=False, default='bot_1')

    class Meta:
        model = User
        fields = ['username', 'password', 'display_name', 'avatar', 'avatar_preset']

    def create(self, validated_data):
        password = validated_data.pop('password')
        display_name = validated_data.pop('display_name', '')
        avatar = validated_data.pop('avatar', None)
        avatar_preset = validated_data.pop('avatar_preset', 'bot_1')

        user = User.objects.create_user(
            username=validated_data['username'],
            password=password
        )
        
        # Profile is created via signal, update extra fields
        profile = user.profile
        profile.display_name = display_name or user.username
        profile.avatar_preset = avatar_preset
        if avatar:
            profile.avatar = avatar
        profile.save()

        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=4)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password does not match.")
        return value


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['display_name', 'avatar', 'avatar_preset']


class BarChartItemSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    display_name = serializers.CharField()
    avatar_url = serializers.CharField()
    daily_points = serializers.IntegerField()
    lifetime_points = serializers.IntegerField()
    rank = serializers.IntegerField()
    height_percentage = serializers.FloatField()
    clicks_given = serializers.IntegerField()
    clicks_received = serializers.IntegerField()
    is_current_user = serializers.BooleanField(default=False)


class DailyRecordSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    display_name = serializers.CharField(source='user.profile.effective_display_name', read_only=True)
    avatar_url = serializers.CharField(source='user.profile.avatar_url', read_only=True)

    class Meta:
        model = DailyRecord
        fields = [
            'id',
            'user_id',
            'username',
            'display_name',
            'avatar_url',
            'date',
            'points',
            'rank',
            'clicks_given',
            'clicks_received',
            'created_at',
        ]
