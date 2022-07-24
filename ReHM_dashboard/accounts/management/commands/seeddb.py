"""
Manage.py function to seed the database with basic datatypes.
"""
import accounts.models as models
from django.core.management.base import BaseCommand
import os
from datetime import datetime
import time

class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('--gen_data', type=int, help="Input the number (int) of data to generate.")
        parser.add_argument('--fresh', type=str, help="Start fresh? y/n")

    def handle(self, *args, **options):

        # Fresh Database Seed
        if options['fresh'] and options['fresh'].lower() == 'y':
            models.SensorData.objects.all().delete()
            models.Device.objects.all().delete()
            models.DeviceType.objects.all().delete()
            models.DataType.objects.all().delete()
            models.Axes.objects.all().delete()
            models.ReHMUser.objects.all().delete()

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
        devices = [
            ('TESTFITBI12345', 'Fitbit Versa 3', 'admin@gmail.com'),
            ('TESTAPPLE12345', 'Apple Watch 7', 'admin@gmail.com'),
            ('TESTPOLAR12345', 'Polar H 10', 'admin@gmail.com'),
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
            new_axis, created = models.Axes.objects.get_or_create(name=name)
            new_axes.append(new_axis)
            if created:
                new_axis.save()

        # Create Datatypes
        datatype_objs = []
        for data_info in datatypes:
            name = data_info[0]
            units = data_info[1]
            axes = data_info[2]

            new_datatype, created = models.DataType.objects.get_or_create(name=name, units=units)
            datatype_objs.append(new_datatype)
            if created:
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
            if created:
                new_devicetype.save()
                for datatype in datatypes:
                    new_devicetype.dataType.add(datatype)

        # Make test devices
        device_objs = []
        for device_info in devices:
            serial = device_info[0]
            deviceType = models.DeviceType.objects.get(name=device_info[1])
            user = models.ReHMUser.objects.get(email=device_info[2])
        
            new_device, created = models.Device.objects.get_or_create(
                serial=serial,
                deviceType=deviceType,
                user=user
            )
            device_objs.append(new_device)
            if created:
                new_device.save()


        if options['gen_data']: 
            START_TIME = int(time.time())
            DATA_NUM = options['gen_data']
            CHUNK_SIZE = 1000
            print(f"Generate {options['gen_data']} Data For Each Device")
            for device_obj in device_objs:
                for datatype_obj in datatype_objs:
                    data = [
                        models.SensorData(
                            patient=new_user,
                            device=device_obj,
                            data_type=datatype_obj,
                            timestamp=datetime.utcfromtimestamp(START_TIME + i),
                            val=str([1])
                        )
                        for i in range(DATA_NUM)
                    ]

                    for k in range(0, len(data), CHUNK_SIZE):
                        models.SensorData.objects.bulk_create(data[k:k+CHUNK_SIZE])


        print(f"Seeded Database!")


