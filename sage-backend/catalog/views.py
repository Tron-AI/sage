# views.py
import openpyxl
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, Q
from datetime import date
import datetime
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Product, Catalog, ProductField, ValidationRule, UploadedFile
from .serializers import ProductSerializer, CatalogSerializer, CatalogListSerializer, ProductFieldSerializer, ValidationRuleSerializer, UploadedFileSerializer


class ProductListCreateView(generics.ListCreateAPIView):
    """
    List all products or create a new product
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a product
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]


class CatalogListCreateView(generics.ListCreateAPIView):
    """
    List all catalogs or create a new catalog
    """
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CatalogListSerializer
        return CatalogSerializer

    def get_queryset(self):
        queryset = Catalog.objects.all()
        product_id = self.request.query_params.get('product_id', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset

    def perform_create(self, serializer):
        # Catalog is already created in serializer, no need to manually handle 'icon' field here
        serializer.save()

    def create(self, request, *args, **kwargs):
        try:
            print("Request Data:", request.data)
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(e)
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CatalogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a catalog
    """
    queryset = Catalog.objects.all()
    serializer_class = CatalogSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_update(self, serializer):
        # Handle file upload and additional logic if needed
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# Custom views for specific functionality
class ProductCatalogsView(generics.ListAPIView):
    """
    List all catalogs for a specific product
    """
    serializer_class = CatalogListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        product_id = self.kwargs['pk']
        return Catalog.objects.filter(product_id=product_id)


# Custom filter views
class CatalogFilterView(generics.ListAPIView):
    """
    Filter catalogs based on query parameters
    """
    serializer_class = CatalogListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Catalog.objects.all()

        # Add filtering options
        corporate = self.request.query_params.get('corporate', None)
        frequency = self.request.query_params.get('frequency', None)
        mandatory = self.request.query_params.get('mandatory', None)

        if corporate:
            queryset = queryset.filter(corporate__icontains=corporate)
        if frequency:
            queryset = queryset.filter(frequency=frequency)
        if mandatory:
            queryset = queryset.filter(mandatory=mandatory)

        return queryset

class FileUploadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, catalog_id):
        try:
            catalog = Catalog.objects.get(id=catalog_id)
        except Catalog.DoesNotExist:
            return Response({"error": "Catalog not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check for file in the request
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        valid_mime_types = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ]

        # Validate file type
        if file.content_type not in valid_mime_types:
            return Response(
                {"error": "Invalid file type. Please upload an Excel file."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Extract the domain from the catalog's product
        domain = getattr(catalog.product, 'domain', None)

        # Get the user from the request
        user = request.user if request.user.is_authenticated else None

        # Save the file record in the database
        uploaded_file = UploadedFile.objects.create(
            catalog=catalog,
            file=file,
            domain=domain,
            user=user
        )

        # Load the Excel file
        try:
            wb = openpyxl.load_workbook(file)
            sheet = wb.active
        except Exception as e:
            return Response({"error": "Error reading Excel file: " + str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Parse and save data
        errors = []
        product = catalog.product  # Assuming a one-to-one relationship with Product

        for row_idx, row in enumerate(sheet.iter_rows(min_row=2), start=2):  # Skip header row
            try:
                # Extract data from the Excel row
                field_name = row[0].value
                field_type = row[1].value
                length = row[2].value
                is_nullable = row[3].value
                is_primary_key = row[4].value
                is_unique = row[5].value
                is_picklist = row[6].value
                picklist_values = row[7].value
                has_min_max = row[8].value
                min_value = row[9].value
                max_value = row[10].value
                is_email_format = row[11].value
                is_phone_format = row[12].value
                has_max_decimal = row[13].value
                max_decimal_places = row[14].value
                has_date_format = row[15].value
                date_format = row[16].value
                has_max_days_of_age = row[17].value
                max_days_of_age = row[18].value
                custom_validation = row[19].value

                # Create ProductField
                product_field = ProductField.objects.create(
                    name=field_name,
                    field_type=field_type,
                    length=length,
                    is_null=bool(is_nullable),
                    is_primary_key=bool(is_primary_key),
                    product=product
                )
                print(product_field.id)
                # Create ValidationRule
                validation_rule = ValidationRule.objects.create(
                    product_field=product_field,
                    is_unique=bool(is_unique),
                    is_picklist=bool(is_picklist),
                    picklist_values=picklist_values,
                    has_min_max=bool(has_min_max),
                    min_value=min_value,
                    max_value=max_value,
                    is_email_format=bool(is_email_format),
                    is_phone_format=bool(is_phone_format),
                    has_max_decimal=bool(has_max_decimal),
                    max_decimal_places=max_decimal_places,
                    has_date_format=bool(has_date_format),
                    date_format=date_format,
                    has_max_days_of_age=bool(has_max_days_of_age),
                    max_days_of_age=max_days_of_age,
                    custom_validation=custom_validation
                )
                print(validation_rule.id)
            except Exception as e:
                errors.append(f"Row {row_idx}: {str(e)}")

        if errors:
            print(errors)
            return Response({"message": "File uploaded with some errors", "errors": errors}, status=status.HTTP_207_MULTI_STATUS)

        return Response(
            {"message": "File uploaded and data saved successfully"},
            status=status.HTTP_201_CREATED
        )
    

class RecentAndOverdueUploadsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Extract filters from the request body
        from_date_str = request.data.get('from')
        to_date_str = request.data.get('to')
        domain = request.data.get("domain")
        product = request.data.get("product")
        username = request.data.get("user")

        # Convert string dates to datetime objects
        from_date = datetime.datetime.strptime(from_date_str, "%Y-%m-%d") if from_date_str else None
        to_date = datetime.datetime.strptime(to_date_str, "%Y-%m-%d") if to_date_str else None

        # Validate date range: ensure from_date is earlier than to_date
        if from_date and to_date and from_date > to_date:
            raise ValidationError({"error": "The 'from' date must be earlier than the 'to' date."})

        # Build the filter conditions
        filters = Q()
        
        if from_date and to_date:
            filters &= Q(uploaded_at__date__range=[from_date, to_date])
        if domain:
            filters &= Q(domain=domain)
        if product:
            filters &= Q(catalog__product__schema_name=product)
        if username:
            filters &= Q(user__username=username)

        # Apply filters to the querysets
        new_submissions = UploadedFile.objects.filter(filters, uploaded_at__date=date.today()).count()
        total_submissions = UploadedFile.objects.filter(filters).count()
        delayed_submissions = UploadedFile.objects.filter(filters, uploaded_at__gt=F('catalog__deadline')).count()

        # Fetch latest uploads within the filter scope
        latest_uploads = UploadedFile.objects.filter(filters).order_by('-uploaded_at')[:3]
        print(list(UploadedFile.objects.filter(filters).order_by('-uploaded_at')))
        for file in UploadedFile.objects.filter(filters).order_by('-uploaded_at'):
            print(file)  # This uses the model's `__str__` method
            # To print specific fields:
            print(f"ID: {file.id}, Uploaded At: {file.uploaded_at}, Domain: {file.domain}, Username: {username}")

        # Fetch overdue uploads within the filter scope
        overdue_uploads = UploadedFile.objects.filter(filters, uploaded_at__gt=F('catalog__deadline')).order_by('-uploaded_at')[:3]

        # Serialize the data
        data = {
            "new_submissions": new_submissions,
            "total_submissions": total_submissions,
            "delayed_submissions": delayed_submissions,
            "last_submitted": [
                {
                    "date": upload.uploaded_at.date().strftime("%d/%m/%Y"),
                    "domain": upload.domain,
                    "user": upload.user.username if upload.user and upload.user.username else None
                } for upload in latest_uploads
            ],
            "delayed_records": [
                {
                    "date": upload.uploaded_at.date().strftime("%d/%m/%Y"),
                    "domain": upload.domain,
                    "status": upload.catalog.status
                } for upload in overdue_uploads
            ]
        }

        return Response(data, status=status.HTTP_200_OK)

class ProductFieldListCreateView(generics.ListCreateAPIView):
    """
    List all fields for a specific product or create a new field for that product.
    """
    serializer_class = ProductFieldSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        product_id = self.kwargs['product_id']
        return ProductField.objects.filter(product_id=product_id)

    def perform_create(self, serializer):
        # Retrieve the product ID from the URL and ensure it exists
        product_id = self.kwargs['product_id']
        try:
            product = Product.objects.get(id=product_id)
            # Pass the product instance when saving
            serializer.save(product=product)
        except Product.DoesNotExist:
            raise NotFound("Product not found.")


class ProductFieldDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific field for a product.
    """
    serializer_class = ProductFieldSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        product_id = self.kwargs['product_id']
        field_id = self.kwargs['field_id']

        try:
            return ProductField.objects.get(id=field_id, product_id=product_id)
        except ProductField.DoesNotExist:
            raise NotFound("Product field not found.")


class ValidationRuleCreateView(generics.CreateAPIView):
    """
    Create a validation rule only if the associated product field exists.
    """
    serializer_class = ValidationRuleSerializer
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        product_id = self.kwargs['product_id']
        field_id = self.kwargs['field_id']

        # Verify if the ProductField exists
        try:
            product_field = ProductField.objects.get(id=field_id, product_id=product_id)
        except ProductField.DoesNotExist:
            raise NotFound("Product field not found.")

        # Create ValidationRule with the existing ProductField
        validation_rule_data = request.data
        validation_rule_data['product_field'] = product_field.id  # Associate product_field_id
        print(validation_rule_data)
        validation_rule_serializer = ValidationRuleSerializer(data=validation_rule_data)
        if validation_rule_serializer.is_valid():
            validation_rule = validation_rule_serializer.save()
            return Response(validation_rule_serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("Validation Errors:", validation_rule_serializer.errors)
            return Response(
                validation_rule_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )


class ValidationRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a validation rule for a specific field of a product.
    """
    serializer_class = ValidationRuleSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        product_id = self.kwargs['product_id']
        field_id = self.kwargs['field_id']
        validation_rule_id = self.kwargs['validation_rule_id']
        try:
            validation_rule = ValidationRule.objects.get(id=validation_rule_id, product_field=field_id)
            if validation_rule.product_field.product.id != int(product_id):
                raise NotFound("Validation rule not found for this product field.")
            return validation_rule
        except ValidationRule.DoesNotExist:
            raise NotFound("Validation rule not found.")