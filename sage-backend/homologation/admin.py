from django.contrib import admin

from .models import  Homologation, OfficialCatalog, HomologationConfiguration
# Register your models here.

admin.site.register(Homologation)
admin.site.register(OfficialCatalog)
admin.site.register(HomologationConfiguration)