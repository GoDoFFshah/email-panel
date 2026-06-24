"""
Custom permission classes.
"""

from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'super_admin'

class IsAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.user_type in ['admin', 'super_admin']


class IsOwner(permissions.BasePermission):
    """Allow access only to the owner."""
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        return False


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow access to owners or admins."""
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.user_type in ['admin', 'super_admin']:
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class HasActiveAccount(permissions.BasePermission):
    """Check if user has an active account."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.account_status == 'active'


class CanSendEmail(permissions.BasePermission):
    """Check if user can send emails."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.account_status != 'active':
            return False
        if request.user.locked_until and request.user.locked_until > timezone.now():
            return False
        return True


class HasEmailQuota(permissions.BasePermission):
    """Check if user has remaining email quota."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        from apps.senders.models import Sender
        total_quota = sum(
            s.remaining_quota() for s in Sender.objects.filter(
                user=request.user, is_active=True
            )
        )
        return total_quota > 0


class RateLimitPermission(permissions.BasePermission):
    """Rate limiting permission."""
    
    def has_permission(self, request, view):
        from django.core.cache import cache
        
        if not request.user.is_authenticated:
            return True
        
        key = f"rate_limit_user_{request.user.id}"
        count = cache.get(key, 0)
        
        if count >= 100:  # 100 requests per minute
            return False
        
        cache.set(key, count + 1, 60)
        return True