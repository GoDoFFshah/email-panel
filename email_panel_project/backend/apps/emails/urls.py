"""
Email URL patterns.
"""

from rest_framework.routers import DefaultRouter
from .views import EmailCampaignViewSet, EmailSendViewSet, RecipientTrackingViewSet

router = DefaultRouter()
router.register('campaigns', EmailCampaignViewSet, basename='campaign')
router.register('sends', EmailSendViewSet, basename='send')
router.register('tracking', RecipientTrackingViewSet, basename='tracking')

urlpatterns = router.urls