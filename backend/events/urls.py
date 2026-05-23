from django.urls import path
from . import views

app_name = 'events'

urlpatterns = [
    path('', views.home, name='home'),
    path('organizer/dashboard/', views.organizer_dashboard, name='organizer_dashboard'),
]
