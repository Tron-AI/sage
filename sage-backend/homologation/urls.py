from django.urls import path
from .views import ProductListView, OfficialCatalogListView, CreateHomologationView, ProductMatchView, HomologationView, DownloadPendingProductsView, DownloadActiveCatalogView, UploadCatalogData, DownloadTemplate, HomologationUploadView, HomologationDownloadTemplateView, HomologationDashboard, HomologationConfigurationView, HomologationConfigurationBooleanFieldsView

urlpatterns = [
    path('matches/', ProductMatchView.as_view(), name='product-matches'),
    path('accept-match/<int:homologation_id>/', HomologationView.as_view(), name='homologation-update'),
    path('products/', ProductListView.as_view(), name='product-list'),
    path('catalogs/', OfficialCatalogListView.as_view(), name='catalog-list'),
    path('download-pending-products/', DownloadPendingProductsView.as_view(), name='download_pending_products'),
    path('download-active-items/', DownloadActiveCatalogView.as_view(), name='download_active_catalog_items'),
    path('official-catalog/upload/', UploadCatalogData.as_view(), name='upload-catalog-data'),
    path('official-catalog/download-template/', DownloadTemplate.as_view(), name='download-catalog-template'),
    path('upload/', HomologationUploadView.as_view(), name='homologation-upload'),
    path('download-template/', HomologationDownloadTemplateView.as_view(), name='homologation-template-download'),
    path('dashboard-api/', HomologationDashboard.as_view(), name='homologation-dashboard'),
    path('configuration/', HomologationConfigurationView.as_view(), name='configuration'),
    path('configuration/booleans/', HomologationConfigurationBooleanFieldsView.as_view(), name='homologation-configuration-booleans'),
    path('', CreateHomologationView.as_view(), name='create-homologation'),
]