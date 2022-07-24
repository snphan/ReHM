"""
Manage.py function to seed the database with basic datatypes.
"""
import accounts.models as models
from django.core.management.base import BaseCommand
import os

class Command(BaseCommand):
    def handle(self, *args, **options):
        # ==================================================
        # ADD CONSTANTS HERE!
        axes = ['x', 'y', 'z', 'none']
        datatypes = [
            ('HR', 'bpm', ['none']),
            ('ACCEL', 'm/s^2', ['x', 'y', 'z'])
        ]
        devicetypes = [
            ('Fitbit Versa 3', ['HR', 'ACCEL']),
            ('Apple Watch 7', ['HR', 'ACCEL']),
            ('Polar H 10', ['HR'])
        ]
        # ==================================================

        # Create an Admin user
        new_user, created = models.ReHMUser.objects.get_or_create(
            email='admin@gmail.com',
            first_name='admin',
            last_name='admin'
        )
        if created:
            new_user.set_password(os.environ.get("MONGO_DB_PWD"))
            new_user.is_staff = True
            new_user.is_superuser = True
            new_user.save()

        # Create Axis
        new_axes = []
        for name in axes:
            new_axes.append(models.Axes(name=name))
        models.Axes.objects.bulk_create(new_axes)

        # Create Datatypes
        for data_info in datatypes:
            name = data_info[0]
            units = data_info[1]
            axes = data_info[2]

            new_datatype, created = models.DataType.objects.get_or_create(name=name, units=units)
            new_datatype.save()
            for axis in axes:
                new_datatype.axes.add(axis)

        # Create device types
        for device_info in devicetypes:
            name = device_info[0]
            datatypes = device_info[1]
            
            new_devicetype, created = models.DeviceType.objects.get_or_create(
                name=name
            )
            new_devicetype.save()
            for datatype in datatypes:
                new_devicetype.dataType.add(datatype)

        print(f"Seeded Database!")


