import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv

load_dotenv()

def send_email(to_email: str, subject: str, plain_text: str, html_content: str):
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_PASSWORD")
    smtp_username = os.getenv("SMTP_USERNAME") 
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT") or 587)

    if not all([sender_email, sender_password, smtp_host, smtp_port]):
        raise ValueError("Missing SMTP configuration environment variables.")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{os.getenv('DISPLAY_NAME')} <{sender_email}>"
    msg["To"] = to_email
    msg.set_content(plain_text)
    msg.add_alternative(html_content, subtype='html')

    print(f"Connecting to SMTP host: {smtp_host}:{smtp_port}")
    print(f"🔐 Connecting with {sender_email} and key {sender_password[:10]}***")

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as smtp:
            smtp.starttls()
            smtp.login(smtp_username, sender_password) 
            smtp.send_message(msg)
        print("✅ Email sent successfully.")
    except smtplib.SMTPAuthenticationError as e:
        print("❌ SMTP Authentication failed:", e)
        raise
    except Exception as e:
        print("❌ Failed to send email:", e)
        raise
