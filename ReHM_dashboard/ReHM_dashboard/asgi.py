"""
ASGI config for ReHM_dashboard project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.0/howto/deployment/asgi/
"""

import os

import django

from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

import dashboard.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ReHM_dashboard.settings')
django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            dashboard.routing.websocket_urlpatterns
        )
    )
})