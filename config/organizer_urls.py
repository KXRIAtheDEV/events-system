from django.urls import path
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required, user_passes_test


def _is_organizer(user):
    return user.is_authenticated and (getattr(user, 'role', None) == 'organizer' or user.is_superuser)


def organizer_template(template_name):
    """
    Protect organizer pages so users without organizer access cannot load them.
    This prevents downstream API calls from failing with repeated stats errors.
    """
    protected_view = user_passes_test(_is_organizer, login_url='/login/')(
        TemplateView.as_view(template_name=template_name)
    )
    return login_required(protected_view, login_url='/login/')

urlpatterns = [
    # Dashboard
    path('dashboard/',
         organizer_template('organizer/dashboard/dashboard.html'),
         name='organizer_dashboard'),

    # Events (list, create, edit, detail)
    path('events/',
         organizer_template('organizer/dashboard/events.html'),
         name='organizer_events'),
    path('events/create/',
         organizer_template('organizer/dashboard/events.html'),
         name='organizer_events_create'),
    path('events/<int:event_id>/edit/',
         organizer_template('organizer/dashboard/events.html'),
         name='organizer_events_edit'),
    path('events/<int:event_id>/',
         organizer_template('organizer/dashboard/event_detail.html'),
         name='organizer_event_detail'),

    # Analytics
    path('analytics/',
         organizer_template('organizer/dashboard/analytics.html'),
         name='organizer_analytics'),

    # Tickets
    path('tickets/',
         organizer_template('organizer/dashboard/tickets.html'),
         name='organizer_tickets'),
    path('tickets/scan/',
         organizer_template('organizer/dashboard/tickets.html'),
         name='organizer_tickets_scan'),

    # Attendees
    path('attendees/',
         organizer_template('organizer/dashboard/attendees.html'),
         name='organizer_attendees'),
    path('attendees/<int:attendee_id>/',
         organizer_template('organizer/dashboard/attendee_detail.html'),
         name='organizer_attendee_detail'),

    # Bookings
    path('bookings/',
         organizer_template('organizer/dashboard/bookings.html'),
         name='organizer_bookings'),
    path('bookings/<int:booking_id>/',
         organizer_template('organizer/dashboard/booking_detail.html'),
         name='organizer_booking_detail'),

    # Payouts
    path('payouts/',
         organizer_template('organizer/dashboard/payouts.html'),
         name='organizer_payouts'),
    path('payouts/settings/',
         organizer_template('organizer/dashboard/payouts.html'),
         name='organizer_payouts_settings'),

    # Promotions
    path('promotions/',
         organizer_template('organizer/dashboard/promotions.html'),
         name='organizer_promotions'),
    path('promotions/create/',
         organizer_template('organizer/dashboard/promotions.html'),
         name='organizer_promotions_create'),

    # Reviews
    path('reviews/',
         organizer_template('organizer/dashboard/reviews.html'),
         name='organizer_reviews'),

    # Notifications
    path('notifications/',
         organizer_template('organizer/dashboard/notifications.html'),
         name='organizer_notifications'),
    path('notifications/send/',
         organizer_template('organizer/dashboard/notifications.html'),
         name='organizer_notifications_send'),

    # Reports
    path('reports/',
         organizer_template('organizer/dashboard/reports.html'),
         name='organizer_reports'),
    path('reports/sales/',
         organizer_template('organizer/dashboard/reports.html'),
         name='organizer_reports_sales'),
    path('reports/events/',
         organizer_template('organizer/dashboard/reports.html'),
         name='organizer_reports_events'),

    # Check-in
    path('checkin/',
         organizer_template('organizer/dashboard/checkin.html'),
         name='organizer_checkin'),
    path('checkin/devices/',
         organizer_template('organizer/dashboard/checkin.html'),
         name='organizer_checkin_devices'),

    # Settings
    path('settings/',
         organizer_template('organizer/dashboard/settings.html'),
         name='organizer_settings'),
    path('settings/general/',
         organizer_template('organizer/dashboard/settings.html'),
         name='organizer_settings_general'),
    path('settings/payment/',
         organizer_template('organizer/dashboard/settings.html'),
         name='organizer_settings_payment'),
    path('settings/team/',
         organizer_template('organizer/dashboard/settings.html'),
         name='organizer_settings_team'),
    path('settings/api-keys/',
         organizer_template('organizer/dashboard/settings.html'),
         name='organizer_settings_api'),

    # Support
    path('support/',
         organizer_template('organizer/dashboard/support.html'),
         name='organizer_support'),
    path('support/tickets/',
         organizer_template('organizer/dashboard/support.html'),
         name='organizer_support_tickets'),
    path('support/tickets/<int:ticket_id>/',
         organizer_template('organizer/dashboard/support.html'),
         name='organizer_support_ticket_detail'),
]