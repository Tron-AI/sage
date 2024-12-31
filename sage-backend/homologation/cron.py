from django.core.mail import send_mail
from django.template.loader import render_to_string
from django_cron import CronJobBase, Schedule
from .models import Homologation, HomologationConfiguration
from django.conf import settings
from django.db import models

class SendHomologationReportCronJob(CronJobBase):
    code = 'homologation.send_homologation_report'

    def get_schedule(self):
        homologation_config = HomologationConfiguration.objects.first()

        if not homologation_config:
            return None

        frequency = homologation_config.frequency

        if frequency == 'Daily':
            return Schedule(run_every_mins=1440)
        elif frequency == 'Weekly':
            return Schedule(run_every_mins=10080)
        elif frequency == 'Monthly':
            return Schedule(run_every_mins=43200)
        else:
            return None

    def do(self):
        status_counts = Homologation.objects.values('status').annotate(count=models.Count('status'))
        email_content = render_to_string('homologation/daily_report.html', {'status_counts': status_counts})

        homologation_config = HomologationConfiguration.objects.first()
        to_emails = []

        if homologation_config and homologation_config.approved_emails:
            approved_emails = homologation_config.approved_emails.split(',')
            to_emails.extend(approved_emails)

        subject = 'Homologation Report'
        from_email = settings.EMAIL_HOST_USER

        if homologation_config.alert_configuration:
            send_mail(
                subject,
                '',
                from_email,
                to_emails,
                html_message=email_content
            )
