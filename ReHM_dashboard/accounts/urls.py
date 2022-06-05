from django.urls import path
from django.views.generic import TemplateView

app_name = "accounts"

urlpatterns = [
    path('login/', TemplateView.as_view(template_name="accounts/index.html"), name="index"),
]