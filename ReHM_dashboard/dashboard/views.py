from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from accounts import models as account_models
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.shortcuts import redirect
from datetime import datetime

import json
import channels
from asgiref.sync import async_to_sync

import accounts.models as accnt_models

# Prefetch all of the users
users = list(accnt_models.ReHMUser.objects.all())
device = list(accnt_models.Device.objects.all())
datatypes = list(accnt_models.DataType.objects.all())


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
        data = json.loads(request.body)
        channel_layer = channels.layers.get_channel_layer()
        current_user = list(filter(lambda x: x.id==patient_id, users))[0]
        for one_data in data:
            current_device = list(filter(lambda x: x.serial==one_data["device_serial"], device))[0]
            current_data_type = list(filter(lambda x: x.name==one_data["dataType"], datatypes))[0]
            data_obj = accnt_models.SensorData(
                patient=current_user,
                device=current_device,
                data_type=current_data_type,
                timestamp=datetime.utcfromtimestamp(one_data["timestamp"]/1000),
                val=str(one_data["dataValues"])
            )
            data_obj.save() 

        async_to_sync(channel_layer.group_send)(str(patient_id), {
            "type": "patient_data",
            "message": data
        })
        return HttpResponse("received.")