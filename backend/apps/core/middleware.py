"""
Custom middleware for security and activity logging.
"""

from django.utils import timezone
from django.core.cache import cache
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from apps.accounts.models import UserActivityLog
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class ActivityLogMiddleware:
    """Log user activities."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        if request.user.is_authenticated:
            # Log API calls
            if request.path.startswith('/api/'):
                try:
                    UserActivityLog.objects.create(
                        user=request.user,
                        action=f"{request.method} {request.path}",
                        details={
                            'method': request.method,
                            'path': request.path,
                            'query_params': dict(request.GET),
                            'status_code': response.status_code
                        },
                        ip_address=self.get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')
                    )
                except Exception as e:
                    logger.error(f"Failed to log activity: {e}")
            
            # Update last activity
            try:
                request.user.last_activity = timezone.now()
                request.user.save(update_fields=['last_activity'])
            except Exception as e:
                logger.error(f"Failed to update last activity: {e}")
        
        return response
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class SecurityMiddleware:
    """Security monitoring and blocking."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        ip = self.get_client_ip(request)
        
        # Check if IP is blocked
        if self.is_ip_blocked(ip):
            logger.warning(f"Blocked request from {ip}")
            return JsonResponse(
                {'error': 'Your IP has been blocked due to suspicious activity.'},
                status=403
            )
        
        # Rate limiting per IP
        if self.is_rate_limited(ip):
            return JsonResponse(
                {'error': 'Too many requests. Please try again later.'},
                status=429
            )
        
        response = self.get_response(request)
        
        # Log suspicious requests
        if response.status_code >= 400:
            self.log_suspicious_request(request, response)
        
        return response
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')
    
    def is_ip_blocked(self, ip):
        """Check if IP is in blocklist."""
        blocked_ips = cache.get('blocked_ips', [])
        return ip in blocked_ips
    
    def is_rate_limited(self, ip):
        """Check rate limiting per IP."""
        key = f'rate_limit_ip:{ip}'
        count = cache.get(key, 0)
        
        if count >= 100:  # 100 requests per minute
            return True
        
        cache.set(key, count + 1, 60)
        return False
    
    def log_suspicious_request(self, request, response):
        """Log suspicious requests."""
        if response.status_code >= 500:
            logger.warning(
                f"Suspicious request: {request.method} {request.path} "
                f"from {self.get_client_ip(request)} - Status: {response.status_code}"
            )