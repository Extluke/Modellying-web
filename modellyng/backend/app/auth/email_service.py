from __future__ import annotations

from dataclasses import dataclass
from email.message import EmailMessage
from email.utils import formataddr
import html
import logging
import os
import smtplib
import ssl
from typing import Optional

logger = logging.getLogger("modellyng.auth.email")


class EmailDeliveryError(RuntimeError):
    """Raised when an email cannot be delivered through configured providers."""


@dataclass(frozen=True)
class EmailDeliveryResult:
    delivered: bool
    channel: str  # "smtp" | "mailpit" | "dev_preview"
    detail: Optional[str] = None


def _get_frontend_base_url() -> str:
    raw = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").strip()
    return raw.rstrip("/") or "http://localhost:3000"


def _parse_bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


def _parse_int_env(name: str, default: int) -> int:
    raw = os.getenv(name, "").strip()
    if not raw:
        return default
    try:
        parsed = int(raw)
        return parsed if parsed > 0 else default
    except ValueError:
        return default


def build_verification_url(raw_token: str) -> str:
    return f"{_get_frontend_base_url()}/verify-email?token={raw_token}"


def build_password_reset_url(raw_token: str) -> str:
    return f"{_get_frontend_base_url()}/reset-password?token={raw_token}"


def _build_email_message(
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str,
    from_email: str,
    from_name: str,
) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, from_email))
    msg["To"] = to_email
    msg.set_content(text_body, subtype="plain", charset="utf-8")
    msg.add_alternative(html_body, subtype="html", charset="utf-8")
    return msg


def _send_via_smtp(
    msg: EmailMessage,
    host: str,
    port: int,
    username: str,
    password: str,
    use_tls: bool,
    timeout: int = 10,
) -> None:
    context = ssl.create_default_context()
    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=timeout, context=context) as server:
            if username and password:
                server.login(username, password)
            server.send_message(msg)
        return

    with smtplib.SMTP(host, port, timeout=timeout) as server:
        server.ehlo()
        if use_tls:
            server.starttls(context=context)
            server.ehlo()
        if username and password:
            server.login(username, password)
        server.send_message(msg)


def _send_via_mailpit(
    msg: EmailMessage,
    host: str,
    port: int,
    timeout: int = 3,
) -> None:
    with smtplib.SMTP(host, port, timeout=timeout) as server:
        server.send_message(msg)


def deliver_email(
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str,
) -> EmailDeliveryResult:
    """
    Delivers transactional auth email using Option A (Auto-Detect):
    1. Real SMTP (e.g., Gmail App Password) when configured.
    2. Local Mailpit Docker sandbox (127.0.0.1:28025 -> UI :28024).
    3. Development preview fallback when APP_ENV == 'development'.
    """
    app_env = os.getenv("APP_ENV", "development").strip().lower()
    provider = os.getenv("EMAIL_PROVIDER", "auto").strip().lower()

    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = _parse_int_env("SMTP_PORT", 587)
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_use_tls = _parse_bool_env("SMTP_USE_TLS", True)
    smtp_from_email = (
        os.getenv("SMTP_FROM_EMAIL", "").strip()
        or smtp_username
        or "no-reply@modellyng.local"
    )
    smtp_from_name = (
        os.getenv("SMTP_FROM_NAME", "").strip() or "Modellyng Research Platform"
    )

    mailpit_host = os.getenv("MAILPIT_HOST", "127.0.0.1").strip() or "127.0.0.1"
    mailpit_port = _parse_int_env("MAILPIT_PORT", 28025)

    msg = _build_email_message(
        to_email=to_email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
        from_email=smtp_from_email,
        from_name=smtp_from_name,
    )

    has_smtp_creds = bool(smtp_host and smtp_username and smtp_password)

    if provider == "smtp" or (provider == "auto" and has_smtp_creds):
        try:
            _send_via_smtp(
                msg=msg,
                host=smtp_host,
                port=smtp_port,
                username=smtp_username,
                password=smtp_password,
                use_tls=smtp_use_tls,
            )
            logger.info("Sent auth email via SMTP to %s", to_email)
            return EmailDeliveryResult(delivered=True, channel="smtp")
        except Exception as exc:
            logger.error("SMTP email delivery failed for %s (%s)", to_email, type(exc).__name__)
            if provider == "smtp" or app_env != "development":
                raise EmailDeliveryError(
                    "Gagal mengirim email verifikasi melalui server SMTP. Silakan coba beberapa saat lagi."
                ) from exc

    if provider in ("auto", "mailpit"):
        try:
            _send_via_mailpit(
                msg=msg,
                host=mailpit_host,
                port=mailpit_port,
            )
            logger.info("Sent auth email via local Mailpit (%s:%s) to %s", mailpit_host, mailpit_port, to_email)
            return EmailDeliveryResult(delivered=True, channel="mailpit")
        except Exception as exc:
            logger.warning(
                "Local Mailpit SMTP (%s:%s) unreachable for %s (%s)",
                mailpit_host,
                mailpit_port,
                to_email,
                type(exc).__name__,
            )
            if provider == "mailpit" or app_env != "development":
                raise EmailDeliveryError(
                    "Layanan pengirim email tidak tersedia saat ini. Silakan coba kembali nanti."
                ) from exc

    if app_env == "development":
        logger.warning(
            "No active SMTP/Mailpit server; using development preview fallback for %s.",
            to_email,
        )
        return EmailDeliveryResult(delivered=False, channel="dev_preview")

    raise EmailDeliveryError(
        "Konfigurasi pengiriman email belum tersedia di server produksi."
    )


def send_verification_email(
    to_email: str,
    full_name: str,
    otp_code: str,
    verification_url: str,
    expires_minutes: int = 15,
) -> EmailDeliveryResult:
    """Sends a bilingual-friendly Indonesian verification email with 6-digit OTP and Magic Link."""
    safe_name = html.escape(full_name.strip() or "Peneliti")
    safe_url = html.escape(verification_url, quote=True)
    safe_otp = html.escape(otp_code)

    subject = f"[Modellyng] Kode Verifikasi Email Anda: {otp_code}"

    text_body = (
        f"Halo {full_name.strip() or 'Peneliti'},\n\n"
        "Terima kasih telah mendaftar di Modellyng Web.\n"
        "Untuk mengaktifkan akun riset Anda, masukkan kode OTP 6 digit berikut pada halaman verifikasi:\n\n"
        f"    {otp_code}\n\n"
        "Atau klik tautan verifikasi berikut secara langsung:\n"
        f"    {verification_url}\n\n"
        f"Kode dan tautan ini berlaku selama {expires_minutes} menit dan hanya dapat digunakan satu kali.\n"
        "Jika Anda tidak merasa mendaftar di Modellyng, abaikan email ini.\n\n"
        "Salam hangat,\n"
        "Tim Modellyng Research Platform\n"
    )

    html_body = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifikasi Email Modellyng</title>
</head>
<body style="margin:0;padding:0;background-color:#F6F7FB;font-family:'Inter',Arial,sans-serif;color:#172033;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#FFFFFF;border:1px solid #E5E8EF;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#17193B,#5147E5);padding:24px 28px;color:#FFFFFF;">
              <div style="font-size:18px;font-weight:800;letter-spacing:-0.02em;">Modellyng</div>
              <div style="font-size:12px;color:#E0E7FF;margin-top:4px;">Evidence-Centered Academic PDF Analysis</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#172033;">Verifikasi Alamat Email Anda</h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#475467;">
                Halo <strong>{safe_name}</strong>,<br />
                Gunakan kode verifikasi 6 digit di bawah ini atau klik tombol konfirmasi untuk mengaktifkan akun peneliti Modellyng Anda.
              </p>

              <div style="margin:20px 0;padding:18px;background-color:#EEECFF;border:1px dashed #5147E5;border-radius:12px;text-align:center;">
                <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#3730A3;margin-bottom:6px;">
                  Kode Verifikasi (OTP)
                </div>
                <div style="font-family:monospace;font-size:32px;font-weight:800;letter-spacing:0.28em;color:#172033;">
                  {safe_otp}
                </div>
              </div>

              <div style="text-align:center;margin:24px 0;">
                <a href="{safe_url}" style="display:inline-block;background-color:#5147E5;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:12px;">
                  Verifikasi Email Sekarang
                </a>
              </div>

              <p style="margin:0 0 12px 0;font-size:12px;line-height:1.6;color:#667085;">
                Atau salin dan buka tautan berikut di peramban Anda:<br />
                <a href="{safe_url}" style="color:#5147E5;word-break:break-all;">{safe_url}</a>
              </p>

              <p style="margin:16px 0 0 0;padding-top:16px;border-top:1px solid #E5E8EF;font-size:12px;line-height:1.5;color:#667085;">
                Kode dan tautan berlaku selama <strong>{expires_minutes} menit</strong>. Jika Anda tidak membuat permintaan pendaftaran ini, abaikan email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    return deliver_email(
        to_email=to_email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )


def send_password_reset_email(
    to_email: str,
    reset_url: str,
    expires_minutes: int = 60,
) -> EmailDeliveryResult:
    """Sends a password recovery email via SMTP or local Mailpit when available."""
    safe_url = html.escape(reset_url, quote=True)
    subject = "[Modellyng] Tautan Pemulihan Kata Sandi"

    text_body = (
        "Halo Peneliti,\n\n"
        "Kami menerima permintaan untuk mengatur ulang kata sandi akun Modellyng Anda.\n"
        "Silakan buka tautan berikut untuk membuat kata sandi baru:\n\n"
        f"    {reset_url}\n\n"
        f"Tautan ini berlaku selama {expires_minutes} menit. Abaikan email ini jika Anda tidak meminta pengaturan ulang kata sandi.\n"
    )

    html_body = f"""<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:24px;background-color:#F6F7FB;font-family:'Inter',Arial,sans-serif;color:#172033;">
  <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E8EF;border-radius:16px;padding:28px;">
    <h2 style="margin:0 0 12px 0;font-size:18px;color:#172033;">Pemulihan Kata Sandi Modellyng</h2>
    <p style="font-size:14px;line-height:1.6;color:#475467;">
      Klik tombol di bawah ini untuk mengatur ulang kata sandi akun Anda. Tautan berlaku selama <strong>{expires_minutes} menit</strong>.
    </p>
    <div style="margin:22px 0;text-align:center;">
      <a href="{safe_url}" style="display:inline-block;background-color:#5147E5;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:12px;">
        Atur Ulang Kata Sandi
      </a>
    </div>
    <p style="font-size:12px;color:#667085;word-break:break-all;">{safe_url}</p>
  </div>
</body>
</html>"""

    return deliver_email(
        to_email=to_email,
        subject=subject,
        text_body=text_body,
        html_body=html_body,
    )
