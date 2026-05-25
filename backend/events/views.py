from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseForbidden
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
