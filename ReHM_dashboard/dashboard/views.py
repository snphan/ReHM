from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin

# Create your views here.
class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard/dashboard.html"

class GotoDashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard/index.html"