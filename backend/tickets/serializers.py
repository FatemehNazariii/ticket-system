from rest_framework import serializers
from .models import Ticket, Message, Category
from accounts.serializers import UserSerializer

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

class TicketSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'title', 'description', 'status', 'priority',
                  'category', 'category_name', 'user', 'assigned_to',
                  'messages', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']