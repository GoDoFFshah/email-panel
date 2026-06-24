"""
Celery configuration for email_panel project.
"""

import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'email_panel.settings')

app = Celery('email_panel')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Scheduled tasks
app.conf.beat_schedule = {
    # Reset daily quotas at midnight
    'reset-daily-quotas': {
        'task': 'apps.emails.tasks.reset_daily_quotas',
        'schedule': crontab(hour=0, minute=0),
    },
    # Clean up old logs every day at 2 AM
    'cleanup-old-logs': {
        'task': 'apps.core.tasks.cleanup_old_logs',
        'schedule': crontab(hour=2, minute=0),
    },
    # Check suspicious activity every hour
    'check-suspicious-activity': {
        'task': 'apps.admin_panel.tasks.check_suspicious_activity',
        'schedule': crontab(minute=0),
    },
    # Send scheduled campaigns every 5 minutes
    'send-scheduled-campaigns': {
        'task': 'apps.emails.tasks.send_scheduled_campaigns',
        'schedule': crontab(minute='*/5'),
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')