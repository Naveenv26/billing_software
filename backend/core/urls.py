from django.contrib import admin
from django.urls import path, include
from rest_framework import routers

from api.views import ProductViewSet, CustomerViewSet, InvoiceViewSet, TaxProfileViewSet, MeViewSet, ReportsViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = routers.DefaultRouter()
router.register(r'products', ProductViewSet, basename='products')
router.register(r'customers', CustomerViewSet, basename='customers')
router.register(r'invoices', InvoiceViewSet, basename='invoices')
router.register(r'tax-profile', TaxProfileViewSet, basename='tax')
router.register(r'me', MeViewSet, basename='me')

urlpatterns = [
    path("api/reports/", include("reports.urls")),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    path('api/reports/sales', ReportsViewSet.as_view({'get':'sales'})),
    path('api/reports/stock', ReportsViewSet.as_view({'get':'stock'})),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
