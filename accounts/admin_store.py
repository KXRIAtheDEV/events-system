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
            "created_at": two_hours_ago
        },
        {
            "id": 2,
            "title": "Refund Request Pending",
            "message": f"Attendee {attendee_name} has requested a refund for booking TICK-9E28B.",
            "type": "info",
            "is_read": False,
            "created_at": yesterday
        },
        {
            "id": 3,
            "title": "New Organizer Registration",
            "message": "A new organizer 'Tech Innovations' is awaiting verification.",
            "type": "warning",
            "is_read": True,
            "created_at": yesterday
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

def get_notifications():
    store = load_store()
    return store.get("notifications", [])

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

def add_notification(title, message, n_type="info"):
    store = load_store()
    notifications = store.get("notifications", [])
    next_id = store.get("next_notification_id", len(notifications) + 1)
    
    new_notif = {
        "id": next_id,
        "title": title,
        "message": message,
        "type": n_type,
        "is_read": False,
        "created_at": timezone.now().isoformat()
    }
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
