from django.contrib import admin
from .models import  Catalog, User, UploadedFile, ProductField, ValidationRule, Product, ProductTableInfo

# Register your models here.

admin.site.register(Catalog)
admin.site.register(User)
admin.site.register(UploadedFile)
admin.site.register(ProductField)
admin.site.register(ValidationRule)
admin.site.register(Product)
admin.site.register(ProductTableInfo)

# admin.site.register(Schema)
# admin.site.register(Entry)
