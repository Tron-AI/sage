# Generated by Django 5.1.3 on 2024-11-14 17:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0002_productfield_validationrule'),
    ]

    operations = [
        migrations.AlterField(
            model_name='catalog',
            name='mandatory',
            field=models.CharField(choices=[('Is Mandatory', 'Is Mandatory'), ('Not Mandatory', 'Not Mandatory')], default='mandatory', max_length=20),
        ),
    ]