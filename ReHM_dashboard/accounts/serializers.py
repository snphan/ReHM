from rest_framework import serializers, validators
from . import models
from rest_framework.utils import html, model_meta

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ReHMUser
        fields = (  
                    'email',
                    'first_name', 
                    'last_name', 
                )

class DeviceSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(read_only=False,
                                                queryset=models.ReHMUser.objects.all(),
                                            )

    class Meta:
        model = models.Device
        fields = (
            'id',
            'serial',
            'deviceType',
            'user_id',
        )
    
    def create(self, validated_data):
        user_id = validated_data['user_id'].id
        validated_data['user_id'] = user_id
        ModelClass = self.Meta.model

        # Remove many-to-many relationships from validated_data.
        # They are not valid arguments to the default `.create()` method,
        # as they require that the instance has already been saved.
        info = model_meta.get_field_info(ModelClass)
        many_to_many = {}
        for field_name, relation_info in info.relations.items():
            if relation_info.to_many and (field_name in validated_data):
                many_to_many[field_name] = validated_data.pop(field_name)
        try:
            instance = ModelClass._default_manager.create(**validated_data)
        except TypeError as e:
            raise TypeError(e)
        return instance


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
            'id',
            'provider',
            'patient',
            'show',
            'i',
            'x',
            'y',
            'w',
            'h',
            'static'
        )
        validators = [
            validators.UniqueTogetherValidator(
                queryset=models.GridLayout.objects.all(),
                fields=['provider', 'patient', 'i']
            )
        ]

class AxesSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Axes
        fields = (
            'name',
        )

class SensorDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SensorData
        fields = (
            "patient",
            "device",
            "data_type",
            "timestamp",
            "val"
        )