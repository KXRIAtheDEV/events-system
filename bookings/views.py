import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .email_service import send_ticket_confirmation

@csrf_exempt
@require_http_methods(["POST"])
def ticket_checkout_api(request):
    """
    Mock endpoint for processing a ticket checkout and sending a confirmation email.
    In a real scenario, this would validate the user, process payment, and create Booking/Ticket models.
    """
    try:
        data = json.loads(request.body)
        user_email = data.get('email')
        user_name = data.get('name', 'Attendee')
        event_title = data.get('event_title', 'Awesome Event')
        ticket_quantity = int(data.get('quantity', 1))
        total_price = float(data.get('total_price', 0.0))
        
        if not user_email:
            return JsonResponse({'success': False, 'message': 'Email address is required.'}, status=400)
            
        # TODO: Here you would normally:
        # 1. Process Stripe/M-Pesa payment
        # 2. Create Booking record in database
        # 3. Generate Tickets
        
        # Dispatch the confirmation email!
        email_sent = send_ticket_confirmation(
            user_email=user_email,
            user_name=user_name,
            event_title=event_title,
            ticket_quantity=ticket_quantity,
            total_price=total_price
        )
        
        if email_sent:
            return JsonResponse({'success': True, 'message': 'Checkout successful! Confirmation email sent.'})
        else:
            return JsonResponse({'success': True, 'message': 'Checkout successful, but failed to send email.'})
            
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)
