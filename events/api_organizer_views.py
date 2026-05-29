import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .models import Event, Category
from django.utils import timezone
from datetime import timedelta
import dateutil.parser

from accounts.auth import authenticate_bearer

def organizer_required(view_func):
    """Decorator to ensure user is logged in and is an organizer."""
    def wrapper(request, *args, **kwargs):
        from accounts.auth import authenticate_bearer
        user = request.user
        if not user.is_authenticated:
            bearer_user, error = authenticate_bearer(request)
            if bearer_user:
                request.user = bearer_user
                user = bearer_user
            else:
                return JsonResponse({'success': False, 'message': 'Please login to continue'}, status=401)
        if getattr(user, 'role', None) != 'organizer' and not user.is_superuser:
            return JsonResponse({'success': False, 'message': 'Organizer access required'}, status=403)
        return view_func(request, *args, **kwargs)
    return wrapper


@csrf_exempt
@organizer_required
@require_http_methods(["GET"])
def api_organizer_events_list(request):
    """List events for the logged-in organizer."""
    events = Event.objects.filter(organizer=request.user).order_by('-created_at')
    
    from bookings.models import Ticket
    results = []
    for e in events:
        tickets = Ticket.objects.filter(event=e, status='valid')
        sold = sum(t.quantity for t in tickets)
        revenue = float(sum(t.quantity * t.price for t in tickets))
        
        # Map DB status to frontend expected status if necessary
        frontend_status = e.status
        if e.status == 'published':
            frontend_status = 'active'
            
        results.append({
            'id': e.id,
            'name': e.title,
            'date': e.start_date.isoformat() if e.start_date else None,
            'location': e.venue,
            'capacity': e.total_seats,
            'price': float(e.price),
            'sold': sold,
            'revenue': revenue,
            'category': e.category.name if e.category else 'General',
            'status': frontend_status
        })
        
    return JsonResponse(results, safe=False)

@csrf_exempt
@organizer_required
@require_http_methods(["POST"])
def api_organizer_events_create(request):
    """Create a new event."""
    try:
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        description = data.get('description', '').strip() or "A new event created from the organizer dashboard."
        date_str = data.get('date', '')
        start_time_str = data.get('startTime', '00:00')
        end_time_str = data.get('endTime', '00:00')
        venue = data.get('venue', '').strip()
        address = data.get('address', '').strip()
        capacity = int(data.get('capacity', 0))
        price = float(data.get('price', 0))
        image = data.get('image', '').strip()
        category_name = data.get('category', 'Technology')
        status = data.get('status', 'draft')

        # Map frontend status to DB status
        db_status = 'draft'
        if status == 'active':
            db_status = 'published'
            
        # Parse date and times
        try:
            start_date = dateutil.parser.isoparse(f"{date_str}T{start_time_str}")
            if timezone.is_naive(start_date):
                start_date = timezone.make_aware(start_date)
                
            end_date = dateutil.parser.isoparse(f"{date_str}T{end_time_str}")
            if timezone.is_naive(end_date):
                end_date = timezone.make_aware(end_date)
                
            if end_date <= start_date:
                end_date = start_date + timedelta(hours=3)
        except ValueError:
            start_date = timezone.now() + timedelta(days=7)
            end_date = start_date + timedelta(hours=3)
            
        # Get or create category
        slug_base = category_name.lower().replace(' ', '-')
        category, created = Category.objects.get_or_create(
            name=category_name,
            defaults={'slug': slug_base}
        )

        event = Event.objects.create(
            title=name,
            description=description,
            category=category,
            organizer=request.user,
            start_date=start_date,
            end_date=end_date,
            venue=venue,
            address=address,
            price=price,
            total_seats=capacity,
            available_seats=capacity,
            banner_image=image,
            status=db_status
        )

        return JsonResponse({
            'id': event.id,
            'name': event.title,
            'date': event.start_date.isoformat(),
            'location': event.venue,
            'capacity': event.total_seats,
            'price': float(event.price),
            'sold': 0,
            'revenue': 0,
            'category': category.name,
            'status': status
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@csrf_exempt
@organizer_required
@require_http_methods(["PUT"])
def api_organizer_events_update(request, event_id):
    """Update an existing event."""
    try:
        event = Event.objects.get(id=event_id, organizer=request.user)
        data = json.loads(request.body)
        
        if 'name' in data:
            event.title = data['name'].strip()
        if 'location' in data:
            event.venue = data['location'].strip()
        if 'capacity' in data:
            new_cap = int(data['capacity'])
            diff = new_cap - event.total_seats
            event.total_seats = new_cap
            event.available_seats += diff
        if 'price' in data:
            event.price = float(data['price'])
        if 'status' in data:
            status = data['status']
            event.status = 'published' if status == 'active' else 'draft'
            
        event.save()
        return JsonResponse({'success': True, 'message': 'Event updated successfully'})
    except Event.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Event not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@csrf_exempt
@organizer_required
@require_http_methods(["DELETE"])
def api_organizer_events_delete(request, event_id):
    """Delete an event."""
    try:
        event = Event.objects.get(id=event_id, organizer=request.user)
        event.delete()
        return JsonResponse({'success': True, 'message': 'Event deleted successfully'})
    except Event.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Event not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
