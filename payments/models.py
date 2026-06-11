from django.db import models
from django.conf import settings


class Payment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    event = models.ForeignKey('events.Event', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    phone_number = models.CharField(max_length=15)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=1)
    merchant_request_id = models.CharField(max_length=100, blank=True)
    checkout_request_id = models.CharField(max_length=100, unique=True, blank=True)
    mpesa_receipt = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.phone_number} - {self.amount} - {self.status}"


class PaymentOrder(models.Model):
    STATUS_CHOICES = [
        ('pending_payment', 'Pending Payment'),
        ('verifying', 'Verifying Screenshot'),
        ('manual_review', 'Awaiting Organizer Approval'),
        ('completed', 'Completed'),
        ('failed', 'Verification Failed'),
        ('rejected', 'Rejected'),
    ]

    TICKET_TYPE_CHOICES = [
        ('Regular', 'Regular'),
        ('VIP', 'VIP'),
        ('VVIP', 'VVIP'),
    ]

    attendee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_orders'
    )
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='payment_orders')
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organizer_payment_orders'
    )
    ticket_type = models.CharField(max_length=20, choices=TICKET_TYPE_CHOICES, default='Regular')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_payment')
    screenshot = models.ImageField(upload_to='payment_screenshots/', null=True, blank=True)
    screenshot_data = models.TextField(
        blank=True,
        help_text='Base64 data-URI screenshot (used on serverless where media/ is read-only).',
    )
    submitted_mpesa_name = models.CharField(max_length=150, blank=True)
    ocr_raw_text = models.TextField(blank=True)
    screenshot_verified = models.BooleanField(
        null=True,
        blank=True,
        help_text='OCR auto-verification result (null = not checked).',
    )
    verification_message = models.TextField(blank=True)
    ticket = models.ForeignKey(
        'bookings.Ticket', on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['attendee', 'status']),
            models.Index(fields=['organizer', 'status']),
        ]

    def __str__(self):
        return f"Order #{self.pk} - {self.event.title} - {self.status}"


class OrganizerNotification(models.Model):
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organizer_notifications'
    )
    payment_order = models.ForeignKey(
        PaymentOrder, on_delete=models.CASCADE, null=True, blank=True, related_name='organizer_notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, default='info')
    is_read = models.BooleanField(default=False)
    requires_action = models.BooleanField(default=False)
    action_type = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organizer', 'is_read']),
        ]

    def __str__(self):
        return f"{self.title} -> {self.organizer.username}"


class AttendeeNotification(models.Model):
    attendee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendee_notifications'
    )
    payment_order = models.ForeignKey(
        PaymentOrder, on_delete=models.CASCADE, null=True, blank=True, related_name='attendee_notifications'
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['attendee', 'is_read']),
        ]

    def __str__(self):
        return f"{self.title} -> {self.attendee.username}"
