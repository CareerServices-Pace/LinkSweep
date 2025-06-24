import smtplib
from email.message import EmailMessage
import os
from dotenv import load_dotenv
load_dotenv()


def send_credentials_email(to_email: str, username: str, password: str):
    msg = EmailMessage()
    msg["Subject"] = "Your LinkSweep Account Credentials"
    msg["From"] = os.getenv("EMAIL_SENDER")
    msg["To"] = to_email

    msg.set_content(f"""
    Hello {username},

    Your LinkSweep account has been created.

    Login Credentials:
    ------------------
    Username: {username}
    Password: {password}

    Please log in and change your password on first login.

    Regards,
    LinkSweep Team
    """)

    # Use your email service's SMTP settings
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(os.getenv("EMAIL_SENDER"), os.getenv("EMAIL_PASSWORD"))
        smtp.send_message(msg)