from django import forms
from django.contrib.auth.models import BaseUserManager, PermissionsMixin, AbstractBaseUser
from django.db import models
from djongo import models as djongo_models

class UserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, password):
        user = self.model(email=self.normalize_email(email))
        user.first_name = first_name
        user.last_name = last_name
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, first_name, last_name, password):
        user = self.create_user(email, first_name, last_name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return user

class Axes(models.Model):
    name = models.CharField(max_length=20, primary_key=True)

    def __str__(self):
        return f'axes = {self.name}'

class DataType(models.Model):
    name = models.CharField(max_length=20, primary_key=True)
    units = models.CharField(max_length=20)
    axes = models.ManyToManyField(Axes)

    def __str__(self):
        return f"{self.name} ({self.units})"

class DeviceType(models.Model):
    name = models.CharField(max_length=100, primary_key=True)
    dataType = models.ManyToManyField(DataType)

    def __str__(self):
        return self.name

class ReHMUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(null=False, unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    mobile_number = models.CharField(max_length=10, unique=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        return self.email

class Device(models.Model):
    serial = models.CharField(null=False, max_length=100)
    deviceType = models.ForeignKey(DeviceType, on_delete=models.SET_NULL, null=True)
    user = models.ForeignKey(ReHMUser, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f'{self.deviceType} | {self.serial}'

class GridLayout(models.Model):
    provider = models.ForeignKey(ReHMUser, 
                                on_delete=models.CASCADE,
                                related_name="provider")
    patient = models.ForeignKey(ReHMUser, 
                                on_delete=models.CASCADE,
                                related_name="patient")
    deviceType = models.ForeignKey(DeviceType, on_delete=models.SET_NULL, null=True)
    show = models.BooleanField()
    i = models.ForeignKey(DataType, on_delete=models.CASCADE)
    x = models.IntegerField()
    y = models.IntegerField()
    w = models.IntegerField()
    h = models.IntegerField()
    static = models.BooleanField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "patient", "i"], 
                name="unique_provider_patient_combination"
            )
        ]

class SensorData(models.Model):
    data_id = models.AutoField(primary_key=True)
    patient = models.ForeignKey(ReHMUser, on_delete=models.PROTECT)
    device = models.ForeignKey(Device, on_delete=models.PROTECT)
    data_type = models.ForeignKey(DataType, on_delete=models.PROTECT)
    timestamp = models.DateTimeField()
    val = models.CharField(max_length=200)

    def __str__(self):
        return f"[{self.timestamp}] : {self.val}"
