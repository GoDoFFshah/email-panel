"""
Core utility functions.
"""

import re
import smtplib
import ssl
import mimetypes
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from cryptography.fernet import Fernet
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
import os
import logging
from base64 import urlsafe_b64encode
from hashlib import sha256

logger = logging.getLogger(__name__)

# Email validation regex
EMAIL_REGEX = re.compile(r"^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$")


def validate_email(email):
    """Validate email format."""
    return bool(EMAIL_REGEX.match(email))


def validate_emails(email_list):
    """Validate list of emails."""
    valid = []
    invalid = []
    for email in email_list:
        if validate_email(email):
            valid.append(email)
        else:
            invalid.append(email)
    return valid, invalid


def get_encryption_key():
    """Get or generate encryption key from SECRET_KEY."""
    secret = settings.SECRET_KEY
    # Ensure key is 32 bytes for Fernet
    key = urlsafe_b64encode(sha256(secret.encode()).digest())
    return key


def encrypt_password(password):
    """Encrypt password using Fernet."""
    try:
        key = get_encryption_key()
        cipher = Fernet(key)
        return cipher.encrypt(password.encode()).decode()
    except Exception as e:
        logger.error(f"Failed to encrypt password: {e}")
        return password


def decrypt_password(encrypted_password):
    """Decrypt password."""
    try:
        key = get_encryption_key()
        cipher = Fernet(key)
        return cipher.decrypt(encrypted_password.encode()).decode()
    except Exception as e:
        logger.error(f"Failed to decrypt password: {e}")
        return encrypted_password


def test_smtp_connection(email, password, host='smtp.gmail.com', port=587):
    """Test SMTP connection."""
    try:
        print(f"📡 Testing SMTP: {email} @ {host}:{port}")
        context = ssl.create_default_context()
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.starttls(context=context)
            server.login(email, password)
        print("✅ SMTP connection successful!")
        return {
            'success': True,
            'message': 'SMTP connection successful'
        }
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ Auth error: {e}")
        return {
            'success': False,
            'error': '❌ Authentication failed. Please check email and password.'
        }
    except smtplib.SMTPException as e:
        print(f"❌ SMTP error: {e}")
        return {
            'success': False,
            'error': f'SMTP error: {str(e)}'
        }
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return {
            'success': False,
            'error': f'Connection error: {str(e)}'
        }


def send_single_email(sender_email, sender_password, to_email, subject, body,
                      body_html=None, attachment=None, smtp_host='smtp.gmail.com',
                      smtp_port=587):
    """Send a single email."""
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Plain text body
        part1 = MIMEText(body, 'plain', 'utf-8')
        msg.attach(part1)
        
        # HTML body
        if body_html:
            part2 = MIMEText(body_html, 'html', 'utf-8')
            msg.attach(part2)
        
        # Attachment
        if attachment and os.path.exists(attachment):
            ctype, encoding = mimetypes.guess_type(attachment)
            if ctype is None or encoding is not None:
                ctype = 'application/octet-stream'
            
            maintype, subtype = ctype.split('/', 1)
            with open(attachment, 'rb') as f:
                part = MIMEBase(maintype, subtype)
                part.set_payload(f.read())
            
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                'attachment',
                filename=os.path.basename(attachment)
            )
            msg.attach(part)
        
        # Send
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
            server.starttls(context=context)
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, [to_email], msg.as_string())
        
        return {
            'success': True,
            'message': 'Email sent successfully'
        }
    
    except smtplib.SMTPAuthenticationError:
        return {
            'success': False,
            'error': 'Authentication failed'
        }
    except smtplib.SMTPRecipientsRefused:
        return {
            'success': False,
            'error': 'Recipient email refused'
        }
    except smtplib.SMTPServerDisconnected:
        return {
            'success': False,
            'error': 'SMTP server disconnected'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def generate_tracking_id():
    """Generate unique tracking ID for email."""
    import uuid
    return f"track_{uuid.uuid4().hex[:16]}"


def sanitize_html(html_content):
    """Sanitize HTML content for email."""
    import bleach
    allowed_tags = [
        'a', 'b', 'br', 'div', 'em', 'font', 'h1', 'h2', 'h3', 'h4',
        'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'span',
        'strong', 'table', 'td', 'th', 'tr', 'u', 'ul'
    ]
    allowed_attrs = {
        'a': ['href', 'target'],
        'img': ['src', 'alt', 'width', 'height'],
        'font': ['color', 'size', 'face'],
        'table': ['border', 'cellpadding', 'cellspacing', 'width'],
        'td': ['colspan', 'rowspan', 'width', 'align'],
        'th': ['colspan', 'rowspan', 'width', 'align'],
    }
    
    return bleach.clean(
        html_content,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True
    )


def get_file_extension(filename):
    """Get file extension."""
    return os.path.splitext(filename)[1].lower()


def is_allowed_file(filename, allowed_extensions=None):
    """Check if file type is allowed."""
    if allowed_extensions is None:
        allowed_extensions = [
            '.pdf', '.doc', '.docx', '.xls', '.xlsx',
            '.jpg', '.jpeg', '.png', '.gif', '.svg',
            '.txt', '.csv', '.zip', '.rar'
        ]
    ext = get_file_extension(filename)
    return ext in allowed_extensions


def format_phone_number(phone):
    """Format phone number."""
    import re
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # Format based on length
    if len(digits) == 11 and digits.startswith('0'):
        return f"0{digits[1:4]}-{digits[4:7]}-{digits[7:11]}"
    elif len(digits) == 10:
        return f"{digits[:3]}-{digits[3:6]}-{digits[6:10]}"
    else:
        return phone


def calculate_percentage(part, total):
    """Calculate percentage."""
    if total == 0:
        return 0
    return round((part / total) * 100, 2)


def format_duration(seconds):
    """Format duration in seconds to human readable format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    seconds = int(seconds % 60)
    
    if hours > 0:
        return f"{hours}h {minutes}m {seconds}s"
    elif minutes > 0:
        return f"{minutes}m {seconds}s"
    else:
        return f"{seconds}s"


def mask_email(email):
    """Mask email for display."""
    if '@' not in email:
        return email
    local, domain = email.split('@')
    if len(local) <= 2:
        return f"{local[0]}***@{domain}"
    return f"{local[:2]}***{local[-1]}@{domain}"


def get_user_agent(request):
    """Get user agent from request."""
    return request.META.get('HTTP_USER_AGENT', 'Unknown')


def get_user_location(ip):
    """Get location from IP (simplified)."""
    # This would use a geoip service
    # For now, return unknown
    return None


# ==================== EMAIL VERIFICATION SERVICES ====================

def generate_verification_code():
    """Generate a 6-digit random verification code."""
    return ''.join(random.choices(string.digits, k=6))


def generate_reset_token():
    """Generate a unique reset token."""
    import uuid
    return str(uuid.uuid4()).replace('-', '')[:32]


def send_verification_email(email, code, verification_type='register'):
    """
    Send verification code to email.
    
    Args:
        email: Recipient email address
        code: 6-digit verification code
        verification_type: 'register' or 'reset_password'
    
    Returns:
        tuple: (success, message)
    """
    
    if verification_type == 'register':
        subject = '✅ کد تایید ثبت‌نام - Email Panel'
        message = f"""
سلام کاربر عزیز،

از شما برای ثبت‌نام در Email Panel سپاسگزاریم.

کد تایید شما:
{code}

این کد تا ۱۰ دقیقه اعتبار دارد.

با احترام،
تیم Email Panel
"""
    elif verification_type == 'reset_password':
        subject = '🔑 بازیابی رمز عبور - Email Panel'
        message = f"""
سلام کاربر عزیز،

درخواست بازیابی رمز عبور برای حساب شما ثبت شده است.

کد بازیابی شما:
{code}

این کد تا ۱۰ دقیقه اعتبار دارد.

اگر درخواست نکرده‌اید، این پیام را نادیده بگیرید.

با احترام،
تیم Email Panel
"""
    else:
        return False, "Invalid verification type"
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@emailpanel.com',
            recipient_list=[email],
            fail_silently=False,
        )
        logger.info(f"Verification email sent to {email} ({verification_type})")
        return True, "Email sent successfully"
    except Exception as e:
        logger.error(f"Failed to send verification email to {email}: {e}")
        return False, str(e)


def send_password_reset_email(email, reset_link):
    """
    Send password reset link to email.
    
    Args:
        email: Recipient email address
        reset_link: Password reset link
    
    Returns:
        tuple: (success, message)
    """
    subject = '🔑 بازیابی رمز عبور - Email Panel'
    message = f"""
سلام کاربر عزیز،

برای بازیابی رمز عبور خود روی لینک زیر کلیک کنید:

{reset_link}

این لینک تا ۱ ساعت اعتبار دارد.

اگر درخواست نکرده‌اید، این پیام را نادیده بگیرید.

با احترام،
تیم Email Panel
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@emailpanel.com',
            recipient_list=[email],
            fail_silently=False,
        )
        logger.info(f"Password reset email sent to {email}")
        return True, "Email sent successfully"
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {e}")
        return False, str(e)