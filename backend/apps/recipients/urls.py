"""
Recipient URL patterns.
"""

from rest_framework.routers import DefaultRouter
from .views import RecipientViewSet

router = DefaultRouter()
router.register('', RecipientViewSet, basename='recipient')

urlpatterns = router.urls