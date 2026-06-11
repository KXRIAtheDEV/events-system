import json
import time

from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone

from accounts.auth import authenticate_bearer, parse_json_body
from bookings.services import compute_order_total, fulfill_payment_order, FulfillmentError
from events.api_organizer_views import organizer_required
from events.models import Event

from .models import PaymentOrder, OrganizerNotification, AttendeeNotification
from .screenshot_verifier import verify_screenshot

ALLOWED_IMAGE_TYPES = {'image/jpeg', 'image/png', 'image/webp'}
MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024


def get_authenticated_user(request):
    user = request.user
    if not user.is_authenticated:
        bearer_user, _ = authenticate_bearer(request)
        if bearer_user:
            user = bearer_user
    return user if user.is_authenticated else None


def _sse_event(step, message, **extra):
    payload = {'step': step, 'message': message, **extra}
    return f"data: {json.dumps(payload)}\n\n"


def _organizer_numbers(organizer):
    return [
        organizer.mpesa_paybill,
        organizer.mpesa_till,
        organizer.mpesa_pochi,
        organizer.mpesa_send_money,
    ]


def _serialize_order(order, include_payment=False):
    data = {
        'id': order.id,
        'event_id': order.event_id,
        'event_title': order.event.title,
        'ticket_type': order.ticket_type,
        'quantity': order.quantity,
        'unit_price': float(order.unit_price),
        'total_amount': float(order.total_amount),
        'status': order.status,
        'verification_message': order.verification_message,
        'submitted_mpesa_name': order.submitted_mpesa_name,
        'ticket_number': order.ticket.ticket_number if order.ticket_id else None,
        'created_at': order.created_at.isoformat(),
        'updated_at': order.updated_at.isoformat(),
    }
    if include_payment:
        organizer = order.organizer
        data['mpesa_display_name'] = organizer.mpesa_display_name
        data['payment_options'] = organizer.mpesa_payment_options()
    return data


@csrf_exempt
@require_http_methods(["POST"])
def create_payment_order(request):
    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': 'Please login to purchase tickets.'}, status=401)

    data = parse_json_body(request)
    if data is None:
        return JsonResponse({'success': False, 'message': 'Invalid JSON body.'}, status=400)

    event_id = data.get('event_id')
    ticket_type = data.get('ticket_type', 'Regular')
    quantity = data.get('quantity', 1)

    try:
        quantity = int(quantity)
        if quantity < 1:
            raise ValueError
    except (TypeError, ValueError):
        return JsonResponse({'success': False, 'message': 'Quantity must be at least 1.'}, status=400)

    try:
        event = Event.objects.select_related('organizer').get(pk=event_id)
    except Event.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Event not found.'}, status=404)

    if event.status != 'published':
        return JsonResponse({'success': False, 'message': 'This event is not available for booking.'}, status=400)

    if event.end_date < timezone.now():
        return JsonResponse({'success': False, 'message': 'This event has already ended.'}, status=400)

    if event.available_seats < quantity:
        return JsonResponse({'success': False, 'message': 'Not enough tickets available.'}, status=400)

    organizer = event.organizer
    if not organizer.has_mpesa_payment_config():
        return JsonResponse({
            'success': False,
            'message': 'Organizer has not configured M-Pesa payment details yet.',
        }, status=400)

    try:
        unit_price, qty, total_amount = compute_order_total(event, ticket_type, quantity)
    except FulfillmentError as exc:
        return JsonResponse({'success': False, 'message': exc.message}, status=400)

    order = PaymentOrder.objects.create(
        attendee=user,
        event=event,
        organizer=organizer,
        ticket_type=ticket_type,
        quantity=qty,
        unit_price=unit_price,
        total_amount=total_amount,
        status='pending_payment',
    )

    return JsonResponse({
        'success': True,
        'order': _serialize_order(order, include_payment=True),
    })


@csrf_exempt
@require_http_methods(["GET"])
def payment_order_status(request, order_id):
    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': 'Please login.'}, status=401)

    try:
        order = PaymentOrder.objects.select_related('event', 'organizer', 'ticket').get(pk=order_id, attendee=user)
    except PaymentOrder.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Order not found.'}, status=404)

    return JsonResponse({'success': True, 'order': _serialize_order(order, include_payment=True)})


@csrf_exempt
@require_http_methods(["POST"])
def verify_screenshot(request, order_id):
    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': 'Please login.'}, status=401)

    try:
        order = PaymentOrder.objects.select_related('event', 'organizer', 'ticket').get(pk=order_id, attendee=user)
    except PaymentOrder.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Order not found.'}, status=404)

    if order.status not in ('pending_payment', 'failed', 'rejected'):
        return JsonResponse({'success': False, 'message': 'This order cannot accept a new screenshot.'}, status=400)

    screenshot = request.FILES.get('screenshot')
    if not screenshot:
        return JsonResponse({'success': False, 'message': 'Screenshot file is required.'}, status=400)

    if screenshot.size > MAX_SCREENSHOT_SIZE:
        return JsonResponse({'success': False, 'message': 'Screenshot must be 5 MB or smaller.'}, status=400)

    content_type = getattr(screenshot, 'content_type', '') or ''
    if content_type and content_type not in ALLOWED_IMAGE_TYPES:
        return JsonResponse({'success': False, 'message': 'Only JPEG, PNG, or WebP images are allowed.'}, status=400)

    order.status = 'verifying'
    order.screenshot = screenshot
    order.verification_message = ''
    order.save(update_fields=['status', 'screenshot', 'verification_message', 'updated_at'])

    def event_stream():
        yield _sse_event('upload_received', 'Screenshot received')
        time.sleep(0.2)
        yield _sse_event('preprocessing', 'Preparing image for analysis')
        time.sleep(0.2)
        yield _sse_event('reading_text', 'Reading transaction details')

        try:
            result = verify_screenshot(
                order.screenshot,
                order.organizer.mpesa_display_name,
                order.total_amount,
                _organizer_numbers(order.organizer),
            )
        except Exception as exc:
            order.status = 'failed'
            order.verification_message = str(exc)
            order.save(update_fields=['status', 'verification_message', 'updated_at'])
            yield _sse_event(
                'failed',
                'EventHub could not read the screenshot properly, wanna try again?',
                can_retry=True,
                reason=str(exc),
            )
            return

        order.ocr_raw_text = result.get('ocr_text', '')
        order.save(update_fields=['ocr_raw_text', 'updated_at'])

        yield _sse_event('checking_amount', 'Verifying payment amount')
        time.sleep(0.2)
        yield _sse_event('checking_recipient', 'Verifying recipient name')

        if result['success']:
            try:
                ticket = fulfill_payment_order(order)
                order.refresh_from_db()
                yield _sse_event(
                    'success',
                    'Payment verified! Your ticket has been issued.',
                    ticket_number=ticket.ticket_number,
                    ticket_type=order.ticket_type,
                    order_id=order.id,
                )
            except FulfillmentError as exc:
                order.status = 'failed'
                order.verification_message = exc.message
                order.save(update_fields=['status', 'verification_message', 'updated_at'])
                yield _sse_event('failed', exc.message, can_retry=True)
            except Exception as exc:
                order.status = 'failed'
                order.verification_message = str(exc)
                order.save(update_fields=['status', 'verification_message', 'updated_at'])
                yield _sse_event(
                    'failed',
                    'EventHub could not read the screenshot properly, wanna try again?',
                    can_retry=True,
                )
        else:
            order.status = 'failed'
            order.verification_message = result.get('notes', 'Verification failed.')
            order.save(update_fields=['status', 'verification_message', 'updated_at'])
            yield _sse_event(
                'failed',
                'EventHub could not read the screenshot properly, wanna try again?',
                can_retry=True,
                reason=order.verification_message,
            )

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


@csrf_exempt
@require_http_methods(["POST"])
def submit_mpesa_name(request, order_id):
    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': 'Please login.'}, status=401)

    data = parse_json_body(request)
    if data is None:
        return JsonResponse({'success': False, 'message': 'Invalid JSON body.'}, status=400)

    mpesa_name = (data.get('mpesa_name') or '').strip()
    if len(mpesa_name) < 2:
        return JsonResponse({'success': False, 'message': 'Please enter your M-Pesa name.'}, status=400)

    try:
        order = PaymentOrder.objects.select_related('event', 'organizer', 'attendee').get(pk=order_id, attendee=user)
    except PaymentOrder.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Order not found.'}, status=404)

    if order.status not in ('failed', 'rejected', 'pending_payment'):
        return JsonResponse({'success': False, 'message': 'This order cannot be submitted for manual review.'}, status=400)

    order.submitted_mpesa_name = mpesa_name
    order.status = 'manual_review'
    order.verification_message = 'Awaiting organizer approval.'
    order.save(update_fields=['submitted_mpesa_name', 'status', 'verification_message', 'updated_at'])

    attendee_name = user.get_full_name() or user.username
    OrganizerNotification.objects.create(
        organizer=order.organizer,
        payment_order=order,
        title='Payment approval needed',
        message=(
            f'{attendee_name} submitted M-Pesa name "{mpesa_name}" for '
            f'{order.event.title} ({order.ticket_type}, KES {order.total_amount}).'
        ),
        notification_type='warning',
        requires_action=True,
        action_type='payment_approval',
    )

    return JsonResponse({
        'success': True,
        'message': 'Submitted for organizer approval.',
        'order': _serialize_order(order),
    })


@csrf_exempt
@organizer_required
@require_http_methods(["GET"])
def organizer_pending_orders(request):
    orders = PaymentOrder.objects.filter(
        organizer=request.user,
        status='manual_review',
    ).select_related('attendee', 'event').order_by('-updated_at')

    results = []
    for order in orders:
        attendee = order.attendee
        results.append({
            'id': order.id,
            'event_id': order.event_id,
            'event_title': order.event.title,
            'ticket_type': order.ticket_type,
            'quantity': order.quantity,
            'total_amount': float(order.total_amount),
            'submitted_mpesa_name': order.submitted_mpesa_name,
            'attendee_name': attendee.get_full_name() or attendee.username,
            'attendee_email': attendee.email,
            'status': order.status,
            'created_at': order.created_at.isoformat(),
            'updated_at': order.updated_at.isoformat(),
        })

    return JsonResponse({'success': True, 'orders': results})


@csrf_exempt
@organizer_required
@require_http_methods(["POST"])
def organizer_approve_order(request, order_id):
    try:
        order = PaymentOrder.objects.select_related('event', 'organizer', 'attendee').get(
            pk=order_id, organizer=request.user
        )
    except PaymentOrder.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Order not found.'}, status=404)

    if order.status != 'manual_review':
        return JsonResponse({'success': False, 'message': 'Order is not awaiting approval.'}, status=400)

    try:
        ticket = fulfill_payment_order(order)
    except FulfillmentError as exc:
        return JsonResponse({'success': False, 'message': exc.message}, status=400)

    OrganizerNotification.objects.filter(
        payment_order=order, organizer=request.user, requires_action=True
    ).update(is_read=True, requires_action=False)

    return JsonResponse({
        'success': True,
        'message': 'Payment approved and ticket issued.',
        'ticket_number': ticket.ticket_number,
        'order': _serialize_order(order),
    })


@csrf_exempt
@organizer_required
@require_http_methods(["POST"])
def organizer_reject_order(request, order_id):
    try:
        order = PaymentOrder.objects.select_related('event', 'organizer', 'attendee').get(
            pk=order_id, organizer=request.user
        )
    except PaymentOrder.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Order not found.'}, status=404)

    if order.status != 'manual_review':
        return JsonResponse({'success': False, 'message': 'Order is not awaiting approval.'}, status=400)

    order.status = 'rejected'
    order.verification_message = 'Payment rejected by organizer. Please submit your M-Pesa screenshot again.'
    order.save(update_fields=['status', 'verification_message', 'updated_at'])

    OrganizerNotification.objects.filter(
        payment_order=order, organizer=request.user, requires_action=True
    ).update(is_read=True, requires_action=False)

    AttendeeNotification.objects.create(
        attendee=order.attendee,
        payment_order=order,
        title='Payment not confirmed',
        message='Payment could not be confirmed. Please submit your M-Pesa screenshot again.',
        notification_type='warning',
    )

    return JsonResponse({
        'success': True,
        'message': 'Payment rejected.',
        'order': _serialize_order(order),
    })


@csrf_exempt
@require_http_methods(["GET"])
def attendee_notifications_list(request):
    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': 'Please login.'}, status=401)

    notifications = AttendeeNotification.objects.filter(attendee=user).order_by('-created_at')[:50]
    results = [{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'notification_type': n.notification_type,
        'is_read': n.is_read,
        'payment_order_id': n.payment_order_id,
        'created_at': n.created_at.isoformat(),
    } for n in notifications]

    return JsonResponse({'success': True, 'notifications': results})


@csrf_exempt
@require_http_methods(["POST"])
def attendee_notification_mark_read(request, notification_id):
    user = get_authenticated_user(request)
    if not user:
        return JsonResponse({'success': False, 'message': 'Please login.'}, status=401)

    updated = AttendeeNotification.objects.filter(pk=notification_id, attendee=user).update(is_read=True)
    if not updated:
        return JsonResponse({'success': False, 'message': 'Notification not found.'}, status=404)
    return JsonResponse({'success': True})
