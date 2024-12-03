# Generated by Django 5.1.3 on 2024-11-19 13:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0007_alter_productfield_field_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='productfield',
            name='field_type',
            field=models.CharField(choices=[('varchar', 'Char'), ('int', 'Integer'), ('float', 'Float'), ('boolean', 'Boolean'), ('date', 'Date'), ('datetime', 'DateTime'), ('text', 'Text'), ('decimal', 'Decimal')], max_length=50),
        ),
    ]