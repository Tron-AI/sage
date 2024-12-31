from django.core.management.base import BaseCommand
from homologation.models import HomologationConfiguration

class Command(BaseCommand):
    help = 'Create default HomologationConfiguration record'

    def handle(self, *args, **kwargs):
        if not HomologationConfiguration.objects.exists():
            HomologationConfiguration.objects.create(
                name="Default Configuration",
                corporate="Default Corporate",
                product="Default Product",
                responsible="Default Responsible",
                frequency="Default Frequency",
                db_ip="127.0.0.1",
                db_user="root",
                db_password="password",
                sftp_ip="127.0.0.1",
                sftp_user="sftp_user",
                sftp_password="sftp_password",
                non_homologated_products_mapping=True,
                homologation_history_mapping=True,
                stock_table_mapping=True,
                email_configuration=True,
                alert_configuration=True,
                approved_emails="admin@example.com"
            )
            self.stdout.write(self.style.SUCCESS('Successfully created default HomologationConfiguration record'))
        else:
            self.stdout.write(self.style.WARNING('HomologationConfiguration record already exists'))