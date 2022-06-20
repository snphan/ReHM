from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from accounts import models as account_models
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.shortcuts import redirect

import json
import channels
from asgiref.sync import async_to_sync

# Create your views here.
class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard/dashboard.html"
    def dispatch(self, request, *args, **kwargs):
        patients = account_models.GridLayout.objects.filter(provider=request.user.id).values()
        patient_ids = set([patient['patient_id'] for patient in patients])
        if kwargs['patient_id'] not in patient_ids:
            return redirect("dashboard:index")


        return super(DashboardView, self).dispatch(request, *args, **kwargs)

class GotoDashboardView(LoginRequiredMixin, TemplateView):
    template_name = "dashboard/index.html"

    # Override the dashboard view
    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        patients = account_models.GridLayout.objects.filter(provider=request.user.id).values()
        patient_ids = set([patient['patient_id'] for patient in patients])
        
        context.update({'patients': patient_ids})
        return self.render_to_response(context)

@csrf_exempt
def insertData(request, patient_id):
    if request.method == "POST":
        print(request.body)
        data = json.loads(request.body)
        channel_layer = channels.layers.get_channel_layer()

        async_to_sync(channel_layer.group_send)(str(patient_id), {
            "type": "patient_data",
            "message": data
        })
        return HttpResponse("received.")