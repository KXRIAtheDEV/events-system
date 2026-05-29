import logging
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

def send_ticket_confirmation(user_email, user_name, event_title, ticket_quantity, total_price):
    """
    Dispatches a confirmation email after a successful ticket purchase.
    """
    subject = f"Your Tickets for {event_title} are Confirmed!"
    
    # We construct a simple HTML email body
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ff6b00;">Ticket Confirmation</h2>
        <p>Hi {user_name},</p>
        <p>Thank you for your purchase! We are excited to confirm your tickets for <strong>{event_title}</strong>.</p>
        
        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Event:</strong> {event_title}</p>
            <p><strong>Tickets:</strong> {ticket_quantity}</p>
            <p><strong>Total Paid:</strong> KSh {total_price}</p>
        </div>
        
        <p>You can view and download your tickets from your attendee dashboard.</p>
        
        <p>If you have any questions, feel free to reply to this email or contact us at <a href="mailto:support@eventhub.com">support@eventhub.com</a>.</p>
        <p>See you at the event!<br>- The EventHub Team</p>
    </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Confirmation email successfully sent to {user_email} for event '{event_title}'.")
        return True
    except Exception as e:
        logger.error(f"Failed to send confirmation email to {user_email}. Error: {str(e)}")
        return False

def send_newsletter_confirmation(user_email):
    """
    Dispatches a confirmation email after a successful newsletter subscription.
    """
    subject = "Welcome to EventHub!"
    
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ff6b00;">You're Subscribed!</h2>
        <p>Hi there,</p>
        <p>Thank you for subscribing to the EventHub newsletter. You will now receive the latest updates, exclusive event announcements, and special offers straight to your inbox.</p>
        
        <p>If you have any questions, feel free to reply to this email or contact us at <a href="mailto:support@eventhub.com">support@eventhub.com</a>.</p>
        <p>Stay tuned!<br>- The EventHub Team</p>
    </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Newsletter confirmation email successfully sent to {user_email}.")
        return True
    except Exception as e:
        logger.error(f"Failed to send newsletter confirmation email to {user_email}. Error: {str(e)}")
        return False

