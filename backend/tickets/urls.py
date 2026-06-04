from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, CategoryViewSet, NotificationViewSet, KnowledgeArticleViewSet
router = DefaultRouter()
router.register('tickets', TicketViewSet, basename='ticket')
router.register('categories', CategoryViewSet, basename='category')
router.register('notifications', NotificationViewSet, basename='notification')
router.register(r'knowledge', KnowledgeArticleViewSet, basename='knowledge')
urlpatterns = [
    path('', include(router.urls)),
]