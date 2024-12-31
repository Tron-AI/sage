from django.db import models
from catalog.models import Product
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

class OfficialCatalog(models.Model):
    """Official Catalog Model"""
    sku = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100)
    brand = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sku} - {self.name}"

    class Meta:
        ordering = ['-created_at']

class Homologation(models.Model):
    """Homologation Model"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    official_product = models.ForeignKey(OfficialCatalog, on_delete=models.CASCADE)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    is_automatic = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    homologated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    homologated_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Homologation: {self.product} -> {self.official_product}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        old_status = None
        if not is_new:
            old_status = Homologation.objects.get(pk=self.pk).status

        super().save(*args, **kwargs)

        should_send_email = (
            (is_new and self.status in ['approved', 'rejected']) or  
            (not is_new and old_status != self.status and self.status in ['approved', 'rejected'])
        )

        if should_send_email:
            homologation_config = HomologationConfiguration.objects.first()
            if homologation_config and homologation_config.approved_emails:
                approved_emails = homologation_config.approved_emails.split(',')
                origin = "Automatic" if self.is_automatic else "Manual"

                # Compose the email body
                report = f"Homologation status updated for {self.product.schema_name}\n"
                report += f"Product: {self.product.schema_name}\n"
                report += f"Official Product: {self.official_product.name}\n"
                report += f"Official Product SKU: {self.official_product.sku}\n"
                report += f"Homologation Status: {self.status}\n"
                report += f"Homologation Origin: {origin}\n"

                if self.is_automatic:
                    report += f"Confidence Score: {self.confidence_score}\n"

                report += f"Homologated By: {self.homologated_by}\n"

                subject = f"Homologation Status Update: {self.product.schema_name} - {self.status}"
                send_mail(
                    subject,
                    report,                 
                    settings.EMAIL_HOST_USER,  
                    approved_emails,        
                    fail_silently=False      
                )
                
    class Meta:
        ordering = ['-created_at']

class HomologationConfiguration(models.Model):
    name = models.CharField(max_length=255)
    corporate = models.CharField(max_length=255)
    product = models.CharField(max_length=255)
    responsible = models.CharField(max_length=255)
    frequency = models.CharField(max_length=50)
    
    # Database configuration
    db_ip = models.CharField(max_length=255, blank=True)
    db_user = models.CharField(max_length=255, blank=True)
    db_password = models.CharField(max_length=255, blank=True)
    
    # SFTP configuration
    sftp_ip = models.CharField(max_length=255, blank=True)
    sftp_user = models.CharField(max_length=255, blank=True)
    sftp_password = models.CharField(max_length=255, blank=True)
    
    # Boolean flags
    non_homologated_products_mapping = models.BooleanField(default=False)
    homologation_history_mapping = models.BooleanField(default=False)
    stock_table_mapping = models.BooleanField(default=False)
    email_configuration = models.BooleanField(default=False)
    alert_configuration = models.BooleanField(default=False)
    
    # Email addresses (stored as comma-separated string)
    approved_emails = models.TextField(blank=True)
    
    class Meta:
        # Ensure only one configuration exists
        constraints = [
            models.constraints.UniqueConstraint(fields=['id'], name='single_configuration')
        ]