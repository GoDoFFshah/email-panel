"""
Main URL configuration.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Email Panel API",
        default_version='v1',
        description="Professional Email Management Panel API",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@emailpanel.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Rosetta (ترجمه‌های پنل ادمین)
    path('rosetta/', include('rosetta.urls')),
    
    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API
    path('api/', include([
        # Auth
        path('auth/', include('apps.accounts.urls')),
        path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
        
        # Apps
        path('senders/', include('apps.senders.urls')),
        path('recipients/', include('apps.recipients.urls')),
        path('categories/', include('apps.categories.urls')),
        path('emails/', include('apps.emails.urls')),
        path('admin-panel/', include('apps.admin_panel.urls')),
        path('dashboard/', include('apps.core.urls')),
        path('notifications/', include('apps.notifications.urls')),
    ])),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)