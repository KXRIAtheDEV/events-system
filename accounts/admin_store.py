import os
import json
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

STORE_FILE_PATH = os.path.join(settings.BASE_DIR, '.admin_data.json')

def load_store():
    if not os.path.exists(STORE_FILE_PATH):
        # Seed with initial mock data
        seed_data = seed_initial_data()
        save_store(seed_data)
        return seed_data
    try:
        with open(STORE_FILE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading admin store: {e}")
        return seed_initial_data()

def save_store(data):
    try:
        with open(STORE_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving admin store: {e}")

def seed_initial_data():
    User = get_user_model()
    # Find any actual attendees and organizers to make data link dynamically
    attendee = User.objects.filter(role='attendee').first()
    organizer = User.objects.filter(role='organizer').first()
    
    attendee_name = attendee.get_full_name() if attendee else "David Kamau"
    attendee_username = attendee.username if attendee else "davidk"
    attendee_email = attendee.email if attendee else "david.kamau@gmail.com"
    attendee_phone = getattr(attendee, 'phone', '0712345678') or "0712345678"
    
    organizer_name = organizer.get_full_name() or organizer.organization_name if organizer else "Yvonne Wambui"
    organizer_email = organizer.email if organizer else "yvonne@brightevents.co.ke"
    organizer_phone = getattr(organizer, 'phone', '0722345678') or "0722345678"

    now_iso = timezone.now().isoformat()
    two_hours_ago = (timezone.now() - timezone.timedelta(hours=2)).isoformat()
    yesterday = (timezone.now() - timezone.timedelta(days=1)).isoformat()

    notifications = [
        {
            "id": 1,
            "title": "New Event Submitted",
            "message": f"Organizer {organizer_name} has submitted a new event 'Nairobi Food Festival' for approval.",
            "type": "warning",
            "is_read": False,
            "created_at": two_hours_ago,
            "redirect_url": "/admin-portal/events/pending/",
            "entity_type": "event",
            "action_type": "event_pending_approval",
            "requires_action": True,
        },
        {
            "id": 2,
            "title": "Refund Request Pending",
            "message": f"Attendee {attendee_name} has requested a refund for booking TICK-9E28B.",
            "type": "info",
            "is_read": False,
            "created_at": yesterday,
            "redirect_url": "/admin-portal/bookings/refunds/",
            "entity_type": "refund",
            "action_type": "refund_pending",
            "requires_action": True,
        },
        {
            "id": 3,
            "title": "New Organizer Registration",
            "message": "A new organizer 'Tech Innovations' is awaiting verification.",
            "type": "warning",
            "is_read": True,
            "created_at": yesterday,
            "redirect_url": "/admin-portal/users/organizers/",
            "requires_action": False,
        }
    ]

    support_tickets = [
        {
            "id": 1,
            "customer_name": attendee_name,
            "customer_email": attendee_email,
            "customer_phone": attendee_phone,
            "subject": "Unable to download ticket PDF",
            "message": "Hello, I recently booked a seat for the Music Festival but when I click download ticket, the PDF returns an error. Please assist.",
            "status": "open",
            "created_at": two_hours_ago,
            "replies": []
        },
        {
            "id": 2,
            "customer_name": organizer_name,
            "customer_email": organizer_email,
            "customer_phone": organizer_phone,
            "subject": "Payout processing timeline question",
            "message": "Hi Admin, my event 'Summer Music Fest' ended yesterday. When will the payout be processed to my bank account?",
            "status": "pending",
            "created_at": yesterday,
            "replies": [
                {
                    "sender": "admin",
                    "message": "Hello, payouts are processed within 2-3 business days after the event completes. We are reviewing your event sales now.",
                    "created_at": (timezone.now() - timezone.timedelta(hours=12)).isoformat()
                }
            ]
        },
        {
            "id": 3,
            "customer_name": "Alice Njeri",
            "customer_email": "alice.njeri@outlook.com",
            "customer_phone": "0733456789",
            "subject": "Change attendee details on booking",
            "message": "Hello, I bought two tickets but put the same name on both. Can I change one of them to my friend's name?",
            "status": "resolved",
            "created_at": (timezone.now() - timezone.timedelta(days=2)).isoformat(),
            "replies": [
                {
                    "sender": "admin",
                    "message": "Hello Alice, yes you can change details from your profile dashboard under tickets or let us know the name and we will update it for you.",
                    "created_at": (timezone.now() - timezone.timedelta(days=1)).isoformat()
                },
                {
                    "sender": "user",
                    "message": "Thank you, I was able to edit it from the profile page. Resolved!",
                    "created_at": (timezone.now() - timezone.timedelta(hours=18)).isoformat()
                }
            ]
        }
    ]

    return {
        "notifications": notifications,
        "support_tickets": support_tickets,
        "next_notification_id": 4,
        "next_support_ticket_id": 4
    }

ACTIONABLE_TYPES = ('event_pending_approval', 'refund_pending')


def _is_notification_resolved(notification):
    """Return True when an actionable notification no longer needs admin attention."""
    action_type = notification.get('action_type')
    entity_id = notification.get('entity_id')
    if not action_type or entity_id is None:
        return False

    try:
        if action_type == 'event_pending_approval':
            from events.models import Event
            event = Event.objects.filter(id=entity_id).first()
            if not event:
                return True
            return event.status != 'pending'
        if action_type == 'refund_pending':
            from bookings.models import Ticket
            ticket = Ticket.objects.filter(id=entity_id).first()
            if not ticket:
                return True
            return ticket.status != 'cancelled'
    except Exception as e:
        print(f"Error checking notification resolution: {e}")
    return False


def _prune_resolved_notifications(notifications):
    """Remove actionable notifications whose underlying task is already complete."""
    pruned = []
    for n in notifications:
        if n.get('requires_action') and _is_notification_resolved(n):
            continue
        pruned.append(n)
    return pruned


def get_notifications():
    store = load_store()
    notifications = store.get("notifications", [])
    pruned = _prune_resolved_notifications(notifications)
    if len(pruned) != len(notifications):
        store["notifications"] = pruned
        save_store(store)
    return pruned


def delete_notification(notification_id):
    store = load_store()
    notifications = store.get("notifications", [])
    filtered = [n for n in notifications if n["id"] != int(notification_id)]
    if len(filtered) == len(notifications):
        return False
    store["notifications"] = filtered
    save_store(store)
    return True


def dismiss_notification(notification_id, on_view=False):
    """Remove a notification. On view, only dismiss informational or already-resolved items."""
    store = load_store()
    notifications = store.get("notifications", [])
    target = next((n for n in notifications if n["id"] == int(notification_id)), None)
    if not target:
        return False

    if on_view:
        if target.get('requires_action') and not _is_notification_resolved(target):
            return False

    store["notifications"] = [n for n in notifications if n["id"] != int(notification_id)]
    save_store(store)
    return True


def expire_notifications_for_entity(entity_type, entity_id, action_types=None):
    """Remove notifications linked to an entity after the admin completes the related action."""
    store = load_store()
    notifications = store.get("notifications", [])
    entity_id = str(entity_id)
    filtered = []
    for n in notifications:
        if (
            n.get("entity_type") == entity_type
            and str(n.get("entity_id")) == entity_id
            and (not action_types or n.get("action_type") in action_types)
        ):
            continue
        filtered.append(n)
    if len(filtered) != len(notifications):
        store["notifications"] = filtered
        save_store(store)
    return True


def mark_notification_read(notification_id):
    store = load_store()
    notifications = store.get("notifications", [])
    for n in notifications:
        if n["id"] == int(notification_id):
            n["is_read"] = True
            break
    store["notifications"] = notifications
    save_store(store)
    return True

def mark_all_notifications_read():
    store = load_store()
    notifications = store.get("notifications", [])
    for n in notifications:
        n["is_read"] = True
    store["notifications"] = notifications
    save_store(store)
    return True

def add_notification(
    title,
    message,
    n_type="info",
    redirect_url=None,
    entity_type=None,
    entity_id=None,
    action_type=None,
    requires_action=None,
):
    store = load_store()
    notifications = store.get("notifications", [])
    next_id = store.get("next_notification_id", len(notifications) + 1)

    if requires_action is None:
        requires_action = action_type in ACTIONABLE_TYPES

    new_notif = {
        "id": next_id,
        "title": title,
        "message": message,
        "type": n_type,
        "is_read": False,
        "created_at": timezone.now().isoformat(),
        "requires_action": requires_action,
    }
    if redirect_url:
        new_notif["redirect_url"] = redirect_url
    if entity_type:
        new_notif["entity_type"] = entity_type
    if entity_id is not None:
        new_notif["entity_id"] = entity_id
    if action_type:
        new_notif["action_type"] = action_type

    notifications.insert(0, new_notif)
    store["notifications"] = notifications
    store["next_notification_id"] = next_id + 1
    save_store(store)
    return new_notif

def get_support_tickets():
    store = load_store()
    return store.get("support_tickets", [])

def get_support_ticket_detail(ticket_id):
    tickets = get_support_tickets()
    for t in tickets:
        if t["id"] == int(ticket_id):
            return t
    return None

def add_support_ticket_reply(ticket_id, sender, message):
    store = load_store()
    tickets = store.get("support_tickets", [])
    for t in tickets:
        if t["id"] == int(ticket_id):
            t["replies"].append({
                "sender": sender,
                "message": message,
                "created_at": timezone.now().isoformat()
            })
            if sender == 'admin':
                t["status"] = 'pending'
            break
    store["support_tickets"] = tickets
    save_store(store)
    return True

def update_support_ticket_status(ticket_id, status):
    store = load_store()
    tickets = store.get("support_tickets", [])
    for t in tickets:
        if t["id"] == int(ticket_id):
            t["status"] = status
            break
    store["support_tickets"] = tickets
    save_store(store)
    return True
