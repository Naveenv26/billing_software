from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        SITE_OWNER = 'SITE_OWNER', 'Site Owner'
        SHOP_OWNER = 'SHOP_OWNER', 'Shop Owner'
        STAFF = 'STAFF', 'Staff'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STAFF)
    shop = models.ForeignKey('shops.Shop', null=True, blank=True, on_delete=models.SET_NULL, related_name='users')

    def __str__(self):
        return f"{self.username} ({self.role})"
