from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import update_last_login
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework.exceptions import ValidationError

User = get_user_model()

# Registration Serializer
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

# Login Serializer with JWT Token
class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username_or_email = attrs.get("username")
        password = attrs.get("password")

        if not username_or_email or not password:
            raise ValidationError({"detail": "Username/Email and password are required."})

        # Check if the input is an email or username
        user = None
        if "@" in username_or_email:  # Looks like an email
            try:
                user = User.objects.get(email=username_or_email)
                username_or_email = user.username  # Map email to username
            except User.DoesNotExist:
                raise ValidationError({"detail": "No user found with this email."})
        
        # Authenticate user
        user = authenticate(username=username_or_email, password=password)
        if not user:
            raise ValidationError({"detail": "Invalid credentials."})

        # Generate tokens
        data = super().validate({"username": username_or_email, "password": password})

        # Include additional user info
        data["user"] = {
            "username": user.username,
            "is_staff": user.is_staff,
        }

        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "username", "password", "is_staff", "email"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User(**validated_data)
        user.set_password(validated_data["password"])
        user.save()
        return user