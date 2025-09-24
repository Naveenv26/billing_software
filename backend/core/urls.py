from django.contrib import admin
from django.urls import path, include
from rest_framework import routers

# Import the JWT views we need for token authentication
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Your application's views
from api.views import ProductViewSet, CustomerViewSet, InvoiceViewSet, TaxProfileViewSet, MeViewSet, AdminShopViewSet, ReportsViewSet
from accounts.views import ShopRegistrationView


# --- API Router Setup ---
# All your primary ViewSets are registered here for consistency.
router = routers.DefaultRouter()
router.register(r'products', ProductViewSet, basename='products')
router.register(r'customers', CustomerViewSet, basename='customers')
router.register(r'invoices', InvoiceViewSet, basename='invoices')
router.register(r'tax-profile', TaxProfileViewSet, basename='tax')
router.register(r'me', MeViewSet, basename='me')
router.register(r'admin/shops', AdminShopViewSet, basename='admin-shops')


# --- URL Patterns ---
urlpatterns = [
    # 1. Django Admin
    path('admin/', admin.site.urls),

    # 2. Main API router URLs (e.g., /api/products/, /api/customers/)
    path('api/', include(router.urls)),

    # 3. App-specific URLs
    path('api/shops/', include('shops.urls')),
    path("api/reports/", include("reports.urls")),

    # 4. Custom ViewSet routes for reports
    path('api/reports/sales', ReportsViewSet.as_view({'get': 'sales'}), name='report-sales'),
    path('api/reports/stock', ReportsViewSet.as_view({'get': 'stock'}), name='report-stock'),

    # 5. Account Registration
    path("api/register/", ShopRegistrationView.as_view(), name="shop-register"),

    # 6. Token Authentication Endpoints
    # Your React app will post username/password to this URL to log in
   path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
   path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]