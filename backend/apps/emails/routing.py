"""
WebSocket routing for emails.
"""

from django.urls import re_path
from .consumers import CampaignConsumer, EmailSendConsumer

websocket_urlpatterns = [
    re_path(r'ws/campaign/(?P<campaign_id>[^/]+)/$', CampaignConsumer.as_asgi()),
    re_path(r'ws/email-send/(?P<user_id>[^/]+)/$', EmailSendConsumer.as_asgi()),
]