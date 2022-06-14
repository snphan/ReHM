from django.urls import path
from . import views
from django.http import HttpResponse

app_name = "dashboard"

urlpatterns = [
    path('', views.GotoDashboardView.as_view(), name="index"),
    path('<int:patient_id>/', views.DashboardView.as_view(), name="info"),
]