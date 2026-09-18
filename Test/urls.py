from django.urls import path
from Test.views import Renderuser

urlpatterns = [
    path('users/',Renderuser.as_view())
]
