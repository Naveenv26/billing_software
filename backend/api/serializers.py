# backend/api/serializers.py
from rest_framework import serializers
from accounts.models import User
from shops.models import Shop, TaxProfile
from catalog.models import Product
from customers.models import Customer, LoyaltyAccount
from sales.models import Invoice, InvoiceItem
# api/serializers.py
from rest_framework import serializers
from shops.models import Shop, SubscriptionPlan, TaxProfile   # 👈 add this

# --- Shops & Tax ---
class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = "__all__"

class TaxProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaxProfile
        fields = "__all__"

# --- User ---
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "role", "shop"]

# --- Products ---
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ["shop", "updated_at"]

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)

# --- Customers ---
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"
        read_only_fields = ["shop"]

class LoyaltySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyAccount
        fields = "__all__"

# --- Invoices ---
class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = InvoiceItem
        fields = ["id", "product", "product_name", "qty", "unit_price", "tax_rate", "line_total", "oversold"]
        read_only_fields = ["oversold"]

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    customer_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    customer_mobile = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "shop", "customer", "customer_name", "customer_mobile",
            "number", "invoice_date", "subtotal", "tax_total",
            "discount_total", "grand_total", "payment_mode",
            "created_by", "items"
        ]
        read_only_fields = ["shop", "number", "created_by"]

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        user = self.context["request"].user
        shop = user.shop

        # Generate invoice number
        shop.counter_invoice += 1
        shop.save(update_fields=["counter_invoice"])
        number = f"INV-{shop.id}-{shop.counter_invoice:06d}"

        invoice = Invoice.objects.create(
            shop=shop, number=number, created_by=user, **validated_data
        )

        from catalog.models import Product
        for it in items_data:
            prod = Product.objects.get(id=it["product"].id, shop=shop)
            qty = it["qty"]

            # ✅ Overselling logic
            if prod.quantity < qty:
                oversold_flag = True
                prod.quantity = 0
            else:
                oversold_flag = False
                prod.quantity -= qty

            prod.save(update_fields=["quantity"])

            InvoiceItem.objects.create(
                invoice=invoice,
                product=prod,
                qty=qty,
                unit_price=it["unit_price"],
                tax_rate=it.get("tax_rate", 0),
                line_total=it["line_total"],
                oversold=oversold_flag,
            )

        return invoice
class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class ShopSerializer(serializers.ModelSerializer):
    active_subscription = SubscriptionPlanSerializer(read_only=True)

    class Meta:
        model = Shop
        fields = '__all__'
