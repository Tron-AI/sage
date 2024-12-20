from django.urls import path
from .views import *

urlpatterns = [
    path('products/', ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('products/<int:pk>/catalogs/', ProductCatalogsView.as_view(), name='product-catalogs'),

    # Product Field URLs
    path('product/<int:product_id>/field/', ProductFieldListCreateView.as_view(), name='product-field-list-create'),
    path('product/<int:product_id>/field/<int:field_id>/', ProductFieldDetailView.as_view(), name='product-field-detail'),

    # Validation Rule URLs
    path('product/<int:product_id>/field/<int:field_id>/validation-rule/', 
         ValidationRuleCreateView.as_view(), name='validation-rule-create'),
    path('product/<int:product_id>/field/<int:field_id>/validation-rule/<int:validation_rule_id>/',
         ValidationRuleDetailView.as_view(), name='validation-rule-detail'),
     path('product/<int:product_id>/fields/', ProductFieldValidationRuleDetailView.as_view(), name='product-fields-detail'),
     path('product/<int:product_id>/catalog/', GetCatalogIdByProduct.as_view(), name='get_catalog_id_by_product'),


    # Catalog URLs
    path('catalogs/', CatalogListCreateView.as_view(), name='catalog-list-create'),
    path('catalogs/<int:pk>/', CatalogDetailView.as_view(), name='catalog-detail'),
    path('catalogs/filter/', CatalogFilterView.as_view(), name='catalog-filter'),
    path('catalogs/<int:catalog_id>/upload/', FileUploadView.as_view(), name='catalog-file-upload'),
    path('catalogs/<int:catalog_id>/uploaded-files/', UploadedFileListView.as_view(), name='uploaded-file-list'),
    path('catalogs/<int:catalog_id>/delete/', DeleteCatalogView.as_view(), name='delete_catalog'),
    path('uploads/', RecentAndOverdueUploadsView.as_view(), name='recent_and_overdue_uploads'),
    path('export/pending-catalogs/', PendingCatalogsExportView.as_view(), name='pending_catalogs_export'),
    path('catalog-status-count/', CatalogStatusCountView.as_view(), name='catalog_status_count'),

    # List view for all dynamic table data of a product
    path('product/<int:product_id>/product-data/', DynamicTableDataListView.as_view(), name='dynamic_table_list'),
    
    # Detail view for a specific dynamic table's data
    path('product/<int:product_id>/product-data/<int:product_data_id>/', DynamicTableDataDetailView.as_view(), name='dynamic_table_detail'),

     path('product/<int:product_id>/save-data/', DynamicTableDataSaveView.as_view(), name='save-product-data'),
     path('product/<int:product_id>/validate-excel/', DynamicTableExcelValidationView.as_view(), name='validaate-excel-data'),
     path('product/<int:product_id>/save-excel-data/', DynamicTableExcelSaveView.as_view(), name='save-excel-data'),
     path('product/<int:product_id>/excel-template/', ExcelTemplateGenerationView.as_view(), name='excel-template'),
     path('product/<int:product_id>/submissions/', SubmissionListView.as_view(), name='submission_list'),
#     # path("create-catalog/", views.create_catalog),
#     path('schema-create/', views.create_schema, name='create_schema'),
#     path('catalog-create/', views.create_catalog, name='create_catalog'),
#     # path("catalogs/", list_catalogs, name="list_catalogs"),
#
# ]

]