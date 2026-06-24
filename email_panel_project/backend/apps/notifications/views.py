from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer
from apps.core.permissions import IsOwner


class NotificationViewSet(viewsets.ModelViewSet):
    """مدیریت اعلان‌ها"""
    
    serializer_class = NotificationSerializer
    permission_classes = [IsOwner]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        """علامت‌گذاری یک اعلان به عنوان خوانده شده"""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """علامت‌گذاری همه اعلان‌ها به عنوان خوانده شده"""
        self.get_queryset().filter(is_read=False).update(is_read=True, read_at=timezone.now())
        return Response({'status': 'all marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """تعداد اعلان‌های خوانده نشده"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})