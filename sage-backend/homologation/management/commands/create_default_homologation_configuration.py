import os
from django.core.management.base import BaseCommand
from homologation.models import HomologationConfiguration

class Command(BaseCommand):
    help = 'Create or update HomologationConfiguration record with environment variables'

    def handle(self, *args, **kwargs):
        # Get environment variables with defaults
        db_ip = os.getenv('DB_IP', 'db')
        db_user = os.getenv('DB_USER', 'postgres')
        db_password = os.getenv('DB_PASSWORD', 'abc123')
        sftp_ip = os.getenv('SFTP_IP', '127.0.0.1')
        sftp_user = os.getenv('SFTP_USER', 'sftp_user')
        sftp_password = os.getenv('SFTP_PASSWORD', 'sftp_password')

        # Define common configuration values
        config_data = {
            'name': "Default Configuration",
            'corporate': "Default Corporate",
            'product': "Default Product",
            'responsible': "Default Responsible",
            'frequency': "Default Frequency",
            'db_ip': db_ip,
            'db_user': db_user,
            'db_password': db_password,
            'sftp_ip': sftp_ip,
            'sftp_user': sftp_user,
            'sftp_password': sftp_password,
            'non_homologated_products_mapping': True,
            'homologation_history_mapping': True,
            'stock_table_mapping': True,
            'email_configuration': True,
            'alert_configuration': True,
            'approved_emails': "admin@example.com"
        }

        if HomologationConfiguration.objects.exists():
            # Update existing record
            config = HomologationConfiguration.objects.first()
            for key, value in config_data.items():
                setattr(config, key, value)
            config.save()
            self.stdout.write(self.style.SUCCESS('Successfully updated HomologationConfiguration record'))
        else:
            # Create new record
            HomologationConfiguration.objects.create(**config_data)
            self.stdout.write(self.style.SUCCESS('Successfully created default HomologationConfiguration record'))