from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.shortcuts import render


def home(request):
    return render(request, 'index.html')


@login_required
def organizer_dashboard(request):
    if not hasattr(request.user, 'role') or request.user.role != 'organizer':
        return HttpResponseForbidden('You do not have permission to access the organizer dashboard.')

    metrics = {
        'events_count': 0,
        'tickets_sold': 0,
        'revenue': '0.00',
        'attendees': 0,
        'top_event': 'No events yet',
        'conversion_rate': 0,
        'new_followers': 0,
        'pending_payout': '0.00',
    }

    return render(request, 'organizer_dashboard.html', {
        'metrics': metrics,
    })
