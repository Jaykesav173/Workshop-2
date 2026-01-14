"""
Email Notification Utilities
Handles email sending for notifications
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_email(to: str, subject: str, body: str) -> bool:
    """
    Send email notification
    Returns True if successful, False otherwise
    """
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        print("⚠️ Email configuration not set. Skipping email send.")
        return False
    
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_USER
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        

        
        # Embed logo if it exists
        try:
            import os
            from email.utils import make_msgid
            from email.mime.image import MIMEImage

            assets_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
            logo_path = os.path.join(assets_dir, "iPetro_logo.png")
            
            if os.path.exists(logo_path):
                with open(logo_path, 'rb') as f:
                    img_data = f.read()
                
                image = MIMEImage(img_data)
                image.add_header('Content-ID', '<iPetro_logo>')
                image.add_header('Content-Disposition', 'inline', filename='iPetro_logo.png')
                msg.attach(image)
            else:
                print(f"⚠️ Logo file not found at: {logo_path}")
                
        except Exception as e:
            print(f"⚠️ Failed to attach logo: {e}")

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False

