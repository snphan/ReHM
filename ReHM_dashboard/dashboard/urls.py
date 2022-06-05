from django.urls import path
from . import views

app_name = "dashboard"

urlpatterns = [
    path('<str:patient_id>/', views.DashboardView.as_view(), name="index"),
]