from django.urls import path
from . import views

urlpatterns = [
    path('pay/', views.initiate_payment, name='initiate_payment'),
    path('callback/', views.mpesa_callback, name='mpesa_callback'),
    path('status/<str:checkout_id>/', views.payment_status, name='payment_status'),
]