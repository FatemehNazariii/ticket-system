from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Ticket, Message, Category, Notification, ActivityLog, KnowledgeArticle


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']


class MessageSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'author', 'content', 'attachment', 'created_at']
        read_only_fields = ['author', 'created_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'user',
            'action',
            'description',
            'old_value',
            'new_value',
            'created_at',
        ]


class TicketSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    messages_count = serializers.SerializerMethodField()
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)
    activity_logs = ActivityLogSerializer(many=True, read_only=True)
    first_response_minutes = serializers.SerializerMethodField()
    sla_status = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id',
            'title',
            'description',
            'attachment',
            'status',
            'messages_count',
            'priority',
            'activity_logs',
            'first_response_minutes',
            'sla_status',
            'category',
            'category_name',
            'user',
            'assigned_to',
            'assigned_to_detail',
            'messages',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_messages_count(self, obj):
        return obj.messages.count()

    def get_first_response_minutes(self, obj):
        first_staff_message = obj.messages.filter(
            author__role__in=['agent', 'admin']
        ).order_by('created_at').first()

        if not first_staff_message:
            return None

        diff = first_staff_message.created_at - obj.created_at
        return int(diff.total_seconds() // 60)

    def get_sla_status(self, obj):
        minutes = self.get_first_response_minutes(obj)

        if minutes is None:
            return 'waiting'

        if minutes <= 15:
            return 'ok'

        return 'breached'


class NotificationSerializer(serializers.ModelSerializer):
    ticket_id = serializers.IntegerField(source='ticket.id', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'notification_type',
            'ticket_id',
            'is_read',
            'created_at',
        ]
        
class KnowledgeArticleSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_detail = UserSerializer(source='created_by', read_only=True)

    class Meta:
        model = KnowledgeArticle
        fields = [
            'id',
            'title',
            'content',
            'category',
            'category_name',
            'is_published',
            'created_by',
            'created_by_detail',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']