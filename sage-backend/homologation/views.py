from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
import csv
import pandas as pd
from openpyxl import Workbook
from io import BytesIO
from collections import defaultdict
from django.db import IntegrityError
from django.views import View
from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.core.files.storage import FileSystemStorage
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMessage
from django.conf import settings
from .models import Product, OfficialCatalog, Homologation, HomologationConfiguration
from catalog.models import Catalog
from .ml_model import ProductMatcher
from .utils import save_file_to_sql_server
from .serializers import ProductMatchSerializer, HomologationSerializer, HomologationConfigurationSerializer, HomologationConfigurationBooleanFieldsSerializer

class ProductListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(is_homologated=False)
        product_list = [
            {
                'id': product.id,
                'schema_name': product.schema_name,
                'domain': product.domain,
                'description': product.description,
                'created_at': product.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            }
            for product in products
        ]
        return Response({'products': product_list}, status=status.HTTP_200_OK)

class OfficialCatalogListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        catalogs = OfficialCatalog.objects.filter(is_active=True)
        catalog_list = [
            {
                'id': catalog.id,
                'sku': catalog.sku,
                'name': catalog.name,
                'category': catalog.category,
            }
            for catalog in catalogs
        ]
        return Response({'catalogs': catalog_list}, status=status.HTTP_200_OK)

class CreateHomologationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        print(data)
        product_id = data.get('product_id')
        catalog_id = data.get('catalog_id')
        user = request.user if request.user.is_authenticated else None

        product = get_object_or_404(Product, id=product_id)
        catalog = get_object_or_404(OfficialCatalog, id=catalog_id)

        # Check if Homologation already exists for the given product and catalog
        homologation, created = Homologation.objects.get_or_create(
            product=product,
            official_product=catalog,
            defaults={
                'is_automatic': False,
                'status': 'approved',
                'homologated_by': user
            }
        )

        # If homologation exists, update it (if needed)
        if not created:
            homologation.status = 'approved'  # Example: you can update other fields if necessary
            homologation.homologated_by = user
            homologation.save()

        # Mark the product as homologated (if it wasn't already)
        if not product.is_homologated:
            product.is_homologated = True
            product.save()

        return Response({'message': 'Homologation created successfully', 'homologation_id': homologation.id}, status=status.HTTP_201_CREATED)

class ProductMatchView(APIView):
    def get(self, request):
        try:
            products = Product.objects.filter(is_homologated=False)
            matcher = ProductMatcher()
            results = []

            for product in products:
                matches = matcher.find_matches(product)
                
                if matches:
                    best_match = matches[0]

                    existing_homologation = Homologation.objects.filter(
                        product=product,
                        official_product=best_match['official_product']
                    ).first()

                    homologation_id = None

                    if not existing_homologation and best_match['confidence_score'] > 1:
                        homologation = Homologation.objects.create(
                            product=product,
                            official_product=best_match['official_product'],
                            confidence_score=best_match['confidence_score'],
                            is_automatic=True,
                            status='approved' if best_match['confidence_score'] >= 90 else 'pending'
                        )
                        homologation_id = homologation.id
                    else:
                        homologation_id = existing_homologation.id if existing_homologation else None

                    if best_match['confidence_score'] > 30:
                        results.append({
                            'product_id': product.id,
                            'product_name': product.schema_name,
                            'product_domain': product.domain,
                            'product_description': product.description,
                            'homologation_id': homologation_id,
                            'best_match': ProductMatchSerializer([best_match], many=True).data[0]
                        })

            return Response(results)
        
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class HomologationView(APIView):
    def patch(self, request, homologation_id):
        homologation = get_object_or_404(Homologation, id=homologation_id)
        serializer = HomologationSerializer(homologation, data=request.data, partial=True)
        
        
        if serializer.is_valid():
            updated_homologation = serializer.save(homologated_by=request.user)

            if updated_homologation.status == 'approved':
                updated_homologation.product.is_homologated = True
                updated_homologation.product.save()

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class DownloadPendingProductsView(APIView):
    """
    API endpoint to download products that are not homologated (is_homologated=False).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        products = Product.objects.filter(is_homologated=False)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="pending_products.csv"'

        writer = csv.writer(response)

        writer.writerow(['ID', 'Schema Name', 'Domain', 'Description', 'Is Homologated', 'Created At', 'Updated At'])

        for product in products:
            writer.writerow([
                product.id,
                product.schema_name,
                product.domain,
                product.description,
                product.is_homologated,
                product.created_at,
                product.updated_at,
            ])

        return response
    

class DownloadActiveCatalogView(APIView):
    """
    API endpoint to download active items from the OfficialCatalog.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        catalog_items = OfficialCatalog.objects.filter(is_active=True)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="active_catalog_items.csv"'

        writer = csv.writer(response)

        writer.writerow(['ID', 'SKU', 'Name', 'Description', 'Category', 'Brand', 'Is Active', 'Created At', 'Updated At'])

        for item in catalog_items:
            writer.writerow([
                item.id,
                item.sku,
                item.name,
                item.description,
                item.category,
                item.brand,
                item.is_active,
                item.created_at,
                item.updated_at,
            ])

        return response
    
class UploadCatalogData(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def send_email(self, subject, body, file=None):
        """Helper function to send email notification to both approved_emails and user."""
        homologation_config = HomologationConfiguration.objects.first()
        to_emails = []

        if homologation_config and homologation_config.approved_emails:
            approved_emails = homologation_config.approved_emails.split(',')
            to_emails.extend(approved_emails)
        
        # Include the user's email (from the authenticated request user)
        to_emails.append(self.request.user.email)

        email = EmailMessage(
            subject=subject,
            body=body,
            from_email="your_email@example.com",  # Replace with your sender email
            to=to_emails
        )

        if file and homologation_config.email_configuration:
            email.attach(file.name, file.read(), file.content_type)

        if homologation_config.alert_configuration:
            email.send()

    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        if not file:
            return JsonResponse({"error": "No file provided"}, status=400)

        try:
            save_file_to_sql_server(file, origin="official catalog", uploaded_by=request.user.username)

            df = pd.read_excel(file)

            required_columns = ['sku', 'name', 'description', 'category', 'brand', 'is_active']
            if not all(col in df.columns for col in required_columns):
                error_message = f"Excel file must contain columns: {', '.join(required_columns)}"
                self.send_email("Catalog Data Upload Failed", f"The file upload process failed with the following error:\n\n{error_message}")
                return JsonResponse({"error": error_message}, status=400)

            added_catalogs = []
            for index, row in df.iterrows():
                try:
                    catalog = OfficialCatalog.objects.create(
                        sku=row['sku'],
                        name=row['name'],
                        description=row['description'],
                        category=row['category'],
                        brand=row['brand'],
                        is_active=row['is_active']
                    )
                    added_catalogs.append(catalog)
                except IntegrityError:
                    # Handle duplicate SKU error
                    error_message = f"Duplicate SKU found: {row['sku']}. This SKU already exists."
                    self.send_email("Catalog Data Upload Failed", f"The file upload process failed with the following error:\n\n{error_message}")
                    return JsonResponse({"error": error_message}, status=400)

            # Fetch approved email addresses
            homologation_config = HomologationConfiguration.objects.first()
            if homologation_config and homologation_config.approved_emails:
                approved_emails = homologation_config.approved_emails.split(',')

                # Generate summary for the email
                summary = "\n".join([f"SKU: {catalog.sku}, Name: {catalog.name}" for catalog in added_catalogs])

                # Send success email
                self.send_email(
                    "Official Catalog Upload Summary",
                    f"The file has been successfully uploaded.\n\nSummary of added catalogs:\n{summary}",
                    file
                )

            return JsonResponse({"message": "File uploaded, data saved, and email sent successfully"}, status=200)

        except Exception as e:
            # If any error occurs during the process, send the failure email
            self.send_email("Catalog Data Upload Failed", f"The file upload process failed with the following error:\n\n{str(e)}")
            print(e)
            return JsonResponse({"error": str(e)}, status=500)

class DownloadTemplate(APIView):
    def get(self, request, *args, **kwargs):
        wb = Workbook()
        ws = wb.active
        ws.append(['sku', 'name', 'description', 'category', 'brand', 'is_active'])

        file = BytesIO()
        wb.save(file)
        file.seek(0)

        response = HttpResponse(file, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="catalog_upload_template.xlsx"'
        return response
    

class HomologationUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def send_email(self, subject, body, file=None):
        """Helper function to send email notification to both approved_emails and user."""
        homologation_config = HomologationConfiguration.objects.first()
        to_emails = []

        if homologation_config and homologation_config.approved_emails:
            approved_emails = homologation_config.approved_emails.split(',')
            to_emails.extend(approved_emails)
        
        # Include the user's email (from the authenticated request user)
        to_emails.append(self.request.user.email)

        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.EMAIL_HOST_USER,  # Make sure this is set in your settings
            to=to_emails
        )

        if file and homologation_config.email_configuration:
            email.attach(file.name, file.read(), file.content_type)
        
        if homologation_config.alert_configuration:
            email.send()

    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        if not file:
            error_message = "No file provided"
            return JsonResponse({"error": error_message}, status=400)

        try:
            save_file_to_sql_server(file, origin="homologation", uploaded_by=request.user.username)

            df = pd.read_excel(file)

            # Updated column names
            required_columns = ['product_id', 'official_catalog_id']
            if not all(col in df.columns for col in required_columns):
                error_message = f"Excel file must contain columns: {', '.join(required_columns)}"
                self.send_email("Homologation Upload Failed", f"The file upload process failed with the following error:\n\n{error_message}", file)
                return JsonResponse({"error": error_message}, status=400)

            errors = []
            homologations = []
            homologation_summary = []

            for index, row in df.iterrows():
                try:
                    product = Product.objects.get(id=row['product_id'])
                    official_product = OfficialCatalog.objects.get(id=row['official_catalog_id'])

                    # Check if the homologation already exists
                    homologation = Homologation.objects.filter(product=product, official_product=official_product).first()

                    if homologation:
                        # If it exists, update it
                        homologation.status = 'approved'
                        homologation.homologated_by = request.user
                        homologation.save()
                    else:
                        # If it doesn't exist, create a new homologation
                        homologation = Homologation(
                            product=product,
                            official_product=official_product,
                            homologated_by=request.user,
                            status='approved'  # Automatically set to approved
                        )
                        homologations.append(homologation)

                    # Update product status if not already homologated
                    if not product.is_homologated:
                        product.is_homologated = True
                        product.save()

                    # Append to summary
                    homologation_summary.append(
                        f"Product ID {product.id} homologated with Official Product ID {official_product.id}."
                    )
                except ObjectDoesNotExist:
                    if not Product.objects.filter(id=row['product_id']).exists():
                        errors.append(f"Product with ID {row['product_id']} does not exist.")
                    if not OfficialCatalog.objects.filter(id=row['official_catalog_id']).exists():
                        errors.append(f"Official Catalog with ID {row['official_catalog_id']} does not exist.")
                    continue

            # If errors exist, return them in the response
            if errors:
                error_message = "\n".join(errors)
                self.send_email("Homologation Upload Failed", f"The file upload process failed with the following errors:\n\n{error_message}", file)
                return JsonResponse({"error": errors}, status=400)

            # Create homologations in bulk if they don't exist already
            if homologations:
                Homologation.objects.bulk_create(homologations)

            # Send email with summary and attachment
            self.send_email(
                "Homologation Upload Summary",
                f"The following homologations were processed successfully:\n\n" + "\n".join(homologation_summary),
                file
            )

            return JsonResponse({"message": "Homologations uploaded and email sent successfully"}, status=200)

        except Exception as e:
            error_message = str(e)
            self.send_email("Homologation Upload Failed", f"The file upload process failed with the following error:\n\n{error_message}", file)
            return JsonResponse({"error": error_message}, status=500)

class HomologationDownloadTemplateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Updated column names
        df = pd.DataFrame(columns=['product_id', 'official_catalog_id'])
        
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="homologation_upload_template.xlsx"'
        
        with pd.ExcelWriter(response, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)

        return response
    
class HomologationDashboard(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):

        total_products = Product.objects.count()

        homologated_products = Product.objects.filter(is_homologated=True).count()

        pending_products = Product.objects.filter(is_homologated=False).count()

        rejected_products = Homologation.objects.filter(status='rejected').count()

        if total_products > 0:
            homologated_percentage = (homologated_products / total_products) * 100
            pending_percentage = (pending_products / total_products) * 100
            rejected_percentage = (rejected_products / total_products) * 100
        else:
            homologated_percentage = pending_percentage = rejected_percentage = 0.0

        corporates_summary = defaultdict(lambda: {"Homologated": 0, "Pending": 0, "Rejected": 0, "total_catalogs": 0})

        for catalog in Catalog.objects.all():
            corporate = catalog.corporate
            product = catalog.product
            corporates_summary[corporate]["total_catalogs"] += 1

            if product.is_homologated:
                corporates_summary[corporate]["Homologated"] += 1
            else:
                homologation = Homologation.objects.filter(product=product).first() 
                if homologation and homologation.status == 'rejected':
                    corporates_summary[corporate]["Rejected"] += 1
                else:
                    corporates_summary[corporate]["Pending"] += 1
        
        pending_alerts = []
        print(corporates_summary)

        for corporate, summary in corporates_summary.items():
            if summary["Pending"] > 0:
                pending_alerts.append({
                    "distributor": corporate,
                    "message": f"has {summary['Pending']} pending homologations",
                    "status": "Pending"
                })
            if summary["Rejected"] > 0:
                pending_alerts.append({
                    "distributor": corporate,
                    "message": f"has {summary['Rejected']} products with issues",
                    "status": "Rejected"
                })

        data = {
            "status_counts": {
                "Pending": pending_products,
                "Active": homologated_products,
                "Rejected": rejected_products,
            },
            "total_catalogs": total_products,
            "status_percentages": {
                "Homologated": homologated_percentage,
                "Pending": pending_percentage,
                "Rejected": rejected_percentage,
            },
            "top_corporates": [],
            "pending_alerts": pending_alerts
        }

        for corporate, summary in corporates_summary.items():
            data["top_corporates"].append({
                "corporate": corporate,
                "total_catalogs": summary["total_catalogs"],
                "status_summary": {
                    "Homologated": summary["Homologated"],
                    "Pending": summary["Pending"],
                    "Rejected": summary["Rejected"]
                }
            })

        return Response(data)
    
class HomologationConfigurationView(APIView):
    def get(self, request):
        config = HomologationConfiguration.objects.first()
        if not config:
            config = HomologationConfiguration.objects.create()
        serializer = HomologationConfigurationSerializer(config)
        return Response(serializer.data)

    def put(self, request):
        config = HomologationConfiguration.objects.first()
        if not config:
            config = HomologationConfiguration.objects.create()
        
        serializer = HomologationConfigurationSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class HomologationConfigurationBooleanFieldsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            configuration = HomologationConfiguration.objects.first()
            if not configuration:
                return Response({"error": "No configuration found"}, status=404)

            # Serialize the boolean fields
            serializer = HomologationConfigurationBooleanFieldsSerializer(configuration)
            return Response(serializer.data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)