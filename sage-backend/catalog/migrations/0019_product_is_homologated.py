# Generated by Django 4.2.17 on 2024-12-22 15:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0018_submissioninfo_submission_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='is_homologated',
            field=models.BooleanField(default=False, null=True),
        ),
    ]