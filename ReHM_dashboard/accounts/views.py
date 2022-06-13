import warnings

from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.views import LoginView, LogoutView

# Login/Logout View Source Code imports
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.utils.decorators import method_decorator
from django.http import HttpResponseRedirect, QueryDict
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib import messages 
from django.contrib.auth import logout as auth_logout
from django.utils.deprecation import RemovedInDjango50Warning

# REST API
from rest_framework import viewsets, generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from . import serializers
from . import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, IsAdminUser

# Create your views here.
class CustomLoginView(SuccessMessageMixin, LoginView):
    template_name = "accounts/login.html"
    success_message = "✅ You were successfully Logged In"
    redirect_authenticated_user = True

    # Add a warning message to authenticated users who try to go back to the 
    # login page 
    @method_decorator(sensitive_post_parameters())
    @method_decorator(csrf_protect)
    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        if self.redirect_authenticated_user and self.request.user.is_authenticated:
            redirect_to = self.get_success_url()
            if redirect_to == self.request.path:
                raise ValueError(
                    "Redirection loop for authenticated user detected. Check that "
                    "your LOGIN_REDIRECT_URL doesn't point to a login page."
                )
            # Add the message here
            messages.warning(request, '❌ You are already logged in.')
            return HttpResponseRedirect(redirect_to)
        return super().dispatch(request, *args, **kwargs)

class CustomLogoutView(LogoutView):
    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        auth_logout(request)
        next_page = self.get_next_page()
        if next_page:
            # Redirect to this page until the session has been cleared.
            messages.success(request, '✅ You have successfully logged out!')
            return HttpResponseRedirect(next_page)
        return super().dispatch(request, *args, **kwargs)


# MARK: APIs
# GET
# curl http://localhost:8000/accounts/api/Devices/?id=2
#
# CREATE
# curl -d '{"key1":"value1", "key2":"value2"}' 
#       -H "Content-Type: application/json" 
#       -X POST http://localhost:8000/accounts/api/Devices/
#
# UPDATE
# curl -d "{\"serial\": \"APPLE7ISBN3\", \"deviceType\": \"Apple Watch 7\", \"user_id\": 1}" 
#      -H "Content-Type: application/json" 
#      -X PUT http://localhost:8000/accounts/api/Devices/3/
# 

@api_view(["GET"])
def get_user_info(request, user_id):
    if request.method == "GET":

        try:
            user_info = serializers.UserSerializer(models.ReHMUser.objects.filter(id=user_id)[0]).data

            device_info = [serializers.DeviceSerializer(obj).data 
                                for obj in models.Device.objects.filter(user_id=user_id)]

            patient_info = [serializers.GridLayoutSerializer(obj).data 
                                for obj in models.GridLayout.objects.filter(provider_id=user_id)]

            device_types = set([device['deviceType'] for device in device_info])

            device_type_info = [serializers.DeviceTypeSerializer(
                                    models.DeviceType.objects.filter(name=device_type)[0]
                                ).data for device_type in device_types]

            data_types = []
            for obj in device_type_info:
                data_types += obj['dataType']
            data_types = set(data_types)

            axes_info = {data_type: serializers.DataTypeSerializer(
                                models.DataType.objects.filter(name=data_type)[0]).data['axes'] 
                                    for data_type in data_types}

            # Format the response
            user_info["devices"] = device_info
            user_info["patients"] = patient_info
            user_info["available_data"] = axes_info

            return Response(user_info)
        except IndexError as e:
            return Response({"status_code": "400", "detail": f"{e}. user_id = {user_id}."})
    return Response({"status_code": "400", "detail": f"Method {request.method} Is not available."})

class ReHMUserAPIView(viewsets.ModelViewSet):
    serializer_class = serializers.UserSerializer
    queryset = models.ReHMUser.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['email']
    permission_classes = (IsAdminUser, )

class DeviceAPIView(viewsets.ModelViewSet):
    serializer_class = serializers.DeviceSerializer
    queryset = models.Device.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id', 'serial', 'deviceType']
    permission_classes = (IsAuthenticated, )

class DeviceTypeAPIView(viewsets.ModelViewSet):
    serializer_class = serializers.DeviceTypeSerializer
    queryset = models.DeviceType.objects.all()
    permission_classes = (IsAuthenticated, )

class DataTypeAPIView(viewsets.ModelViewSet):
    serializer_class = serializers.DataTypeSerializer
    queryset = models.DataType.objects.all()
    permission_classes = (IsAuthenticated, )

# Query the provider to get all of the patients and their dashboard settings.
# curl "http://localhost:8000/accounts/api/GridLayout/?provider=1&patient=1"
class GridLayoutAPIView(viewsets.ModelViewSet):
    serializer_class = serializers.GridLayoutSerializer
    queryset = models.GridLayout.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['i', 'patient', 'provider']
    permission_classes = (IsAuthenticated, )

class AxesAPIView(viewsets.ModelViewSet):
    serializer_class =serializers.AxesSerializer
    queryset = models.Axes.objects.all()
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['name']
    permission_classes = (IsAuthenticated, )