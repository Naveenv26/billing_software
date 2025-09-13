# backend/api/views.py
from rest_framework import viewsets, permissions
from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets, permissions, response, decorators
from rest_framework.response import Response


from accounts.models import User
from shops.models import Shop, TaxProfile
from catalog.models import Product
from customers.models import Customer, LoyaltyAccount
from sales.models import Invoice, InvoiceItem

from .serializers import (
    ProductSerializer,
    CustomerSerializer,
    TaxProfileSerializer,
    UserSerializer,
    InvoiceSerializer,
)

# --- Permissions ---
class IsShopUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

# --- Product API ---
class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsShopUser]

    def get_queryset(self):
        return Product.objects.filter(shop=self.request.user.shop, is_active=True).order_by("name")

    def perform_create(self, serializer):
        serializer.save(shop=self.request.user.shop)

# --- Customer API ---
class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsShopUser]

    def get_queryset(self):
        return Customer.objects.filter(shop=self.request.user.shop).order_by("-id")

    def perform_create(self, serializer):
        obj = serializer.save(shop=self.request.user.shop)
        LoyaltyAccount.objects.get_or_create(shop=self.request.user.shop, customer=obj)

# --- Tax Profile API ---
class TaxProfileViewSet(viewsets.ModelViewSet):
    serializer_class = TaxProfileSerializer
    permission_classes = [IsShopUser]

    def get_queryset(self):
        return TaxProfile.objects.filter(shop=self.request.user.shop)

# --- Current User + Shop Info ---
class MeViewSet(viewsets.ViewSet):
    permission_classes = [IsShopUser]

    def list(self, request):
        u = UserSerializer(request.user).data
        shop = None
        if request.user.shop_id:
            shop = Shop.objects.filter(id=request.user.shop_id).values().first()
        return Response({"user": u, "shop": shop})

# --- Invoice API ---
class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsShopUser]

    def get_queryset(self):
        return Invoice.objects.filter(shop=self.request.user.shop).order_by('-id')

# --- Reports API ---
class ReportsViewSet(viewsets.ViewSet):
    permission_classes = [IsShopUser]

    @decorators.action(detail=False, methods=["get"])
    def sales(self, request):
        rng = request.query_params.get("range", "daily")
        qs = Invoice.objects.filter(shop=request.user.shop)

        today = timezone.localdate()
        if rng == "daily":
            qs = qs.filter(invoice_date__date=today)
        elif rng == "weekly":
            start = today - timezone.timedelta(days=today.weekday())
            qs = qs.filter(invoice_date__date__gte=start)
        elif rng == "monthly":
            qs = qs.filter(invoice_date__year=today.year, invoice_date__month=today.month)

        total = qs.aggregate(total=Sum("grand_total"))["total"] or 0
        count = qs.count()
        return Response({"total": total, "count": count})

    @decorators.action(detail=False, methods=["get"])
    def stock(self, request):
        products = Product.objects.filter(shop=request.user.shop).values("id", "name", "quantity", "price")
        return Response({"products": list(products)})
