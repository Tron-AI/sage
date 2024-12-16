# models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()



class Product(models.Model):
    """Schema/Product Model"""
    schema_name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.schema_name

    class Meta:
        ordering = ['-created_at']


class Catalog(models.Model):
    """Catalog Model that links to Product"""
    FREQUENCY_CHOICES = (
        ('Daily', 'Daily'),
        ('Weekly', 'Weekly'),
        ('Monthly', 'Monthly'),
    )

    MANDATORY_CHOICES = (
        ('Is Mandatory', 'Is Mandatory'),
        ('Not Mandatory', 'Not Mandatory'),
    )

    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Delayed', 'Delayed'),
        ('Pending', 'Pending'),
        ('Rejected', 'Rejected'),
    )

    # Catalog Information
    name = models.CharField(max_length=255)
    icon = models.ImageField(upload_to='catalog_icons/', blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)  # Store tags as JSON array
    corporate = models.CharField(max_length=255)
    responsible_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    menu = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')

    # Schema/Product Link
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='catalogs')

    # Submission Details
    mandatory = models.CharField(max_length=20, choices=MANDATORY_CHOICES, default='Is Mandatory')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='Daily')
    deadline = models.DateField(null=True, blank=True)

    # API & Submission Settings
    api_key = models.CharField(max_length=255, blank=True)
    submission_email = models.EmailField(max_length=255)
    authorized_emails = models.TextField(blank=True)  # Store multiple emails as text
    sftp_folder = models.CharField(max_length=255, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']

    def get_authorized_emails_list(self):
        """Convert authorized_emails text to list"""
        if self.authorized_emails:
            return [email.strip() for email in self.authorized_emails.split('\n')]
        return []

    def set_authorized_emails_list(self, emails_list):
        """Convert emails list to text for storage"""
        self.authorized_emails = '\n'.join(emails_list)


class ProductField(models.Model):
    """Model for defining fields within a Product"""
    FIELD_TYPE_CHOICES = (
        ('varchar', 'Char'),
        ('int', 'Integer'),
        ('float', 'Float'),
        ('boolean', 'Boolean'),
        ('date', 'Date'),
        ('datetime', 'DateTime'),
        ('text', 'Text'),
        ('decimal', 'Decimal'),
    )

    name = models.CharField(max_length=255)
    field_type = models.CharField(max_length=50, choices=FIELD_TYPE_CHOICES)
    length = models.PositiveIntegerField(null=True, blank=True, help_text="Length of the field if applicable")
    is_null = models.BooleanField(default=True)
    is_primary_key = models.BooleanField(default=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_fields')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.field_type})"

    class Meta:
        ordering = ['name']


class ValidationRule(models.Model):
    """Model for defining validation rules for ProductFields"""
    product_field = models.OneToOneField(ProductField, on_delete=models.CASCADE, related_name='validation_rule')
    
    # Validation properties
    is_unique = models.BooleanField(default=False)
    is_picklist = models.BooleanField(default=False)
    picklist_values = models.TextField(blank=True, null=True, help_text="Comma-separated values if picklist is true")
    has_min_max = models.BooleanField(default=False)
    min_value = models.FloatField(null=True, blank=True)
    max_value = models.FloatField(null=True, blank=True)
    is_email_format = models.BooleanField(default=False)
    is_phone_format = models.BooleanField(default=False)
    has_max_decimal = models.BooleanField(default=False)
    max_decimal_places = models.PositiveIntegerField(null=True, blank=True)
    has_date_format = models.BooleanField(default=False)
    date_format = models.CharField(max_length=50, blank=True, null=True, help_text="Expected date format, e.g., 'YYYY-MM-DD'")
    has_max_days_of_age = models.BooleanField(default=False)
    max_days_of_age = models.PositiveIntegerField(null=True, blank=True)
    custom_validation = models.CharField(max_length=255, blank=True, help_text="Custom validation rule", null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Validation for {self.product_field.name}"

    class Meta:
        ordering = ['product_field']



class UploadedFile(models.Model):
    catalog = models.ForeignKey(Catalog, related_name='uploaded_files', on_delete=models.CASCADE)
    file = models.FileField(upload_to='uploaded_files/')
    domain = models.CharField(max_length=255, null=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class SubmissionInfo(models.Model):
    """
    Model to store information about data submissions.
    """
    catalog = models.ForeignKey(Catalog, related_name='submission_info', on_delete=models.CASCADE, null=True)
    domain = models.CharField(max_length=255, null=True)
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name="submissions")
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submissions")
    submission_time = models.DateTimeField(default=timezone.now)
    submitted_data = models.JSONField()

    class Meta:
        ordering = ['-submission_time']

    def __str__(self):
        return f"Submission for {self.product.name} by {self.submitted_by.username} at {self.submission_time}"
    

class Alert(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts')
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alert for {self.user.username}: {self.message}"

    class Meta:
        ordering = ['-created_at']



class ProductTableInfo(models.Model):
    """Model to store table info related to a product"""
    product = models.OneToOneField(
        Product, 
        on_delete=models.CASCADE, 
        related_name='product_table_info'
    )  # Enforces one-to-one relationship
    table_name = models.CharField(max_length=255)
    fields = models.JSONField(default=list, blank=True)  # List of fields in the table
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Table {self.table_name} for Product {self.product.schema_name}"

    class Meta:
        ordering = ['-created_at']

# from django.db import models

#
#
# class Catalog(models.Model):
#     name = models.CharField(max_length=255)
#     company = models.CharField(max_length=255)
#     domain = models.CharField(max_length=255)
#     description = models.TextField(null=True, blank=True)
#
#     def __str__(self):
#         return self.name
#
#
# class Schema(models.Model):
#     catalog = models.ForeignKey(
#         Catalog, on_delete=models.CASCADE, related_name="schemas"
#     )
#     schema_fields = models.JSONField()  # Store the schema definition in JSON format
#
#
# class Entry(models.Model):
#     catalog = models.ForeignKey(
#         Catalog, on_delete=models.CASCADE, related_name="entries"
#     )
#     schema = models.ForeignKey(Schema, on_delete=models.CASCADE, related_name="entries")
#     data = models.JSONField()  # Store the actual entry data in JSON format
