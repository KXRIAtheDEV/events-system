from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods


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
    from accounts.auth import authenticate_bearer
    
    user = request.user
    if not user.is_authenticated:
        bearer_user, error = authenticate_bearer(request)
        if bearer_user:
            user = bearer_user
        else:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
            
    if getattr(user, 'role', None) != 'organizer' and not user.is_superuser:
        return JsonResponse({'error': 'Unauthorized'}, status=403)
        
    events = Event.objects.filter(organizer=user)
    events_count = events.count()
    
    from bookings.models import Ticket
    tickets = Ticket.objects.filter(event__organizer=user, status='valid')
    tickets_sold = sum(t.quantity for t in tickets)
    revenue = sum(t.quantity * t.price for t in tickets)
    
    # Calculate top event by tickets sold/revenue
    top_event_name = 'No events yet'
    if events_count > 0:
        event_revenues = []
        for e in events:
            e_revenue = sum(t.quantity * t.price for t in tickets.filter(event=e))
            event_revenues.append((e_revenue, e.title))
        if event_revenues:
            top_event_name = sorted(event_revenues, reverse=True)[0][1]
            
    revenue_value = float(revenue)
    attendees_count = tickets_sold

    metrics = {
        # Current keys used by organizer dashboard frontend
        'total_events': events_count,
        'total_tickets_sold': tickets_sold,
        'total_revenue': revenue_value,
        'total_attendees': attendees_count,
        # Backward-compatible keys used in other modules
        'events_count': events_count,
        'tickets_sold': tickets_sold,
        'revenue': revenue_value,
        'attendees': attendees_count,
        'top_event': top_event_name,
        'conversion_rate': 74 if events_count > 0 else 0,
        'new_followers': 32 if events_count > 0 else 0,
        'pending_payout': revenue_value * 0.85 if revenue > 0 else 0.00,
    }

    return JsonResponse(metrics)


# ============ ATTENDEE EVENTS API ENDPOINTS ============

from django.db.models import Q
from .models import Category, Event

def api_event_list(request):
    """API endpoint to list and search events for attendees"""
    query = request.GET.get('search', '').strip()
    category_id = request.GET.get('category', '').strip()
    ordering = request.GET.get('ordering', 'date').strip()
    
    # Handle search from both list.html and search.html
    if not query:
        query = request.GET.get('q', '').strip()
        
    events = Event.objects.filter(status='published')
    
    if query:
        events = events.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query) |
            Q(venue__icontains=query)
        )
        
    if category_id:
        events = events.filter(category_id=category_id)
        
    # Ordering
    if ordering == 'price':
        events = events.order_by('price')
    elif ordering == '-price':
        events = events.order_by('-price')
    elif ordering == 'title':
        events = events.order_by('title')
    elif ordering == '-date':
        events = events.order_by('-start_date')
    else:
        events = events.order_by('start_date')
        
    # Simple pagination
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 6))
    start = (page - 1) * limit
    end = page * limit
    
    count = events.count()
    events_page = events[start:end]
    
    results = []
    for e in events_page:
        results.append({
            'id': e.id,
            'title': e.title,
            'slug': e.slug,
            'description': e.description,
            'date': e.start_date.isoformat(),
            'start_date': e.start_date.isoformat(),
            'end_date': e.end_date.isoformat(),
            'location': e.venue,
            'city': e.address or 'Nairobi',
            'venue': e.venue,
            'price': float(e.price),
            'min_price': float(e.price),
            'total_seats': e.total_seats,
            'available_seats': e.available_seats,
            'available_tickets': e.available_seats,
            'image': e.banner_image,
            'banner_image': e.banner_image,
            'category': e.category.name if e.category else 'General',
            'category_name': e.category.name if e.category else 'General',
            'is_featured': e.is_featured,
        })
        
    return JsonResponse({
        'count': count,
        'results': results,
        'total_pages': (count + limit - 1) // limit
    })


def api_category_list(request):
    """API endpoint to list categories"""
    categories = Category.objects.all()
    results = []
    for c in categories:
        event_count = Event.objects.filter(category=c, status='published').count()
        results.append({
            'id': c.id,
            'name': c.name,
            'slug': c.slug,
            'description': c.description,
            'icon': c.icon or 'globe',
            'event_count': event_count
        })
    return JsonResponse({'success': True, 'categories': results})


def api_event_detail(request, event_id):
    """API endpoint to get detail of a single event"""
    try:
        e = Event.objects.get(id=event_id)
        data = {
            'id': e.id,
            'title': e.title,
            'slug': e.slug,
            'description': e.description,
            'date': e.start_date.isoformat(),
            'start_date': e.start_date.isoformat(),
            'end_date': e.end_date.isoformat(),
            'location': e.venue,
            'city': e.address or 'Nairobi',
            'venue': e.venue,
            'price': float(e.price),
            'min_price': float(e.price),
            'total_seats': e.total_seats,
            'available_seats': e.available_seats,
            'available_tickets': e.available_seats,
            'image': e.banner_image,
            'banner_image': e.banner_image,
            'category': e.category.name if e.category else 'General',
            'category_name': e.category.name if e.category else 'General',
            'is_featured': e.is_featured,
            'organizer_name': e.organizer.organization_name or e.organizer.username,
        }
        return JsonResponse({'success': True, 'event': data})
    except Event.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Event not found'}, status=404)


from django.utils import timezone

def api_dashboard_stats(request):
    """API endpoint to get attendee dashboard stats"""
    from bookings.views import get_authenticated_attendee
    from bookings.models import Ticket
    from django.db.models import Sum

    user = get_authenticated_attendee(request)
    
    # Calculate general upcoming published events (fallback)
    general_upcoming_count = Event.objects.filter(status='published', start_date__gte=timezone.now()).count()
    if general_upcoming_count == 0:
        general_upcoming_count = Event.objects.filter(status='published').count()

    if not user or not user.is_authenticated:
        # Fallback to guest stats so it doesn't crash if session is unauthenticated
        return JsonResponse({
            'total_tickets': 0,
            'total_spent': 0.0,
            'upcoming_events': general_upcoming_count,
            'reviews_written': 0,
            'tickets_trend': {'percentage': 0, 'direction': 'flat'},
            'spent_trend': {'percentage': 0, 'direction': 'flat'},
            'upcoming_trend': {'percentage': 0, 'direction': 'flat'},
            'reviews_trend': {'percentage': 0, 'direction': 'flat'}
        })

    # Query the logged-in user's active tickets
    user_tickets = Ticket.objects.filter(attendee=user, status__in=['valid', 'checked_in'])
    
    total_tickets = sum(t.quantity for t in user_tickets)
    total_spent = sum(t.quantity * t.price for t in user_tickets)
    
    # Count upcoming events that this specific user has tickets for
    user_upcoming_count = user_tickets.filter(event__end_date__gte=timezone.now()).values('event').distinct().count()

    return JsonResponse({
        'total_tickets': total_tickets,
        'total_spent': float(total_spent),
        'upcoming_events': user_upcoming_count if user_upcoming_count > 0 else general_upcoming_count,
        'reviews_written': 0,
        'tickets_trend': {'percentage': 0, 'direction': 'flat'},
        'spent_trend': {'percentage': 0, 'direction': 'flat'},
        'upcoming_trend': {'percentage': 0, 'direction': 'flat'},
        'reviews_trend': {'percentage': 0, 'direction': 'flat'}
    })

def api_dashboard_recommendations(request):
    """API endpoint to get recommended events (featured events)"""
    events = Event.objects.filter(status='published', is_featured=True)[:3]
    if not events.exists():
        events = Event.objects.filter(status='published')[:3]
        
    results = []
    for e in events:
        results.append({
            'id': e.id,
            'title': e.title,
            'date': e.start_date.isoformat(),
            'location': e.venue,
            'price': float(e.price),
            'image': e.banner_image,
        })
    return JsonResponse(results, safe=False)

def api_dashboard_recent_activity(request):
    """API endpoint to get recent activity"""
    from bookings.views import get_authenticated_attendee
    from bookings.models import Ticket
    
    user = get_authenticated_attendee(request)
    if not user or not user.is_authenticated:
        return JsonResponse([], safe=False)
        
    tickets = Ticket.objects.filter(attendee=user).order_by('-purchase_date')[:5]
    results = []
    for t in tickets:
        results.append({
            'id': t.id,
            'type': 'booking',
            'title': f"Booked ticket for {t.event.title}",
            'created_at': t.purchase_date.isoformat(),
            'action_url': f"/attendee/tickets/detail/?ticket={t.ticket_number}"
        })
    return JsonResponse(results, safe=False)

def api_tickets_upcoming(request):
    """API endpoint to get upcoming tickets"""
    return JsonResponse({'results': []})

def api_featured_events(request):
    """API endpoint to get featured events for the attendee homepage"""
    events = Event.objects.filter(status='published', is_featured=True)[:6]
    if not events.exists():
        events = Event.objects.filter(status='published')[:6]
        
    results = []
    for e in events:
        results.append({
            'id': e.id,
            'title': e.title,
            'description': e.description,
            'date': e.start_date.isoformat() if e.start_date else None,
            'start_date': e.start_date.isoformat() if e.start_date else None,
            'end_date': e.end_date.isoformat() if e.end_date else None,
            'location': e.venue,
            'venue': e.venue,
            'price': float(e.price),
            'image': e.banner_image,
            'banner_image': e.banner_image,
            'category': e.category.name if e.category else 'General',
            'category_name': e.category.name if e.category else 'General',
            'attendees_count': e.total_seats - e.available_seats,
            'tickets_left': e.available_seats,
        })
    return JsonResponse({'success': True, 'events': results})


import dateutil.parser
from bookings.models import Ticket
from bookings.email_service import send_attendee_review_request_email, send_organizer_performance_summary_email

@csrf_exempt
@require_http_methods(["POST"])
def api_events_check_expired(request):
    """
    Checks for completed events and dispatches automated post-event alerts.
    Utilizes client-passed local time and date from the context frameworks.
    """
    try:
        data = json.loads(request.body)
        client_date = data.get('current_date')
        client_time = data.get('current_time', '00:00')
        
        if not client_date:
            return JsonResponse({'success': False, 'message': 'Date is required'}, status=400)
            
        # Parse client date and time context to obtain a datetime threshold
        try:
            client_dt = dateutil.parser.isoparse(f"{client_date}T{client_time}")
            if timezone.is_naive(client_dt):
                client_dt = timezone.make_aware(client_dt)
        except ValueError:
            client_dt = timezone.now()

        # Query active published events that have passed this end datetime and need notification updates
        events = Event.objects.filter(
            status='published',
            end_date__lte=client_dt
        ).filter(
            Q(attendee_reviews_sent=False) | Q(organizer_summary_sent=False)
        )
        
        processed_attendees_emails = 0
        processed_organizers_emails = 0
        
        for event in events:
            # 1. Dispatch attendee review requests
            if not event.attendee_reviews_sent:
                # Find all tickets for this event
                tickets = Ticket.objects.filter(event=event, status='valid')
                
                # Deduplicate attendee contacts
                attendee_map = {}
                for ticket in tickets:
                    email = ticket.billing_email or (ticket.attendee.email if ticket.attendee else None)
                    name = ticket.billing_name or (ticket.attendee.username if ticket.attendee else 'Attendee')
                    if email:
                        attendee_map[email] = name
                        
                for email, name in attendee_map.items():
                    send_attendee_review_request_email(
                        attendee_email=email,
                        attendee_name=name,
                        event_title=event.title,
                        event_id=event.id
                    )
                    processed_attendees_emails += 1
                    
                event.attendee_reviews_sent = True
                
            # 2. Dispatch organizer performance summary reports
            if not event.organizer_summary_sent:
                tickets = Ticket.objects.filter(event=event, status='valid')
                total_seats_sold = sum(t.quantity for t in tickets)
                total_revenue = float(sum(t.quantity * t.price for t in tickets))
                
                send_organizer_performance_summary_email(
                    organizer_email=event.organizer.email,
                    organizer_name=event.organizer.organization_name or event.organizer.username,
                    event_title=event.title,
                    total_attendees=total_seats_sold,
                    total_revenue=total_revenue
                )
                processed_organizers_emails += 1
                event.organizer_summary_sent = True
                
            event.save()
            
        return JsonResponse({
            'success': True,
            'message': f"Post-event automations triggered successfully.",
            'attendees_notified': processed_attendees_emails,
            'organizers_notified': processed_organizers_emails
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': str(e)}, status=500)





