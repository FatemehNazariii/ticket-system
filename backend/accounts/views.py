from rest_framework import generics, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser

from .models import User
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ProfileSerializer,
    UserListSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
)


class ProfileViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_serializer_class(self):
        return UserSerializer

    def partial_update(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": getattr(user, "role", "user"),
                    "phone": getattr(user, "phone", ""),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        avatar_url = None
        if user.avatar:
            avatar_url = request.build_absolute_uri(user.avatar.url)

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "avatar": user.avatar.url if user.avatar else None,
                "avatar_url": avatar_url,
            }
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-id")
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def is_main_admin(self, request):
        return (
            request.user.is_authenticated
            and request.user.role == "admin"
            and request.user.is_staff
        )

    def get_serializer_class(self):
        if self.action == "create":
            return RegisterSerializer

        if self.action in ["update", "partial_update"]:
            return UserUpdateSerializer

        return UserListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def create(self, request, *args, **kwargs):
        if not self.is_main_admin(request):
            return Response(
                {"error": "فقط مدیر کل اجازه ایجاد کاربر را دارد."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        role = request.data.get("role", "user")
        if role in ["user", "agent", "admin"]:
            user.role = role

            if role == "admin":
                user.is_staff = True
                user.is_superuser = True
            elif role == "agent":
                user.is_staff = True
                user.is_superuser = False
            else:
                user.is_staff = False
                user.is_superuser = False

            user.save()

        output_serializer = UserListSerializer(
            user,
            context={"request": request},
        )

        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        if not self.is_main_admin(request):
            return Response(
                {"error": "فقط مدیر کل اجازه ویرایش کاربران را دارد."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().partial_update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not self.is_main_admin(request):
            return Response(
                {"error": "فقط مدیر کل اجازه ویرایش کاربران را دارد."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().update(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def agents(self, request):
        agents = User.objects.filter(
            role__in=["agent", "admin"],
            is_active=True,
        )

        serializer = UserListSerializer(
            agents,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def update_role(self, request, pk=None):
        if not self.is_main_admin(request):
            return Response(
                {"error": "فقط مدیر کل اجازه تغییر نقش کاربران را دارد."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = self.get_object()
        role = request.data.get("role")

        if role not in ["user", "agent", "admin"]:
            return Response(
                {"detail": "نقش نامعتبر است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.role = role

        if role == "admin":
            user.is_staff = True
            user.is_superuser = True
        elif role == "agent":
            user.is_staff = True
            user.is_superuser = False
        else:
            user.is_staff = False
            user.is_superuser = False

        user.save()

        serializer = UserListSerializer(
            user,
            context={"request": request},
        )

        return Response(serializer.data)

    @action(detail=True, methods=["patch"])
    def deactivate(self, request, pk=None):
        if not self.is_main_admin(request):
            return Response(
                {"error": "فقط مدیر کل اجازه غیرفعال کردن کاربران را دارد."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = self.get_object()

        if user == request.user:
            return Response(
                {"error": "نمی‌توانید حساب خودتان را غیرفعال کنید."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user.save()

        return Response(
            {
                "message": "کاربر با موفقیت غیرفعال شد.",
                "id": user.id,
                "is_active": user.is_active,
            }
        )

    @action(detail=True, methods=["patch"])
    def activate(self, request, pk=None):
        if not self.is_main_admin(request):
            return Response(
                {"error": "فقط مدیر کل اجازه فعال کردن کاربران را دارد."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = self.get_object()
        user.is_active = True
        user.save()

        return Response(
            {
                "message": "کاربر با موفقیت فعال شد.",
                "id": user.id,
                "is_active": user.is_active,
            }
        )

    def destroy(self, request, *args, **kwargs):
        if not self.is_main_admin(request):
            return Response(
                {"error": "فقط مدیر کل اجازه حذف کاربران را دارد."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = self.get_object()

        if user == request.user:
            return Response(
                {"detail": "نمی‌توانید حساب خودتان را حذف کنید."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data["new_password"])
            user.save()

            return Response(
                {"detail": "رمز عبور با موفقیت تغییر کرد."},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileUpdateAPIView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user