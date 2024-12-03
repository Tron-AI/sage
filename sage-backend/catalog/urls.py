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


    # Catalog URLs
    path('catalogs/', CatalogListCreateView.as_view(), name='catalog-list-create'),
    path('catalogs/<int:pk>/', CatalogDetailView.as_view(), name='catalog-detail'),
    path('catalogs/filter/', CatalogFilterView.as_view(), name='catalog-filter'),
    path('catalogs/<int:catalog_id>/upload/', FileUploadView.as_view(), name='catalog-file-upload'),
    path('uploads/', RecentAndOverdueUploadsView.as_view(), name='recent_and_overdue_uploads'),

#     # path("create-catalog/", views.create_catalog),
#     path('schema-create/', views.create_schema, name='create_schema'),
#     path('catalog-create/', views.create_catalog, name='create_catalog'),
#     # path("catalogs/", list_catalogs, name="list_catalogs"),
#
# ]

]