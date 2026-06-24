"""
Recipient views.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Recipient
from .serializers import RecipientSerializer
from apps.core.permissions import IsOwner, HasActiveAccount
from apps.accounts.models import UserActivityLog


class RecipientViewSet(viewsets.ModelViewSet):
    """Recipient CRUD operations."""
    
    serializer_class = RecipientSerializer
    permission_classes = [IsOwner, HasActiveAccount]
    
    def get_queryset(self):
        return Recipient.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
        UserActivityLog.objects.create(
            user=self.request.user,
            action='create_recipient',
            details={'email': serializer.instance.email},
            ip_address=self.get_client_ip(self.request)
        )
    
    @action(detail=False, methods=['post'])
    def import_bulk(self, request):
        """Import multiple recipients."""
        emails = request.data.get('emails', [])
        
        created = 0
        invalid = []
        
        for email in emails:
            if not email or '@' not in email:
                invalid.append(email)
                continue
            
            try:
                Recipient.objects.get_or_create(
                    user=request.user,
                    email=email
                )
                created += 1
            except Exception:
                invalid.append(email)
        
        UserActivityLog.objects.create(
            user=request.user,
            action='import_recipients_bulk',
            details={'created': created, 'invalid': len(invalid)},
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'created': created,
            'invalid': invalid[:10]
        })
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Clear all recipients."""
        count = self.get_queryset().count()
        self.get_queryset().delete()
        
        UserActivityLog.objects.create(
            user=request.user,
            action='clear_all_recipients',
            details={'deleted': count},
            ip_address=self.get_client_ip(request)
        )
        
        return Response({'deleted': count})
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')