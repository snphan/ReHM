from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from accounts import models as account_models

# Create your views here.
class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard/dashboard.html"

class GotoDashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard/index.html"

    # Override the dashboard view
    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        all_users = account_models.ReHMUser.objects.all()
        patients = account_models.GridLayout.objects.filter(provider=request.user.id).values()
        patient_ids = set([patient['patient_id'] for patient in patients])
        
        context.update({'patients': patient_ids})
        return self.render_to_response(context)