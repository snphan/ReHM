import warnings

from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.views import LoginView, LogoutView

# Login/Logout View Source Code imports
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.utils.decorators import method_decorator
from django.http import HttpResponseRedirect, QueryDict
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib import messages 
from django.contrib.auth import logout as auth_logout
from django.utils.deprecation import RemovedInDjango50Warning


# Create your views here.
class CustomLoginView(SuccessMessageMixin, LoginView):
    template_name = "accounts/login.html"
    success_message = "✅ You were successfully Logged In"
    redirect_authenticated_user = True

    # Add a warning message to authenticated users who try to go back to the 
    # login page 
    @method_decorator(sensitive_post_parameters())
    @method_decorator(csrf_protect)
    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        if self.redirect_authenticated_user and self.request.user.is_authenticated:
            redirect_to = self.get_success_url()
            if redirect_to == self.request.path:
                raise ValueError(
                    "Redirection loop for authenticated user detected. Check that "
                    "your LOGIN_REDIRECT_URL doesn't point to a login page."
                )
            # Add the message here
            messages.warning(request, '❌ You are already logged in.')
            return HttpResponseRedirect(redirect_to)
        return super().dispatch(request, *args, **kwargs)

class CustomLogoutView(LogoutView):
    @method_decorator(never_cache)
    def dispatch(self, request, *args, **kwargs):
        auth_logout(request)
        next_page = self.get_next_page()
        if next_page:
            # Redirect to this page until the session has been cleared.
            messages.success(request, '✅ You have successfully logged out!')
            return HttpResponseRedirect(next_page)
        return super().dispatch(request, *args, **kwargs)
