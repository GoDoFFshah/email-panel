"""
Category models for grouping recipients.
"""

from django.db import models
from apps.accounts.models import User
import uuid


class Category(models.Model):
    """Email category model."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    emails = models.JSONField(default=list, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'categories'
        unique_together = [['user', 'name']]
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({len(self.emails)} emails)"
    
    def add_emails(self, email_list):
        """Add emails to category."""
        current = set(self.emails)
        new_emails = [e for e in email_list if e not in current]
        self.emails.extend(new_emails)
        self.save()
        return len(new_emails)
    
    def remove_emails(self, email_list):
        """Remove emails from category."""
        current = set(self.emails)
        to_remove = set(email_list)
        self.emails = list(current - to_remove)
        self.save()
        return len(to_remove)