from django.contrib import admin
from .models import Category, Ticket, Message

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'description']
    search_fields = ['name']

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'status', 'priority', 'user', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'category', 'created_at']
    search_fields = ['title', 'description', 'user__username']
    raw_id_fields = ['user', 'assigned_to']

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'ticket', 'author', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__username']
    # نیازی به import User نیست، چون فقط از نام فیلدها استفاده می‌کنیم