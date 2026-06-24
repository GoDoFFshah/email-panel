"""
Sender URL patterns.
"""

from rest_framework.routers import DefaultRouter
from .views import SenderViewSet, SenderGroupViewSet

router = DefaultRouter()
router.register('', SenderViewSet, basename='sender')
router.register('groups', SenderGroupViewSet, basename='sender-group')

urlpatterns = router.urls