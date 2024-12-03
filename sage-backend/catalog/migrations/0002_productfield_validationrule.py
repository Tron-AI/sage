# Generated by Django 5.1.3 on 2024-11-08 12:26

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductField',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('field_type', models.CharField(choices=[('char', 'Char'), ('int', 'Integer'), ('float', 'Float'), ('boolean', 'Boolean'), ('date', 'Date'), ('datetime', 'DateTime'), ('text', 'Text')], max_length=50)),
                ('length', models.PositiveIntegerField(blank=True, help_text='Length of the field if applicable', null=True)),
                ('is_null', models.BooleanField(default=True)),
                ('is_primary_key', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='product_fields', to='catalog.product')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='ValidationRule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_unique', models.BooleanField(default=False)),
                ('is_picklist', models.BooleanField(default=False)),
                ('picklist_values', models.TextField(blank=True, help_text='Comma-separated values if picklist is true')),
                ('has_min_max', models.BooleanField(default=False)),
                ('min_value', models.FloatField(blank=True, null=True)),
                ('max_value', models.FloatField(blank=True, null=True)),
                ('is_email_format', models.BooleanField(default=False)),
                ('is_phone_format', models.BooleanField(default=False)),
                ('has_max_decimal', models.BooleanField(default=False)),
                ('max_decimal_places', models.PositiveIntegerField(blank=True, null=True)),
                ('has_date_format', models.BooleanField(default=False)),
                ('date_format', models.CharField(blank=True, help_text="Expected date format, e.g., 'YYYY-MM-DD'", max_length=50)),
                ('has_max_days_of_age', models.BooleanField(default=False)),
                ('max_days_of_age', models.PositiveIntegerField(blank=True, null=True)),
                ('custom_validation', models.CharField(blank=True, help_text='Custom validation rule', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('product_field', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='validation_rule', to='catalog.productfield')),
            ],
            options={
                'ordering': ['product_field'],
            },
        ),
    ]
