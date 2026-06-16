from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone
import requests
from django.http import HttpResponse
from openpyxl import Workbook
from .models import Ticket, Message, Category, Notification, ActivityLog, KnowledgeArticle
from .serializers import TicketSerializer, MessageSerializer, CategorySerializer, NotificationSerializer, KnowledgeArticleSerializer
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class IsAgentOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_staff or getattr(request.user, 'role', None) in ['agent', 'admin']


def notify_ticket(ticket_id, type, message):
    try:
        requests.post('http://localhost:4000/notify/ticket',
                      json={'ticket_id': ticket_id, 'type': type, 'message': message}, timeout=2)
    except requests.RequestException as e:
        print('Realtime ticket notification failed:', e)


def notify_staff(type, message, ticket_id=None):
    try:
        requests.post('http://localhost:4000/notify/staff',
                      json={'ticket_id': ticket_id, 'type': type, 'message': message}, timeout=2)
    except requests.RequestException as e:
        print('Realtime staff notification failed:', e)


def notify_user(user_id, type, message, ticket_id=None):
    try:
        requests.post('http://localhost:4000/notify/user',
                      json={'user_id': user_id, 'ticket_id': ticket_id, 'type': type, 'message': message}, timeout=2)
    except requests.RequestException as e:
        print('Realtime user notification failed:', e)


def create_notification(user, title, message, notification_type='general', ticket=None):
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        ticket=ticket,
    )
    
def create_activity_log(ticket, user, action, description, old_value=None, new_value=None):
    return ActivityLog.objects.create(
        ticket=ticket,
        user=user,
        action=action,
        description=description,
        old_value=old_value,
        new_value=new_value,
    )


def get_staff_users(user_model):
    return user_model.objects.filter(Q(is_staff=True) | Q(role__in=['agent', 'admin']))


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAgentOrAdmin()]
        return [permissions.IsAuthenticated()]


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'success': True})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'success': True})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'count': count})


class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'role', None)

        if not user.is_staff and role not in ['agent', 'admin']:
            qs = Ticket.objects.filter(user=user)
        elif role == 'agent':
            qs = Ticket.objects.filter(assigned_to=user)
        else:
            qs = Ticket.objects.all()

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        status_f = self.request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)

        priority_f = self.request.query_params.get('priority')
        if priority_f:
            qs = qs.filter(priority=priority_f)
            
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)

        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        ticket = serializer.save(user=self.request.user)
        
        create_activity_log(
        ticket=ticket,
        user=self.request.user,
        action='created',
        description=f'تیکت «{ticket.title}» ایجاد شد.',
    )

        staff_users = get_staff_users(self.request.user.__class__)
        for staff_user in staff_users:
            create_notification(
                user=staff_user,
                title='تیکت جدید',
                message=f'تیکت جدیدی با عنوان «{ticket.title}» ثبت شد.',
                notification_type='new_ticket',
                ticket=ticket,
            )

        notify_staff(
            type='new_ticket',
            message=f'تیکت جدیدی با عنوان «{ticket.title}» ثبت شد.',
            ticket_id=ticket.id,
        )
        
        
    @action(detail=False, methods=['get'], url_path='export-excel')
    def export_excel(self, request):
        if not request.user.is_staff and getattr(request.user, 'role', None) != 'admin':
             return Response(
                 {'error': 'دسترسی ندارید'},
                    status=status.HTTP_403_FORBIDDEN
        )

        tickets = self.get_queryset()

        wb = Workbook()
        ws = wb.active
        ws.title = 'Tickets'

        ws.append([
            'ID',
            'عنوان',
            'وضعیت',
            'اولویت',
            'ثبت‌کننده',
            'کارشناس',
            'دسته‌بندی',
            'تعداد پیام‌ها',
            'تاریخ ایجاد',
            'آخرین بروزرسانی',
        ])

        for ticket in tickets:
            ws.append([
                ticket.id,
                ticket.title,
                ticket.status,
                ticket.priority,
                ticket.user.username if ticket.user else '',
                ticket.assigned_to.username if ticket.assigned_to else '',
                ticket.category.name if ticket.category else '',
                ticket.messages.count(),
                ticket.created_at.strftime('%Y-%m-%d %H:%M'),
                ticket.updated_at.strftime('%Y-%m-%d %H:%M'),
            ])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="tickets.xlsx"'

        wb.save(response)
        return response

    @action(detail=False, methods=['get'])
    def stats(self, request):
        if not request.user.is_staff and getattr(request.user, 'role', None) != 'admin':
            return Response({'error': 'دسترسی ندارید'}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            'total': Ticket.objects.count(),
            'open': Ticket.objects.filter(status='open').count(),
            'pending': Ticket.objects.filter(status='pending').count(),
            'closed': Ticket.objects.filter(status='closed').count(),
            'revision': Ticket.objects.filter(status='revision').count(),
        })

    @action(detail=False, methods=['patch'], url_path='bulk-update')
    def bulk_update(self, request):
        if not request.user.is_staff and getattr(request.user, 'role', None) != 'admin':
            return Response({'error': 'دسترسی ندارید'}, status=status.HTTP_403_FORBIDDEN)

        ticket_ids = request.data.get('ticket_ids', [])
        new_status = request.data.get('status')
        assigned_to_id = request.data.get('assigned_to')

        if not ticket_ids:
            return Response({'error': 'هیچ تیکتی انتخاب نشده است'}, status=status.HTTP_400_BAD_REQUEST)

        tickets = Ticket.objects.filter(id__in=ticket_ids)

        if new_status:
            if new_status not in ['open', 'pending', 'closed', 'revision']:
                return Response({'error': 'وضعیت نامعتبر است'}, status=status.HTTP_400_BAD_REQUEST)
            tickets.update(status=new_status)
            
            for ticket in tickets:
                create_activity_log(
                    ticket=ticket,
                    user=request.user,
                    action='bulk_updated',
                    description='وضعیت تیکت در عملیات گروهی تغییر کرد.',
                    new_value=new_status,
    )

        if assigned_to_id:
            User = request.user.__class__

            try:
                assigned_user = User.objects.get(id=assigned_to_id, role__in=['agent', 'admin'])
            except User.DoesNotExist:
                return Response({'error': 'کارشناس معتبر یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

            tickets.update(assigned_to=assigned_user)
            for ticket in tickets:
                create_activity_log(
                    ticket=ticket,
                    user=request.user,
                    action='bulk_updated',
                    description=f'تیکت در عملیات گروهی به {assigned_user.username} ارجاع داده شد.',
                    new_value=assigned_user.username,
    )

            for ticket in tickets:
                create_notification(
                    user=assigned_user,
                    title='تیکت جدید به شما ارجاع شد',
                    message=f'تیکت «{ticket.title}» به شما ارجاع داده شد.',
                    notification_type='ticket_assigned',
                    ticket=ticket,
                )

                notify_user(
                    user_id=assigned_user.id,
                    type='ticket_assigned',
                    message=f'تیکت «{ticket.title}» به شما ارجاع داده شد.',
                    ticket_id=ticket.id,
                )

        return Response({
            'success': True,
            'updated_count': tickets.count()
        })

    @action(detail=False, methods=['get'], url_path='agent-stats')
    def agent_stats(self, request):
        if not request.user.is_staff and getattr(request.user, 'role', None) != 'admin':
            return Response({'error': 'دسترسی ندارید'}, status=status.HTTP_403_FORBIDDEN)

        User = get_user_model()
        agents = User.objects.filter(role__in=['agent', 'admin'], is_active=True)

        data = []
        for agent in agents:
            data.append({
                'id': agent.id,
                'username': agent.username,
                'email': agent.email,
                'assigned_tickets_count': Ticket.objects.filter(assigned_to=agent).count(),
                'open_tickets_count': Ticket.objects.filter(assigned_to=agent, status='open').count(),
                'pending_tickets_count': Ticket.objects.filter(assigned_to=agent, status='pending').count(),
                'closed_tickets_count': Ticket.objects.filter(assigned_to=agent, status='closed').count(),
            })

        return Response(data)

    @action(detail=True, methods=['patch'], url_path='messages/(?P<message_id>[^/.]+)')
    def edit_message(self, request, pk=None, message_id=None):
        ticket = self.get_object()

        try:
            message = ticket.messages.get(id=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'پیام یافت نشد'}, status=status.HTTP_404_NOT_FOUND)

        if message.author != request.user and not request.user.is_superuser:
            return Response({'error': 'شما فقط مجاز به ویرایش پیام خودتان هستید'}, status=status.HTTP_403_FORBIDDEN)

        new_content = request.data.get('content')
        if not new_content:
            return Response({'error': 'متن پیام ارسال نشده است'}, status=status.HTTP_400_BAD_REQUEST)

        message.content = new_content
        message.save()

        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        serializer = MessageSerializer(data=request.data)

        if serializer.is_valid():
            content = serializer.validated_data.get('content', '')

            is_staff_user = (
                request.user.is_staff or
                getattr(request.user, 'role', None) in ['agent', 'admin']
            )

            signature = getattr(request.user, 'signature', None)

            if is_staff_user and signature:
                content = f"{content}\n\n---\n{signature}"

            message_obj = serializer.save(
                ticket=ticket,
                author=request.user,
                content=content
            )
            
            create_activity_log(
            ticket=ticket,
            user=request.user,
            action='replied',
            description='پاسخ جدیدی برای این تیکت ثبت شد.',
)

            ticket.last_reply_at = timezone.now()
            ticket.save(update_fields=['last_reply_at'])

            try:
                notify_ticket(ticket_id=ticket.id, type='new_reply', message='پیام جدیدی برای این تیکت ثبت شد.')

                is_staff_user = request.user.is_staff or getattr(request.user, 'role', None) in ['agent', 'admin']

                if is_staff_user:
                    create_notification(
                        user=ticket.user,
                        title='پاسخ جدید پشتیبانی',
                        message=f'پشتیبانی به تیکت «{ticket.title}» پاسخ داد.',
                        notification_type='agent_reply',
                        ticket=ticket,
                    )

                    notify_user(
                        user_id=ticket.user.id,
                        type='agent_reply',
                        message=f'پشتیبانی به تیکت «{ticket.title}» پاسخ داد.',
                        ticket_id=ticket.id,
                    )
                else:
                    staff_users = get_staff_users(request.user.__class__)

                    for staff_user in staff_users:
                        create_notification(
                            user=staff_user,
                            title='پاسخ جدید کاربر',
                            message=f'کاربر به تیکت «{ticket.title}» پاسخ داد.',
                            notification_type='user_reply',
                            ticket=ticket,
                        )

                    notify_staff(
                        type='user_reply',
                        message=f'کاربر به تیکت «{ticket.title}» پاسخ داد.',
                        ticket_id=ticket.id,
                    )

            except Exception as e:
                print('Notify error:', e)

            return Response(
                MessageSerializer(message_obj, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def assign(self, request, pk=None):
        ticket = self.get_object()

        if not request.user.is_staff and getattr(request.user, 'role', None) != 'admin':
            return Response({'error': 'فقط ادمین مجاز به ارجاع تیکت است'}, status=status.HTTP_403_FORBIDDEN)

        assigned_to_id = request.data.get('assigned_to')
        if not assigned_to_id:
            return Response({'error': 'شناسه کارشناس ارسال نشده است'}, status=status.HTTP_400_BAD_REQUEST)

        User = request.user.__class__

        try:
            assigned_user = User.objects.get(id=assigned_to_id, role__in=['agent', 'admin'])
        except User.DoesNotExist:
            return Response({'error': 'کارشناس معتبر یافت نشد'}, status=status.HTTP_404_NOT_FOUND)
        
        old_assigned = ticket.assigned_to.username if ticket.assigned_to else 'بدون کارشناس'
        ticket.assigned_to = assigned_user
        ticket.save()
        
        create_activity_log(
        ticket=ticket,
        user=request.user,
        action='assigned',
        description=f'تیکت به {assigned_user.username} ارجاع داده شد.',
        old_value=old_assigned,
        new_value=assigned_user.username,
)

        create_notification(
            user=assigned_user,
            title='تیکت جدید به شما ارجاع شد',
            message=f'تیکت «{ticket.title}» به شما ارجاع داده شد.',
            notification_type='ticket_assigned',
            ticket=ticket,
        )

        notify_user(
            user_id=assigned_user.id,
            type='ticket_assigned',
            message=f'تیکت «{ticket.title}» به شما ارجاع داده شد.',
            ticket_id=ticket.id,
        )

        return Response(TicketSerializer(ticket, context={'request': request}).data)

    @action(detail=True, methods=['patch'])
    def change_status(self, request, pk=None):
        ticket = self.get_object()

        if not request.user.is_staff and getattr(request.user, 'role', None) not in ['agent', 'admin']:
            return Response({'error': 'شما مجوز تغییر وضعیت تیکت را ندارید'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')

        if new_status not in ['open', 'pending', 'closed', 'revision']:
            return Response({'error': 'وضعیت نامعتبر'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = ticket.status
        ticket.status = new_status
        ticket.save()
        
        create_activity_log(
        ticket=ticket,
        user=request.user,
        action='status_changed',
        description='وضعیت تیکت تغییر کرد.',
        old_value=old_status,
        new_value=new_status,
)

        try:
            create_notification(
                user=ticket.user,
                title='تغییر وضعیت تیکت',
                message=f'وضعیت تیکت «{ticket.title}» تغییر کرد.',
                notification_type='status_changed',
                ticket=ticket,
            )

            notify_ticket(ticket_id=ticket.id, type='status_changed', message='وضعیت این تیکت تغییر کرد.')

            notify_user(
                user_id=ticket.user.id,
                type='status_changed',
                message=f'وضعیت تیکت «{ticket.title}» تغییر کرد.',
                ticket_id=ticket.id,
            )

        except Exception as e:
            print('Notify error:', e)

        return Response(TicketSerializer(ticket, context={'request': request}).data)
    
class KnowledgeArticleViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeArticleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        qs = KnowledgeArticle.objects.select_related(
            'category',
            'created_by'
        )

        if user.is_superuser:
            pass
        elif user.is_staff or getattr(user, 'role', None) in ['admin', 'agent']:
            qs = qs.filter(
                Q(is_published=True) |
                Q(created_by=user)
            )
        else:
            qs = qs.filter(is_published=True)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(content__icontains=search)
            )

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)

        return qs.distinct().order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_superuser:
            serializer.save(created_by=user)
        else:
            serializer.save(
                created_by=user,
                is_published=False
            )

    def perform_update(self, serializer):
        user = self.request.user
        article = self.get_object()

        if user.is_superuser:
            serializer.save()
            return

        if article.created_by_id != user.id:
            raise PermissionDenied('شما فقط می‌توانید مقاله‌های خودتان را ویرایش کنید.')

        if article.is_published:
            raise PermissionDenied('مقاله منتشرشده فقط توسط مدیر کل قابل ویرایش است.')

        serializer.save(is_published=False)

    def perform_destroy(self, instance):
        user = self.request.user

        if user.is_superuser:
            instance.delete()
            return

        if instance.created_by_id != user.id:
            raise PermissionDenied('شما فقط می‌توانید مقاله‌های خودتان را حذف کنید.')

        if instance.is_published:
            raise PermissionDenied('مقاله منتشرشده فقط توسط مدیر کل قابل حذف است.')

        instance.delete()