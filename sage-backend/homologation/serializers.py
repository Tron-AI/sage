from rest_framework import serializers
from .models import Product, OfficialCatalog, Homologation, HomologationConfiguration

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'schema_name', 'description', 'domain']

class OfficialCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfficialCatalog
        fields = ['id', 'sku', 'name', 'description', 'category', 'brand']

class ProductMatchSerializer(serializers.Serializer):
    official_product = OfficialCatalogSerializer()
    confidence_score = serializers.FloatField()

class HomologationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Homologation
        fields = ['id', 'product', 'official_product', 'confidence_score', 'status']

class HomologationConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomologationConfiguration
        fields = '__all__'

class HomologationConfigurationBooleanFieldsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomologationConfiguration
        fields = [
            'non_homologated_products_mapping',
            'homologation_history_mapping',
            'stock_table_mapping',
            'email_configuration',
            'alert_configuration',
        ]