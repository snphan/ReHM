from django.urls import path, include, re_path
from django.views.generic import TemplateView
from . import views

from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'rehmuser', views.ReHMUserAPIView, 'rehmuser')
router.register(r'device', views.DeviceAPIView, 'device')
router.register(r'devicetype', views.DeviceTypeAPIView, 'devicetype')
router.register(r'datatype', views.DataTypeAPIView, 'datatype')
router.register(r'gridlayout', views.GridLayoutAPIView, 'gridlayout')
router.register(r'axes', views.AxesAPIView, 'axes')
router.register(r'sensordata', views.SensorDataAPIView, 'sensordata')

app_name = "accounts"

urlpatterns = [
    path('login/', views.CustomLoginView.as_view(), name="login"),
    path('logout/', views.CustomLogoutView.as_view(), name="logout"),
    path('', views.CustomLoginView.as_view(), name="index"),
    path('api/', include(router.urls)),
    path('api/user_info/<int:provider_id>/<int:patient_id>/', views.get_user_info)
]