from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Ticket, Message, Category
from .serializers import TicketSerializer, MessageSerializer, CategorySerializer

class IsAgentOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_staff  # یا request.user.is_superuser

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAgentOrAdmin()]
        return [permissions.IsAuthenticated()]

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.all()
        # کاربر عادی فقط تیکت‌های خودش رو می‌بینه
        if user.role == 'user':
            qs = qs.filter(user=user)
        # جستجو
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        # فیلتر وضعیت
        status_f = self.request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        # ارسال پیام به تیکت
        ticket = self.get_object()
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(ticket=ticket, author=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        # تغییر وضعیت تیکت
        ticket = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['open', 'pending', 'closed']:
            return Response({'error': 'وضعیت نامعتبر'}, status=400)
        ticket.status = new_status
        ticket.save()
        return Response(TicketSerializer(ticket).data)