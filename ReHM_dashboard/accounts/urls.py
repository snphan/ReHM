from django.urls import path, include
from django.views.generic import TemplateView
from . import views

from rest_framework import routers

router = routers.DefaultRouter()
router.register(r'ReHMUsers', views.ReHMUserAPIView, 'rehmuser')
router.register(r'Devices', views.DeviceAPIView, 'device')
router.register(r'DeviceTypes', views.DeviceTypeAPIView, 'devicetype')
router.register(r'DataTypes', views.DataTypeAPIView, 'datatype')
router.register(r'GridLayout', views.GridLayoutAPIView, 'gridlayouts')

app_name = "accounts"

urlpatterns = [
    path('login/', views.CustomLoginView.as_view(), name="login"),
    path('logout/', views.CustomLogoutView.as_view(), name="logout"),
    path('', views.CustomLoginView.as_view(), name="index"),
    path('api/', include(router.urls))
]