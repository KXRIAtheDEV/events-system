from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
from django.shortcuts import render


def home(request):
    return render(request, 'index.html')


def event_list(request):
    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Browse Events - EventHub</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container">
                <a class="navbar-brand" href="/">EventHub</a>
                <div class="navbar-nav ms-auto">
                    <a class="nav-link" href="/">Home</a>
                    <a class="nav-link" href="/admin">Admin</a>
                </div>
            </div>
        </nav>
        <main class="container mt-4">
            <h1>Browse Events</h1>
            <p class="lead">Published events will appear here once organizers start adding them.</p>
            <div class="alert alert-info">No events are available yet.</div>
        </main>
    </body>
    </html>
    """
    return HttpResponse(html)


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


