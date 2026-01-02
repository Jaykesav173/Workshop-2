
import sys
import os

# Add the backend directory to sys.path to allow imports from app
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.utils.email_utils import send_email
from app.config import settings

def test_email_sending():
    print("🚀 Starting Email Verification...")
    
    # Check if SMTP settings are configured
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        print("❌ SMTP configuration is missing. Please check your .env file.")
        return

    recipient = "test@example.com" # Replace with a real email if possible, or just check the send_email output
    # Since we can't easily ask the user for an email in a script without interaction, 
    # and we want to verify the function runs, we'll rely on the user to check the output 
    # or we can try to send to the SMTP user if that's a valid email.
    recipient = settings.SMTP_USER 
    
    subject = "Visor Test Email - Logo Verification"
    content = """
    <p>This is a test email to verify the iPetro logo.</p>
    <p>You should see the logo above this text.</p>
    """
    
    print(f"📧 Attempting to send email to {recipient}...")
    success = send_email(recipient, subject, content)
    
    if success:
        print("✅ Email sent successfully!")
        print("👉 Please check your inbox and verify that the iPetro logo is visible at the top of the email.")
    else:
        print("❌ Failed to send email.")

if __name__ == "__main__":
    test_email_sending()
