from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.views import LoginView, LogoutView

# Login View Source Code imports
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.utils.decorators import method_decorator
from django.http import HttpResponseRedirect, QueryDict

# Create your views here.
class CustomLoginView(LoginView):
    template_name = "accounts/login.html"
    redirect_authenticated_user = True

class CustomLogoutView(LogoutView):
    pass
