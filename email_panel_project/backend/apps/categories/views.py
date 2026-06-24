"""
Category management views.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Category
from .serializers import CategorySerializer, CategoryImportSerializer
from apps.accounts.models import UserActivityLog
import json


class CategoryViewSet(viewsets.ModelViewSet):
    """Category CRUD operations."""
    
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # ✅ این متد باید وجود داشته باشد
    def get_queryset(self):
        """Return categories for the current user."""
        return Category.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
        UserActivityLog.objects.create(
            user=self.request.user,
            action='create_category',
            details={'name': serializer.instance.name},
            ip_address=self.get_client_ip(self.request)
        )
    
    @action(detail=True, methods=['post'])
    def add_emails(self, request, pk=None):
        """Add emails to category."""
        category = self.get_object()
        serializer = CategoryImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        emails = serializer.validated_data['emails']
        added = category.add_emails(emails)
        
        UserActivityLog.objects.create(
            user=request.user,
            action='add_emails_to_category',
            details={
                'category': category.name,
                'added': added
            },
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'added': added,
            'total': len(category.emails)
        })
    
    @action(detail=True, methods=['post'])
    def remove_emails(self, request, pk=None):
        """Remove emails from category."""
        category = self.get_object()
        emails = request.data.get('emails', [])
        
        removed = category.remove_emails(emails)
        
        UserActivityLog.objects.create(
            user=request.user,
            action='remove_emails_from_category',
            details={
                'category': category.name,
                'removed': removed
            },
            ip_address=self.get_client_ip(request)
        )
        
        return Response({
            'removed': removed,
            'total': len(category.emails)
        })
    
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """Export category emails as txt file."""
        category = self.get_object()
        
        content = '\n'.join(category.emails)
        response = HttpResponse(content, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="{category.name}.txt"'
        
        return response
    
    @action(detail=False, methods=['post'])
    def import_file(self, request):
        """Import emails from file."""
        if 'file' not in request.FILES:
            return Response({
                'error': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        category_name = request.data.get('category')
        
        try:
            content = file.read().decode('utf-8')
            emails = [e.strip() for e in content.splitlines() if e.strip() and '@' in e]
            
            category, created = Category.objects.get_or_create(
                user=request.user,
                name=category_name or 'Imported'
            )
            
            added = category.add_emails(emails)
            
            return Response({
                'category': category.name,
                'created': created,
                'added': added,
                'total': len(category.emails)
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')