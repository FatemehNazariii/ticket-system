from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'phone']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError('رمزها یکسان نیستند')
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'role',
            'avatar',
            'avatar_url',
            'phone',
            'signature',
            'is_active',
        ]
        read_only_fields = ['role']

    def get_avatar_url(self, obj):
        request = self.context.get("request")

        if obj.avatar:
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url

        return None
class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'phone',
            'avatar',
            'avatar_url',
            'signature'
        ]
        read_only_fields = ['id', 'avatar_url']

    def get_avatar_url(self, obj):
        request = self.context.get('request')

        if obj.avatar:
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url

        return None

    def validate_username(self, value):
        user = self.context['request'].user

        if User.objects.exclude(id=user.id).filter(username=value).exists():
            raise serializers.ValidationError("این نام کاربری قبلاً استفاده شده است.")

        return value
    
class UserListSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'phone',
            'role',
            'is_staff',
            'is_superuser',
            'is_active',
            'avatar',
            'avatar_url',
            'signature',
        ]

    def get_avatar_url(self, obj):
        request = self.context.get('request')

        if obj.avatar:
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url

        return None
class UserUpdateSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True
    )

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'phone',
            'avatar',
            'avatar_url',
            'role',
            'is_active',
            'password',
            'signature',
        ]
        read_only_fields = ['id', 'avatar_url']

    def get_avatar_url(self, obj):
        request = self.context.get('request')

        if obj.avatar:
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url

        return None

    def validate_username(self, value):
        user_id = self.instance.id if self.instance else None

        if User.objects.exclude(id=user_id).filter(username=value).exists():
            raise serializers.ValidationError("این نام کاربری قبلاً استفاده شده است.")

        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_new_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({"confirm_new_password": "رمز جدید و تکرار آن مطابقت ندارند."})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("رمز قدیمی اشتباه است.")
        return value