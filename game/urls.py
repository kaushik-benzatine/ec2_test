from django.urls import path
from game.views import (
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    ProfileUpdateView,
    ChangePasswordView,
    LiveBarChartView,
    ClickUserView,
    RealtimeStreamView,
    DailyHistoryListView,
    DailyHistoryDetailView,
    DailyRolloverView,
    SeedRivalsView,
)

urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),
    path('auth/profile/', ProfileUpdateView.as_view(), name='auth_profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),

    # Game endpoints
    path('game/bars/', LiveBarChartView.as_view(), name='game_bars'),
    path('game/click/', ClickUserView.as_view(), name='game_click'),
    path('game/stream/', RealtimeStreamView.as_view(), name='game_stream'),
    path('game/history/', DailyHistoryListView.as_view(), name='game_history_list'),
    path('game/history/detail/', DailyHistoryDetailView.as_view(), name='game_history_detail'),
    path('game/rollover/', DailyRolloverView.as_view(), name='game_rollover'),
    path('game/seed/', SeedRivalsView.as_view(), name='game_seed'),
]
