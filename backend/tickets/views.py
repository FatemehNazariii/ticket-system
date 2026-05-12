from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Ticket, Message, Category
from .serializers import TicketSerializer, MessageSerializer, CategorySerializer
from rest_framework import permissions

class IsAgentOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # به جای role، از is_staff استفاده می‌کنیم
        return request.user.is_staff

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'change_status']:
            return [IsAgentOrAdmin()]   # IsAgentOrAdmin اکنون بر اساس is_staff است
        return [permissions.IsAuthenticated()]

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_staff:
            return Ticket.objects.filter(user=user)
        qs = Ticket.objects.all()
        # جستجو و فیلتر وضعیت (اختیاری)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
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
        if new_status not in ['open', 'pending', 'closed', 'revision']:
            return Response({'error': 'وضعیت نامعتبر'}, status=400)
        ticket.status = new_status
        ticket.save()
        return Response(TicketSerializer(ticket).data)