"""
Recipient models (legacy support).
"""

from django.db import models
from apps.accounts.models import User
import uuid


class Recipient(models.Model):
    """Legacy recipient model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recipients')
    
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'recipients'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email