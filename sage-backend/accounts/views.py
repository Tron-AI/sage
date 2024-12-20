from rest_framework import generics, permissions, status
from .serializers import RegisterSerializer, LoginSerializer
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from rest_framework.response import Response
from .serializers import UserSerializer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.views import APIView

User = get_user_model()


# Registration View
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

# Login View with JWT Token
class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        # The parent class will handle authentication and set request.user
        response = super().post(request, *args, **kwargs)
        print('here')
        serializer = self.get_serializer(data=request.data)
        print('here2')
        serializer.is_valid(raise_exception=True)
        print('here3')
        user = serializer.user

        # After successful login, we can safely use request.user to get user details
        data = {
            "refresh": response.data['refresh'],
            "access": response.data['access'],
            "user": {
                "username": user.username,
                "is_staff": user.is_staff,
            }
        }

        # Include user data in the response
        response.data = data

        return response
    


class UserDetailView(APIView):
    # Use JWTAuthentication to authenticate the user based on access token
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]  # Ensure the user is authenticated

    def get(self, request, *args, **kwargs):
        # Access the authenticated user
        user = request.user

        # Return user details including the is_staff field
        user_data = {
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff,
        }

        return Response(user_data, status=status.HTTP_200_OK)

class UserListView(generics.ListAPIView):
    """
    View to list all users in the system.
    * Requires user to be authenticated and a staff member.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "status": "success",
            "count": queryset.count(),
            "users": serializer.data
        })

    def handle_exception(self, exc):
        """Custom exception handling"""
        if isinstance(exc, PermissionError):
            return Response(
                {"error": "Only staff members can access this endpoint."},
                status=403
            )
        return super().handle_exception(exc)

    def get_queryset(self):
        """
        Optionally restrict the returned users,
        by filtering against query parameters in the URL.
        """
        queryset = User.objects.all().order_by('-date_joined')

        # Add optional filtering
        username = self.request.query_params.get('username', None)
        if username:
            queryset = queryset.filter(username__icontains=username)

        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset
