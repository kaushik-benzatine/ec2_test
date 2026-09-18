from django.http import HttpResponse
from django.shortcuts import render
from rest_framework import views


class Renderuser(views.APIView):
  def get(self, request):
    return HttpResponse("User rendered")
