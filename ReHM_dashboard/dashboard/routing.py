from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
	 # Use re_path so that we can route the ws/chat... part
    re_path(r'ws/data/(?P<room_name>\w+)/$', consumers.DataConsumer.as_asgi()), 
]