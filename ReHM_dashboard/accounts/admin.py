
from django.contrib import admin
from django import forms
from . import models

from django.contrib.admin.widgets import FilteredSelectMultiple
from django.contrib.auth.forms import UserCreationForm
# Register your models here.

admin.site.register(models.DataType)
admin.site.register(models.DeviceType)
admin.site.register(models.Device)
admin.site.register(models.Axes)
admin.site.register(models.SensorData)
admin.site.register(models.GridLayout)

class DeviceInline(admin.TabularInline):
    model = models.Device

# Custom form to show Reverse Foreign Key.
class ReHMUserForm(UserCreationForm):
    devices = forms.ModelMultipleChoiceField(
        queryset=models.Device.objects.filter(user_id__isnull=True),
        widget=FilteredSelectMultiple(verbose_name="devices", is_stacked=False),
        required=False
    )

    class Meta:
        model = models.ReHMUser
        fields = ['email',
                  'first_name',
                  'last_name',
                  'mobile_number',
                  'is_active',
                  'is_staff']

    def __init__(self, *args, **kwargs):
        super(ReHMUserForm, self).__init__(*args, **kwargs)
        if self.instance:
            self.fields['devices'].initial = self.instance.device_set.all()

@admin.register(models.ReHMUser)
class ReHMUserAdminView(admin.ModelAdmin):

    form = ReHMUserForm
    # Save the devices selected in our Custom Form
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        original_devices = set(obj.device_set.values_list("id", flat=True))
        current_devices = set(map(lambda x: x.id, form.cleaned_data['devices']))
        if original_devices != current_devices:
            add_to_user = current_devices - original_devices
            models.Device.objects.filter(id__in=add_to_user).update(user_id=obj.id)
            remove_from_user = original_devices - current_devices
            models.Device.objects.filter(id__in=remove_from_user).update(user_id=None)


    list_display = ('email', 'first_name', 'device')

    def device(self, obj):
        return ', '.join([c.serial for c in models.Device.objects.filter(user_id=obj.id)])


