from rest_framework import serializers
from . import models



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ReHMUser
        fields = (  
                    'email',
                    'first_name', 
                    'last_name', 
                    'is_active',
                    'is_staff',
                )

class DeviceSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(read_only=False,
                                                queryset=models.ReHMUser.objects.all())

    class Meta:
        model = models.Device
        fields = (
            'id',
            'serial',
            'deviceType',
            'user_id',
        )

class DeviceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.DeviceType
        fields = (
            'name',
            'dataType',
        )


class DataTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.DataType
        fields = (
            'name',
            'units',
            'axes'
        )

class GridLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.GridLayout
        fields = (
            'provider',
            'patient',
            'i',
            'x',
            'y',
            'w',
            'h',
            'static'
        )