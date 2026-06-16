from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        USER = 'user', 'کاربر عادی'
        AGENT = 'agent', 'کارشناس'
        ADMIN = 'admin', 'مدیر'

    role = models.CharField(
        max_length=10,
        choices=(('user','user'),('agent','agent'),('admin','admin')),
        default='user'
    )
    phone = models.CharField(max_length=15, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    signature = models.TextField(blank=True, null=True)


    def __str__(self):
        return self.username
    
    