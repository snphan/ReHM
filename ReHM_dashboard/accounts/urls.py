from django.urls import path
from django.views.generic import TemplateView
from . import views

app_name = "accounts"

urlpatterns = [
    path('login/', views.CustomLoginView.as_view(), name="login"),
    path('logout/', views.CustomLogoutView.as_view(), name="logout"),
    path('', views.CustomLoginView.as_view(), name="index"),
]