# Generated by Django 4.2.17 on 2024-12-18 22:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0017_submissioninfo_catalog_submissioninfo_domain'),
    ]

    operations = [
        migrations.AddField(
            model_name='submissioninfo',
            name='submission_type',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
