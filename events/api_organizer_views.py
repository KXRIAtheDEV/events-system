import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .models import Event, Category
from django.utils import timezone
from django.core.paginator import Paginator, EmptyPage
from datetime import timedelta
import dateutil.parser

from accounts.auth import authenticate_bearer
from bookings.email_service import send_organizer_event_crud_email

from bookings.models import Ticket

def serialize_organizer_event(event):
    tickets = Ticket.objects.filter(event=event, status='valid')
    sold = sum(t.quantity for t in tickets)
    revenue = float(sum(t.quantity * t.price for t in tickets))
    return {
        'id': event.id,
        'name': event.title,
        'title': event.title,
        'description': event.description,
        'category': event.category.name if event.category else 'General',
        'date': event.start_date.isoformat() if event.start_date else None,
        'start_date': event.start_date.isoformat() if event.start_date else None,
        'end_date': event.end_date.isoformat() if event.end_date else None,
        'location': event.venue,
        'venue': event.venue,
        'address': event.address,
        'capacity': event.total_seats,
        'price': float(event.price),
        'sold': sold,
        'tickets_sold': sold,
        'revenue': revenue,
        'status': event.status,
        'image_url': event.banner_image or ''
    }

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
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 12))
    paginator = Paginator(events, limit)
    if paginator.count == 0:
        return JsonResponse({
            'results': [],
            'page': 1,
            'page_size': limit,
            'count': 0,
            'total_pages': 0,
            'previous': False,
            'next': False
        })

    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    results = [serialize_organizer_event(e) for e in page_obj.object_list]
    return JsonResponse({
        'results': results,
        'page': page_obj.number,
        'page_size': page_obj.paginator.per_page,
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'previous': page_obj.has_previous(),
        'next': page_obj.has_next()
    })

@csrf_exempt
@organizer_required
@require_http_methods(["POST"])
def api_organizer_events_create(request):
    """Create a new event."""
    try:
        data = json.loads(request.body)
        name = data.get('name', '').strip() or data.get('title', '').strip()
        description = data.get('description', '').strip() or "A new event created from the organizer dashboard."
        date_str = data.get('date', '')
        if not date_str and data.get('start_date'):
            date_str = data.get('start_date').split('T')[0]
        start_time_str = data.get('startTime', '') or (data.get('start_date', '').split('T')[1] if 'T' in data.get('start_date', '') else '') or '00:00'
        end_time_str = data.get('endTime', '') or (data.get('end_date', '').split('T')[1] if 'T' in data.get('end_date', '') else '') or '00:00'
        venue = data.get('venue', '').strip() or data.get('location', '').strip()
        address = data.get('address', '').strip()
        capacity = int(data.get('capacity', 0))
        price = float(data.get('price', 0))
        image = data.get('image', '').strip() or data.get('banner_image', '').strip()
        category_name = data.get('category', 'Technology')
        status = data.get('status', 'draft')

        # Map frontend status to DB status
        db_status = 'draft'
        if status in ('published', 'active'):
            db_status = 'published'
        elif status == 'cancelled':
            db_status = 'cancelled'
            
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

        try:
            details_str = f"{event.start_date.strftime('%B %d, %Y')} at {event.venue}"
            send_organizer_event_crud_email(
                organizer_email=request.user.email,
                organizer_name=request.user.username,
                event_title=event.title,
                action='created',
                details=details_str
            )
        except Exception as email_err:
            print("Failed to dispatch organizer CRUD email:", email_err)

        return JsonResponse(serialize_organizer_event(event))
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@csrf_exempt
@organizer_required
@require_http_methods(["GET"])
def api_organizer_events_detail(request, event_id):
    """Get details for a specific organizer event."""
    try:
        event = Event.objects.get(id=event_id, organizer=request.user)
        return JsonResponse(serialize_organizer_event(event))
    except Event.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Event not found'}, status=404)

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
        if 'title' in data:
            event.title = data['title'].strip()
        if 'description' in data:
            event.description = data['description'].strip()
        if 'category' in data:
            category_name = data['category'].strip() or 'General'
            slug_base = category_name.lower().replace(' ', '-')
            category, created = Category.objects.get_or_create(
                name=category_name,
                defaults={'slug': slug_base}
            )
            event.category = category
        if 'location' in data:
            event.venue = data['location'].strip()
        if 'venue' in data:
            event.venue = data['venue'].strip()
        if 'address' in data:
            event.address = data['address'].strip()
        if 'capacity' in data:
            new_cap = int(data['capacity'])
            diff = new_cap - event.total_seats
            event.total_seats = new_cap
            event.available_seats += diff
        if 'price' in data:
            event.price = float(data['price'])
        if 'date' in data or 'start_date' in data:
            date_str = data.get('date', '') or data.get('start_date', '').split('T')[0]
            start_time_str = data.get('startTime', '') or (data.get('start_date', '').split('T')[1] if 'T' in data.get('start_date', '') else '')
            if date_str and start_time_str:
                try:
                    event.start_date = dateutil.parser.isoparse(f"{date_str}T{start_time_str}")
                    if timezone.is_naive(event.start_date):
                        event.start_date = timezone.make_aware(event.start_date)
                except ValueError:
                    pass
        if 'endTime' in data or 'end_date' in data:
            end_time_str = data.get('endTime', '') or (data.get('end_date', '').split('T')[1] if 'T' in data.get('end_date', '') else '')
            try:
                end_date_input = data.get('end_date', '') or data.get('date', '')
                if end_date_input and end_time_str:
                    event.end_date = dateutil.parser.isoparse(f"{end_date_input}T{end_time_str}")
                    if timezone.is_naive(event.end_date):
                        event.end_date = timezone.make_aware(event.end_date)
            except ValueError:
                pass
        if 'status' in data:
            status = data['status']
            if status in ('published', 'active'):
                event.status = 'published'
            elif status == 'cancelled':
                event.status = 'cancelled'
            else:
                event.status = 'draft'
            
        event.save()
        
        try:
            details_str = f"{event.start_date.strftime('%B %d, %Y')} at {event.venue}"
            send_organizer_event_crud_email(
                organizer_email=request.user.email,
                organizer_name=request.user.username,
                event_title=event.title,
                action='edited',
                details=details_str
            )
        except Exception as email_err:
            print("Failed to dispatch organizer CRUD email:", email_err)

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
        title = event.title
        event.delete()
        
        try:
            send_organizer_event_crud_email(
                organizer_email=request.user.email,
                organizer_name=request.user.username,
                event_title=title,
                action='deleted',
                details=None
            )
        except Exception as email_err:
            print("Failed to dispatch organizer CRUD email:", email_err)

        return JsonResponse({'success': True, 'message': 'Event deleted successfully'})
    except Event.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Event not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


# ============ ORGANIZER SETTINGS VIEWS ============

@csrf_exempt
@organizer_required
@require_http_methods(["GET"])
def api_organizer_settings_general(request):
    """Retrieve General settings for the logged-in organizer."""
    user = request.user
    return JsonResponse({
        'organization_name': user.organization_name,
        'email': user.email,
        'phone': user.phone,
        'website': user.website,
        'bio': user.bio
    })

@csrf_exempt
@organizer_required
@require_http_methods(["PUT"])
def api_organizer_settings_general_update(request):
    """Update General settings for the logged-in organizer."""
    try:
        user = request.user
        data = json.loads(request.body)
        
        if 'organization_name' in data:
            user.organization_name = data['organization_name'].strip()
        if 'email' in data:
            user.email = data['email'].strip()
        if 'phone' in data:
            user.phone = data['phone'].strip()
        if 'website' in data:
            user.website = data['website'].strip()
        if 'bio' in data:
            user.bio = data['bio'].strip()
            
        user.save()
        return JsonResponse({'success': True, 'message': 'General settings saved successfully!'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@csrf_exempt
@organizer_required
@require_http_methods(["GET"])
def api_organizer_payouts_settings(request):
    """Retrieve payouts settlement credentials for the organizer."""
    user = request.user
    return JsonResponse({
        'account_number': user.account_number,
        'bank_name': user.bank_name,
        'account_holder': user.account_holder,
        'routing_number': user.routing_number
    })

@csrf_exempt
@organizer_required
@require_http_methods(["PUT"])
def api_organizer_payouts_settings_update(request):
    """Update payouts settlement credentials for the organizer."""
    try:
        user = request.user
        data = json.loads(request.body)
        
        if 'account_number' in data:
            user.account_number = data['account_number'].strip()
        if 'bank_name' in data:
            user.bank_name = data['bank_name'].strip()
        if 'account_holder' in data:
            user.account_holder = data['account_holder'].strip()
        if 'routing_number' in data:
            user.routing_number = data['routing_number'].strip()
            
        user.save()
        return JsonResponse({'success': True, 'message': 'Payment Settlement settings updated!'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@csrf_exempt
@organizer_required
@require_http_methods(["GET"])
def api_organizer_settings_team(request):
    """List team members for the organizer."""
    return JsonResponse(request.user.team_members or [], safe=False)

@csrf_exempt
@organizer_required
@require_http_methods(["POST"])
def api_organizer_settings_team_add(request):
    """Invite/add a new team member."""
    try:
        user = request.user
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        role = data.get('role', 'viewer').strip()
        
        if not email:
            return JsonResponse({'success': False, 'message': 'Email is required'}, status=400)
            
        team = user.team_members or []
        
        if any(m.get('email') == email for m in team):
            return JsonResponse({'success': False, 'message': 'Member already in team'}, status=400)
            
        import uuid
        member = {
            'id': uuid.uuid4().hex[:8],
            'email': email,
            'role': role
        }
        team.append(member)
        user.team_members = team
        user.save()
        
        return JsonResponse({'success': True, 'message': 'Team member invited!'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@csrf_exempt
@organizer_required
@require_http_methods(["DELETE"])
def api_organizer_settings_team_remove(request, member_id):
    """Remove a team member."""
    try:
        user = request.user
        team = user.team_members or []
        filtered_team = [m for m in team if m.get('id') != member_id]
        
        if len(team) == len(filtered_team):
            return JsonResponse({'success': False, 'message': 'Member not found'}, status=404)
            
        user.team_members = filtered_team
        user.save()
        return JsonResponse({'success': True, 'message': 'Team member removed'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@csrf_exempt
@organizer_required
@require_http_methods(["GET"])
def api_organizer_settings_apikeys(request):
    """List developer API keys."""
    return JsonResponse(request.user.api_keys or [], safe=False)

@csrf_exempt
@organizer_required
@require_http_methods(["POST"])
def api_organizer_settings_apikeys_create(request):
    """Generate a new developer API key."""
    try:
        user = request.user
        data = json.loads(request.body)
        name = data.get('name', 'Developer Key').strip()
        
        import uuid
        key_id = uuid.uuid4().hex[:8]
        secret_key = f"eh_live_{uuid.uuid4().hex}"
        
        keys = user.api_keys or []
        new_key = {
            'id': key_id,
            'name': name,
            'key': secret_key,
            'created_at': timezone.now().isoformat()
        }
        keys.append(new_key)
        user.api_keys = keys
        user.save()
        
        return JsonResponse(new_key)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@csrf_exempt
@organizer_required
@require_http_methods(["DELETE"])
def api_organizer_settings_apikeys_revoke(request, key_id):
    """Revoke a developer API key."""
    try:
        user = request.user
        keys = user.api_keys or []
        filtered_keys = [k for k in keys if k.get('id') != key_id]
        
        if len(keys) == len(filtered_keys):
            return JsonResponse({'success': False, 'message': 'API Key not found'}, status=404)
            
        user.api_keys = filtered_keys
        user.save()
        return JsonResponse({'success': True, 'message': 'API Key revoked'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@csrf_exempt
@organizer_required
@require_http_methods(["GET"])
def api_organizer_reviews_stats(request):
    """
    Organizer reviews stats endpoint.
    Reviews app currently has no persisted model, so return safe defaults.
    """
    return JsonResponse({
        'avg_rating': 0,
        'total_reviews': 0,
        'response_rate': 0
    })

