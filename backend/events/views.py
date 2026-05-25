from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import render


def home(request):
    return render(request, 'index.html')


def organizer_dashboard(request):
    # Support both logged-in organizer and anonymous views for easy local testing
    if request.user.is_authenticated:
        if hasattr(request.user, 'role') and request.user.role != 'organizer':
            return HttpResponseForbidden('You do not have permission to access the organizer dashboard.')

    return render(request, 'organizer_dashboard.html')

def organizer_dashboard_stats(request):
    metrics = {
        'events_count': 6,
        'tickets_sold': 418,
        'revenue': 83600.00,
        'attendees': 354,
        'top_event': 'Tech Innovations Conference 2026',
        'conversion_rate': 72,
        'new_followers': 48,
        'pending_payout': 24500.00,
    }

    return JsonResponse(metrics)

