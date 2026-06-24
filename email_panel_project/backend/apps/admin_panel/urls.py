"""
Admin panel URL patterns.
"""

from rest_framework.routers import DefaultRouter
from .views import AdminPanelViewSet

router = DefaultRouter()
router.register('', AdminPanelViewSet, basename='admin-panel')

urlpatterns = router.urls