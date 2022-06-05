from django.urls import path
from django.views.generic import TemplateView
from . import views

app_name = "accounts"

urlpatterns = [
    path('login/', views.LoginView.as_view(), name="login"),
    path('', views.LoginView.as_view(), name="index"),
]