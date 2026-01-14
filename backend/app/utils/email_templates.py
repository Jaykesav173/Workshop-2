import os

def get_email_html(title: str, name: str, intro: str, details: dict = None, custom_content_html: str = None, action_url: str = None, action_text: str = "View details"):
    """
    Generates a standardized HTML email template with the iPetro logo.
    
    Args:
        title (str): The main heading of the email.
        name (str): The recipient's name.
        intro (str): The introductory text.
        details (dict): Optional. A dictionary of key-value pairs to display in a list.
        custom_content_html (str): Optional. Custom HTML content to display instead of or in addition to details.
        action_url (str): The URL for the call-to-action button.
        action_text (str): The text for the call-to-action button.
    """
    
    # Construct content HTML
    content_html = ""
    
    if details:
        content_html += '<div style="background-color: #F9FAFB; border-radius: 6px; padding: 20px; margin-bottom: 24px;"><ul style="list-style: none; padding: 0; margin: 0;">'
        for key, value in details.items():
            content_html += f'<li style="margin-bottom: 8px; color: #1F2937;"><strong>{key}:</strong> {value}</li>'
        content_html += '</ul></div>'
        
    if custom_content_html:
        content_html += custom_content_html
    
    # Logo URL (using Content-ID)
    logo_url = "cid:iPetro_logo"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: white;">
        <!-- Logo Header -->
        <div style="background-color: #ffffff; padding: 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
            <img src="{logo_url}" alt="iPetro Logo" style="height: 40px; display: inline-block;">
        </div>
        
        <div style="padding: 30px;">
            <!-- Title -->
            <h2 style="color: #374151; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: bold;">{title}</h2>
            
            <!-- Greeting -->
            <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">Hello {name},</p>
            
            <!-- Intro -->
            <p style="color: #4B5563; margin-bottom: 24px;">{intro}</p>
            
            <!-- Content -->
            {content_html}

            <!-- Call to Action -->
            <p style="color: #6B7280; font-size: 14px; margin-bottom: 24px;">Please login to your dashboard to view details and take action.</p>
            
            """
            
    if action_url:
        html_content += f"""
            <div style="margin-bottom: 10px;">
                <a href="{action_url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500; display: inline-block; font-size: 14px;">{action_text}</a>
            </div>
        """
        
    html_content += """
        </div>
    </div>
    """
    
    return html_content
