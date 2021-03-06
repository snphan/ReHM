# Generated by Django 4.0.5 on 2022-06-19 06:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_gridlayout_devicetype_gridlayout_show'),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name='gridlayout',
            name='unique_provider_patient_combination',
        ),
        migrations.AddConstraint(
            model_name='gridlayout',
            constraint=models.UniqueConstraint(fields=('provider', 'patient', 'i', 'deviceType'), name='unique_provider_patient_combination'),
        ),
    ]
