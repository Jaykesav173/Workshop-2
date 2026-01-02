"""
Email Notification Utilities
Handles email sending for notifications
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from app.config import settings

def get_email_template(subject: str, content: str) -> str:
    """
    Generates an HTML email template with the iPetro logo.
    """
    # Use Content-ID (CID) for the logo to ensure it displays in all email clients
    logo_src = "cid:ipetro_logo"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }}
            .header {{ background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0; }}
            .header img {{ max-height: 50px; }}
            .content {{ padding: 30px; background-color: #ffffff; }}
            .footer {{ background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }}
            .button {{ display: inline-block; background-color: #007bff; color:white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="{logo_src}" alt="iPetro Logo" />
            </div>
            <div class="content">
                <h2 style="color: #333; margin-top: 0;">{subject}</h2>
                {content}
            </div>
            <div class="footer">
                &copy; {2026} VISOR System. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """
    return html

def send_email(to: str, subject: str, content: str, is_html: bool = True) -> bool:
    """
    Send email notification
    Returns True if successful, False otherwise
    """
    print(f"📧 DEBUG: SMTP Config -> Host: {settings.SMTP_HOST}, Port: {settings.SMTP_PORT}, User: {settings.SMTP_USER}")
    
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD]):
        print(f"⚠️ Email configuration incomplete. Host: {bool(settings.SMTP_HOST)}, User: {bool(settings.SMTP_USER)}, Pass: {bool(settings.SMTP_PASSWORD)}")
        return False
    
    try:
        msg = MIMEMultipart("related") # Use 'related' for images with CIDs
        msg["From"] = settings.SMTP_USER
        msg["To"] = to
        msg["Subject"] = subject
        
        # Create the HTML part
        msg_alternative = MIMEMultipart("alternative")
        msg.attach(msg_alternative)

        # Convert newlines to breaks if plain text content passed to HTML
        if is_html:
            # If content doesn't look like HTML, wrap it in paragraphs/breaks
            if "<div" not in content and "<p" not in content:
                formatted_content = content.replace("\n", "<br>")
                body = get_email_template(subject, formatted_content)
            else:
                 body = get_email_template(subject, content)
            msg_alternative.attach(MIMEText(body, "html"))
        else:
             msg_alternative.attach(MIMEText(content, "plain"))
        
        # Attach the logo image if it exists
        # Assuming the code runs from backend/ root, so app/assets/ipetro_logo.png
        # Use absolute path relative to this file to be safe? 
        # But 'app.config' implies this is a package. 
        # Let's try to find the absolute path based on the current file location
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one level to 'app' then into 'assets'
        assets_dir = os.path.join(os.path.dirname(current_dir), "assets")
        logo_path = os.path.join(assets_dir, "ipetro_logo.png")

        if os.path.exists(logo_path):
             with open(logo_path, "rb") as f:
                logo_data = f.read()
                logo_image = MIMEImage(logo_data)
                logo_image.add_header('Content-ID', '<ipetro_logo>')
                logo_image.add_header('Content-Disposition', 'inline', filename='ipetro_logo.png')
                msg.attach(logo_image)
        else:
             print(f"⚠️ Warning: Logo file not found at {logo_path}")

        
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False

