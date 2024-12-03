# serializers.py
from rest_framework import serializers
from django.core.files.base import ContentFile
import base64
import uuid
from django.contrib.auth import get_user_model
from .models import Product, Catalog, ValidationRule, ProductField, UploadedFile
from django.conf import settings

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model - used in CatalogSerializer"""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product/Schema model"""

    class Meta:
        model = Product
        fields = [
            'id',
            'schema_name',
            'domain',
            'description',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_name(self, value):
        """Validate that the name is unique"""
        if Product.objects.filter(schema_name=value).exists():
            raise serializers.ValidationError("A product with this name already exists.")
        return value


class CatalogSerializer(serializers.ModelSerializer):
    """Serializer for Catalog model"""
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    responsible_user = UserSerializer(read_only=True)
    responsible_user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='responsible_user',
        write_only=True
    )
    icon = serializers.CharField(required=False)  # Accept base64 strings

    authorized_emails_list = serializers.ListField(
        child=serializers.EmailField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Catalog
        fields = [
            'id',
            'name',
            'icon',
            'tags',
            'corporate',
            'responsible_user',
            'responsible_user_id',
            'menu',
            'product',
            'product_id',
            'mandatory',
            'frequency',
            'deadline',
            'api_key',
            'submission_email',
            'authorized_emails',
            'authorized_emails_list',
            'sftp_folder',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_tags(self, value):
        """Validate tags format"""
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Tags must be a valid JSON list.")
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list.")
        return value

    def validate_authorized_emails_list(self, value):
        """Validate authorized emails"""
        if value:
            for email in value:
                if not email:
                    raise serializers.ValidationError("Empty email addresses are not allowed")
        return value

    def validate_icon(self, value):
        """Decode base64 image and convert it to a file if it's a base64 string."""
        # Check if the value is a base64 string, if so, process it
        if isinstance(value, str):
            if not value.startswith("data:image/"):
                raise serializers.ValidationError("Icon must start with 'data:image/'.")

            try:
                # Split the string into the format and base64 encoded string
                format, imgstr = value.split(";base64,")
                ext = format.split("/")[-1]  # Get file extension (e.g., 'jpeg')

                # Decode the base64 string
                img_data = base64.b64decode(imgstr)

                if not img_data:
                    raise serializers.ValidationError("Decoded image data is empty.")

                # Create a file from the decoded data
                file_name = f"{uuid.uuid4()}.{ext}"
                return ContentFile(img_data, name=file_name)

            except Exception as e:
                raise serializers.ValidationError(f"Invalid base64 image: {e}")

        # If the value is already a ContentFile object, simply return it
        elif isinstance(value, ContentFile):
            return value

        # Handle any other case
        else:
            raise serializers.ValidationError("Icon must be a valid base64 string or a ContentFile.")


    def validate(self, data):
        """Custom validation for the entire object"""
        if data.get('deadline'):
            from datetime import date
            if data['deadline'] < date.today():
                raise serializers.ValidationError({
                    "deadline": "Deadline cannot be in the past"
                })
        return data

    def create(self, validated_data):
        """Handle creation with authorized_emails_list and base64 icon"""
        emails_list = validated_data.pop('authorized_emails_list', None)
        icon = validated_data.pop('icon', None)
        if icon:
            validated_data['icon'] = self.validate_icon(icon)
        instance = super().create(validated_data)
        if emails_list is not None:
            instance.set_authorized_emails_list(emails_list)
            instance.save()
        return instance

    def update(self, instance, validated_data):
        """Handle updates with authorized_emails_list and base64 icon"""
        emails_list = validated_data.pop('authorized_emails_list', None)
        icon = validated_data.pop('icon', None)
        if icon:
            validated_data['icon'] = self.validate_icon(icon)
        instance = super().update(instance, validated_data)
        if emails_list is not None:
            instance.set_authorized_emails_list(emails_list)
            instance.save()
        return instance

    def to_representation(self, instance):
        """Customize the output representation"""
        data = super().to_representation(instance)
        if instance.icon:
            data['icon'] = f"{settings.MEDIA_URL}{instance.icon.name}"
        data['authorized_emails_list'] = instance.get_authorized_emails_list()
        return data


class CatalogListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing catalogs"""
    responsible_user = UserSerializer(read_only=True)
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Catalog
        fields = [
            'id',
            'name',
            'icon',
            'corporate',
            'responsible_user',
            'product',
            'frequency',
            'mandatory',
            'created_at'
        ]
        read_only_fields = fields

class UploadedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedFile
        fields = ['id', 'catalog', 'file', 'domain', 'user', 'uploaded_at']

class ValidationRuleSerializer(serializers.ModelSerializer):
    """Serializer for ValidationRule model."""
    
    class Meta:
        model = ValidationRule
        fields = [
            'id', 'product_field', 'is_unique', 'is_picklist', 'picklist_values',
            'has_min_max', 'min_value', 'max_value', 'is_email_format', 'is_phone_format',
            'has_max_decimal', 'max_decimal_places', 'has_date_format', 'date_format',
            'has_max_days_of_age', 'max_days_of_age', 'custom_validation',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ProductFieldSerializer(serializers.ModelSerializer):
    """Serializer for ProductField model with nested ValidationRule."""
    validation_rule = ValidationRuleSerializer(required=False)

    class Meta:
        model = ProductField
        fields = [
            'id', 'name', 'field_type', 'length', 'is_null', 'is_primary_key',
            'product', 'created_at', 'updated_at', 'validation_rule'
        ]
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'product': {'read_only': True} 
        }