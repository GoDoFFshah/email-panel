"""
WebSocket consumers for real-time updates.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import EmailCampaign

User = get_user_model()


class CampaignConsumer(AsyncWebsocketConsumer):
    """Campaign WebSocket consumer for real-time updates."""
    
    async def connect(self):
        self.user = self.scope.get('user')
        
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        
        self.group_name = f"user_{self.user.id}"
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle received messages."""
        data = json.loads(text_data)
        
        if data.get('action') == 'subscribe':
            campaign_id = data.get('campaign_id')
            if campaign_id:
                await self.subscribe_campaign(campaign_id)
    
    async def subscribe_campaign(self, campaign_id):
        """Subscribe to campaign updates."""
        # Verify campaign belongs to user
        campaign = await self.get_campaign(campaign_id)
        if not campaign:
            return
        
        self.campaign_group = f"campaign_{campaign_id}"
        await self.channel_layer.group_add(
            self.campaign_group,
            self.channel_name
        )
        
        # Send initial status
        status = await self.get_campaign_status(campaign_id)
        await self.send(text_data=json.dumps({
            'type': 'status',
            'data': status
        }))
    
    async def campaign_update(self, event):
        """Send campaign update to client."""
        await self.send(text_data=json.dumps({
            'type': 'campaign_update',
            'campaign_id': event['campaign_id'],
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_campaign(self, campaign_id):
        try:
            return EmailCampaign.objects.get(id=campaign_id, user=self.user)
        except EmailCampaign.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_campaign_status(self, campaign_id):
        try:
            campaign = EmailCampaign.objects.get(id=campaign_id, user=self.user)
            return {
                'status': campaign.status,
                'progress': campaign.progress(),
                'sent_count': campaign.sent_count,
                'total_recipients': campaign.total_recipients,
                'success_count': campaign.success_count,
                'failed_count': campaign.failed_count
            }
        except EmailCampaign.DoesNotExist:
            return None


class EmailSendConsumer(AsyncWebsocketConsumer):
    """Email send progress WebSocket consumer."""
    
    async def connect(self):
        self.user = self.scope.get('user')
        
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
        
        self.group_name = f"email_send_{self.user.id}"
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
    
    async def send_progress(self, event):
        """Send progress update."""
        await self.send(text_data=json.dumps({
            'type': 'send_progress',
            'campaign_id': event.get('campaign_id'),
            'current': event.get('current'),
            'total': event.get('total'),
            'status': event.get('status', 'sending'),
            'message': event.get('message', '')
        }))