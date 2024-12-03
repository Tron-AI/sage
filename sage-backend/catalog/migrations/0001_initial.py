# Generated by Django 4.2.16 on 2024-11-04 21:49

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Product",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("schema_name", models.CharField(max_length=255)),
                ("domain", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="Catalog",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                (
                    "icon",
                    models.ImageField(
                        blank=True, null=True, upload_to="catalog_icons/"
                    ),
                ),
                ("tags", models.JSONField(blank=True, default=list)),
                ("corporate", models.CharField(max_length=255)),
                ("menu", models.CharField(max_length=255)),
                (
                    "mandatory",
                    models.CharField(
                        choices=[
                            ("mandatory", "Is Mandatory"),
                            ("not_mandatory", "Not Mandatory"),
                        ],
                        default="mandatory",
                        max_length=20,
                    ),
                ),
                (
                    "frequency",
                    models.CharField(
                        choices=[
                            ("daily", "Daily"),
                            ("weekly", "Weekly"),
                            ("monthly", "Monthly"),
                        ],
                        default="daily",
                        max_length=20,
                    ),
                ),
                ("deadline", models.DateField(blank=True, null=True)),
                ("api_key", models.CharField(blank=True, max_length=255)),
                ("submission_email", models.EmailField(max_length=255)),
                ("authorized_emails", models.TextField(blank=True)),
                ("sftp_folder", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="catalogs",
                        to="catalog.product",
                    ),
                ),
                (
                    "responsible_user",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
