"""
Core URL patterns.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('activities/', views.RecentActivitiesView.as_view(), name='recent-activities'),
]