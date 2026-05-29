import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model
from events.models import Event
from .models import Ticket
from .email_service import send_ticket_confirmation

User = get_user_model()

@csrf_exempt
@require_http_methods(["POST"])
def ticket_checkout_api(request):
    """
    Process ticket checkout:
    1. Resolves/Creates the attendee User.
    2. Creates database Ticket records for each cart item.
    3. Decrements Event available seats.
    4. Dispatches confirmation emails.
    """
    try:
        data = json.loads(request.body)
        user_email = data.get('email')
        user_name = data.get('name', 'Attendee')
        user_phone = data.get('phone', '')
        items = data.get('items', [])
        event_title = data.get('event_title', 'Awesome Event')
        ticket_quantity = int(data.get('quantity', 1))
        total_price = float(data.get('total_price', 0.0))
        
        if not user_email:
            return JsonResponse({'success': False, 'message': 'Email address is required.'}, status=400)
            
        # 1. Resolve User
        user = request.user
        if not user.is_authenticated:
            user = User.objects.filter(email=user_email).first()
        if not user:
            # Clean/Generate unique username
            username_base = user_email.split('@')[0]
            username = username_base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{username_base}{counter}"
                counter += 1
                
            user = User.objects.create(
                username=username,
                email=user_email,
                first_name=user_name.split(' ')[0],
                last_name=' '.join(user_name.split(' ')[1:]) if len(user_name.split(' ')) > 1 else '',
                role='attendee',
                phone=user_phone
            )
            
        # 2. Process Items and create Ticket records
        created_tickets = []
        if items:
            for item in items:
                event_id = item.get('id')
                qty = int(item.get('quantity', 1))
                price = float(item.get('price', 0.0))
                
                try:
                    event = Event.objects.get(id=event_id)
                    # Create Ticket record
                    ticket = Ticket.objects.create(
                        attendee=user,
                        event=event,
                        quantity=qty,
                        price=price,
                        billing_name=user_name,
                        billing_email=user_email,
                        billing_phone=user_phone,
                        status='valid'
                    )
                    created_tickets.append(ticket)
                    
                    # Update seats
                    event.available_seats = max(0, event.available_seats - qty)
                    event.save()
                except Event.DoesNotExist:
                    pass
        else:
            # Fallback using event_title
            try:
                event = Event.objects.filter(title__icontains=event_title).first()
                if not event:
                    event = Event.objects.first()
                if event:
                    ticket = Ticket.objects.create(
                        attendee=user,
                        event=event,
                        quantity=ticket_quantity,
                        price=event.price,
                        billing_name=user_name,
                        billing_email=user_email,
                        billing_phone=user_phone,
                        status='valid'
                    )
                    created_tickets.append(ticket)
                    
                    event.available_seats = max(0, event.available_seats - ticket_quantity)
                    event.save()
            except Exception as e:
                print("Fallback checkout error:", e)
                
        # Send confirmation email
        email_sent = send_ticket_confirmation(
            user_email=user_email,
            user_name=user_name,
            event_title=event_title,
            ticket_quantity=ticket_quantity,
            total_price=total_price
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Checkout successful! Ticket registered.'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'message': str(e)}, status=500)
