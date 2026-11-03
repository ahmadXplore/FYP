import hashlib
import hmac
import os
import re
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import IntegrityError


class AuthServiceError(Exception):
    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def _read_settings() -> Dict[str, str]:
    settings: Dict[str, str] = {}
    for env_path in (Path(__file__).resolve().parent.parent / ".env", Path(__file__).with_name(".env")):
        if env_path.is_file():
            for line in env_path.read_text(encoding="utf-8").splitlines():
                key, separator, value = line.partition("=")
                if separator and key.strip() and not key.lstrip().startswith("#"):
                    settings[key.strip()] = value.strip().strip("\"'")
    settings.update({key: value for key, value in os.environ.items()})
    return settings


_SETTINGS = _read_settings()
_JWT_SECRET = _SETTINGS.get("JWT_SECRET", "")
_DATABASE_URL = _SETTINGS.get("DATABASE_URL", "")
if _DATABASE_URL.startswith("postgres://"):
    _DATABASE_URL = "postgresql://" + _DATABASE_URL[len("postgres://"):]
if not _DATABASE_URL:
    _DATABASE_URL = "sqlite:///" + str(Path(__file__).with_name("greencorridor.db"))

_ENGINE_OPTIONS: Dict[str, Any] = {"pool_pre_ping": True}
if _DATABASE_URL.startswith("sqlite:"):
    _ENGINE_OPTIONS["connect_args"] = {"check_same_thread": False}
engine: Engine = create_engine(_DATABASE_URL, **_ENGINE_OPTIONS)
_IS_SQLITE = engine.dialect.name == "sqlite"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: datetime) -> str:
    return value.isoformat()


def _valid_email(email: str) -> str:
    normalized = email.strip().casefold()
    if len(normalized) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
        raise AuthServiceError(400, "Enter a valid official email address")
    return normalized


def _validate_employee_email(email: str) -> str:
    normalized = _valid_email(email)
    allowed_domains = {
        domain.strip().casefold().lstrip("@")
        for domain in _SETTINGS.get("AUTH_ALLOWED_EMAIL_DOMAINS", "").split(",")
        if domain.strip()
    }
    if allowed_domains and normalized.rsplit("@", 1)[1] not in allowed_domains:
        raise AuthServiceError(400, "Use an official PSCA or 1122 email address")
    return normalized


def _validate_profile(full_name: str, job_title: str) -> Tuple[str, str]:
    full_name = full_name.strip()
    job_title = job_title.strip()
    if not full_name or len(full_name) > 120:
        raise AuthServiceError(400, "Full name must be between 1 and 120 characters")
    if not job_title or len(job_title) > 120:
        raise AuthServiceError(400, "Job title must be between 1 and 120 characters")
    return full_name, job_title


def _validate_account_type(role: str, department: str) -> Tuple[str, str]:
    if role not in {"employee", "admin"}:
        raise AuthServiceError(400, "Select a valid account type")
    if department not in {"PSCA", "1122"}:
        raise AuthServiceError(400, "Select PSCA or 1122 as your department")
    return role, department


def _is_bootstrap_admin(email: str) -> bool:
    configured_admins = {
        configured_email.strip().casefold()
        for configured_email in _SETTINGS.get("AUTH_ADMIN_EMAILS", "").split(",")
        if configured_email.strip()
    }
    return email.casefold() in configured_admins


def _validate_password(password: str) -> None:
    if len(password) < 8:
        raise AuthServiceError(400, "Password must be at least 8 characters long")
    if len(password.encode("utf-8")) > 72:
        raise AuthServiceError(400, "Password must be 72 bytes or fewer")


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def _verify_password(password: str, password_hash: str) -> bool:
    if len(password.encode("utf-8")) > 72:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except (ValueError, TypeError):
        return False


def _jwt_secret() -> str:
    if not _JWT_SECRET:
        raise AuthServiceError(503, "JWT_SECRET is not configured in backend/.env")
    return _JWT_SECRET


def _make_token(claims: Dict[str, Any], lifetime: timedelta) -> str:
    now = _now()
    payload = {
        **claims,
        "iat": now,
        "exp": now + lifetime,
    }
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def _make_access_token(account: Dict[str, Any]) -> str:
    return _make_token({
        "sub": account["official_email"],
        "name": account["full_name"],
        "job_title": account["job_title"],
        "role": account["role"],
        "department": account["department"],
        "purpose": "access",
    }, timedelta(hours=8))


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        claims = jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
    except InvalidTokenError as error:
        raise AuthServiceError(401, "Session token is invalid or expired") from error
    if claims.get("purpose") != "access" or not claims.get("sub"):
        raise AuthServiceError(401, "Session token is invalid")
    return claims


def _challenge_digest(challenge_id: str, otp: str) -> str:
    return hmac.new(
        _jwt_secret().encode("utf-8"),
        f"{challenge_id}:{otp}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def init_auth_store() -> None:
    if _IS_SQLITE:
        account_id = "INTEGER PRIMARY KEY AUTOINCREMENT"
    else:
        account_id = "SERIAL PRIMARY KEY"

    with engine.begin() as conn:
        conn.execute(text(f"""
            CREATE TABLE IF NOT EXISTS employee_accounts (
                id {account_id},
                full_name VARCHAR(120) NOT NULL,
                official_email VARCHAR(254) NOT NULL UNIQUE,
                job_title VARCHAR(120) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at VARCHAR(40) NOT NULL
            )
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS employee_auth_challenges (
                challenge_id VARCHAR(64) PRIMARY KEY,
                email VARCHAR(254) NOT NULL,
                purpose VARCHAR(20) NOT NULL,
                code_hash VARCHAR(64) NOT NULL,
                expires_at VARCHAR(40) NOT NULL,
                attempts_remaining INTEGER NOT NULL,
                consumed_at VARCHAR(40),
                full_name VARCHAR(120),
                job_title VARCHAR(120),
                password_hash VARCHAR(255),
                created_at VARCHAR(40) NOT NULL
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_employee_auth_challenges_email
            ON employee_auth_challenges (email, purpose, created_at)
        """))
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS employee_password_reset_grants (
                token_id VARCHAR(64) PRIMARY KEY,
                email VARCHAR(254) NOT NULL,
                expires_at VARCHAR(40) NOT NULL,
                used_at VARCHAR(40)
            )
        """))
        for table_name, columns in {
            "employee_accounts": {
                "role": "VARCHAR(20) NOT NULL DEFAULT 'employee'",
                "department": "VARCHAR(20) NOT NULL DEFAULT '1122'",
                "approval_status": "VARCHAR(20) NOT NULL DEFAULT 'approved'",
            },
            "employee_auth_challenges": {
                "role": "VARCHAR(20) NOT NULL DEFAULT 'employee'",
                "department": "VARCHAR(20) NOT NULL DEFAULT '1122'",
            },
        }.items():
            existing_columns = {
                column["name"] for column in inspect(conn).get_columns(table_name)
            }
            for column_name, definition in columns.items():
                if column_name not in existing_columns:
                    conn.execute(text(
                        f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"
                    ))


def _send_otp_email(email: str, otp: str, purpose: str) -> None:
    settings = _SETTINGS
    host = settings.get("SMTP_HOST", "")
    username = settings.get("SMTP_USERNAME", "")
    password = settings.get("SMTP_PASSWORD", "")
    sender = settings.get("SMTP_FROM", "") or username
    if not host or not username or not password or not sender:
        raise AuthServiceError(503, "Email delivery is not configured; check the SMTP settings in backend/.env")

    try:
        port = int(settings.get("SMTP_PORT", "587"))
    except ValueError as error:
        raise AuthServiceError(503, "SMTP_PORT must be a valid port number") from error

    purpose_text = "verify your new account" if purpose == "signup" else "reset your password"
    message = EmailMessage()
    message["Subject"] = "GreenCorridor AI verification code"
    message["From"] = sender
    message["To"] = email
    message.set_content(
        f"Your code to {purpose_text} is {otp}.\n\n"
        "The code expires in 5 minutes. If you did not request this, ignore this email."
    )

    use_ssl = settings.get("SMTP_USE_SSL", "").strip().casefold() in {"1", "true", "yes", "on"}
    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=15) as smtp:
                smtp.login(username, password)
                smtp.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=15) as smtp:
                smtp.ehlo()
                smtp.starttls()
                smtp.ehlo()
                smtp.login(username, password)
                smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as error:
        raise AuthServiceError(503, "Could not send verification email; check SMTP settings and try again") from error


def _new_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _store_challenge(
    email: str,
    purpose: str,
    otp: str,
    full_name: Optional[str] = None,
    job_title: Optional[str] = None,
    password_hash: Optional[str] = None,
    role: str = "employee",
    department: str = "1122",
) -> str:
    challenge_id = secrets.token_urlsafe(24)
    now = _now()
    with engine.begin() as conn:
        conn.execute(text("""
            UPDATE employee_auth_challenges
            SET consumed_at = :now
            WHERE email = :email AND purpose = :purpose AND consumed_at IS NULL
        """), {"now": _iso(now), "email": email, "purpose": purpose})
        conn.execute(text("""
            INSERT INTO employee_auth_challenges
                (challenge_id, email, purpose, code_hash, expires_at, attempts_remaining,
                 full_name, job_title, password_hash, role, department, created_at)
            VALUES
                (:challenge_id, :email, :purpose, :code_hash, :expires_at, 5,
                 :full_name, :job_title, :password_hash, :role, :department, :created_at)
        """), {
            "challenge_id": challenge_id,
            "email": email,
            "purpose": purpose,
            "code_hash": _challenge_digest(challenge_id, otp),
            "expires_at": _iso(now + timedelta(minutes=5)),
            "full_name": full_name,
            "job_title": job_title,
            "password_hash": password_hash,
            "role": role,
            "department": department,
            "created_at": _iso(now),
        })
    return challenge_id


def _deliver_challenge(email: str, purpose: str, challenge_id: str, otp: str) -> Dict[str, Any]:
    try:
        _send_otp_email(email, otp, purpose)
    except AuthServiceError:
        with engine.begin() as conn:
            conn.execute(text("""
                UPDATE employee_auth_challenges SET consumed_at = :now
                WHERE challenge_id = :challenge_id
            """), {"now": _iso(_now()), "challenge_id": challenge_id})
        raise
    return {
        "status": "success",
        "challenge_id": challenge_id,
        "expires_in_seconds": 300,
        "message": "A verification code has been sent to your email address.",
    }


def request_signup_otp(
    full_name: str,
    email: str,
    job_title: str,
    password: str,
    role: str,
    department: str,
) -> Dict[str, Any]:
    full_name, job_title = _validate_profile(full_name, job_title)
    role, department = _validate_account_type(role, department)
    email = _validate_employee_email(email)
    if role == "admin" and not _is_bootstrap_admin(email):
        raise AuthServiceError(403, "Admin registration is restricted to configured AUTH_ADMIN_EMAILS addresses")
    _validate_password(password)

    with engine.connect() as conn:
        existing = conn.execute(text("""
            SELECT 1 FROM employee_accounts WHERE official_email = :email
        """), {"email": email}).first()
    if existing:
        raise AuthServiceError(409, "An account with this email already exists")

    otp = _new_otp()
    challenge_id = _store_challenge(
        email,
        "signup",
        otp,
        full_name,
        job_title,
        _hash_password(password),
        role,
        department,
    )
    return _deliver_challenge(email, "signup", challenge_id, otp)


def request_password_reset(email: str) -> Dict[str, Any]:
    email = _valid_email(email)
    with engine.connect() as conn:
        account = conn.execute(text("""
            SELECT 1 FROM employee_accounts WHERE official_email = :email
        """), {"email": email}).first()

    if account:
        otp = _new_otp()
        challenge_id = _store_challenge(email, "reset", otp)
        _deliver_challenge(email, "reset", challenge_id, otp)
    else:
        challenge_id = secrets.token_urlsafe(24)
    return {
        "status": "success",
        "challenge_id": challenge_id,
        "expires_in_seconds": 300,
        "message": "If an account exists for that email, a verification code has been sent.",
    }


def _get_challenge(challenge_id: str, email: str, purpose: str) -> Optional[Any]:
    with engine.connect() as conn:
        return conn.execute(text("""
            SELECT challenge_id, email, purpose, code_hash, expires_at,
                   attempts_remaining, full_name, job_title, password_hash,
                   role, department
            FROM employee_auth_challenges
            WHERE challenge_id = :challenge_id AND email = :email
              AND purpose = :purpose AND consumed_at IS NULL
        """), {
            "challenge_id": challenge_id,
            "email": email,
            "purpose": purpose,
        }).mappings().first()


def _consume_challenge(challenge_id: str, now: str) -> bool:
    with engine.begin() as conn:
        result = conn.execute(text("""
            UPDATE employee_auth_challenges
            SET consumed_at = :now
            WHERE challenge_id = :challenge_id AND consumed_at IS NULL
        """), {"now": now, "challenge_id": challenge_id})
        return result.rowcount == 1


def _verify_challenge_code(challenge: Any, otp: str) -> None:
    now = _now()
    try:
        expires_at = datetime.fromisoformat(challenge["expires_at"])
    except (TypeError, ValueError) as error:
        raise AuthServiceError(400, "OTP challenge is invalid or expired") from error

    if expires_at <= now:
        _consume_challenge(challenge["challenge_id"], _iso(now))
        raise AuthServiceError(400, "OTP has expired; request a new code")
    if challenge["attempts_remaining"] <= 0:
        _consume_challenge(challenge["challenge_id"], _iso(now))
        raise AuthServiceError(400, "OTP attempts are exhausted; request a new code")

    if not re.fullmatch(r"\d{6}", otp) or not hmac.compare_digest(
        challenge["code_hash"],
        _challenge_digest(challenge["challenge_id"], otp),
    ):
        with engine.begin() as conn:
            conn.execute(text("""
                UPDATE employee_auth_challenges
                SET attempts_remaining = attempts_remaining - 1,
                    consumed_at = CASE WHEN attempts_remaining <= 1 THEN :now ELSE consumed_at END
                WHERE challenge_id = :challenge_id AND consumed_at IS NULL
            """), {"now": _iso(now), "challenge_id": challenge["challenge_id"]})
        raise AuthServiceError(400, "OTP is incorrect")


def verify_signup_otp(email: str, challenge_id: str, otp: str) -> Dict[str, Any]:
    email = _valid_email(email)
    challenge = _get_challenge(challenge_id, email, "signup")
    if challenge is None:
        raise AuthServiceError(400, "OTP challenge is invalid or already used")
    _verify_challenge_code(challenge, otp)

    now = _iso(_now())
    try:
        with engine.begin() as conn:
            consumed = conn.execute(text("""
                UPDATE employee_auth_challenges SET consumed_at = :now
                WHERE challenge_id = :challenge_id AND consumed_at IS NULL
            """), {"now": now, "challenge_id": challenge_id})
            if consumed.rowcount != 1:
                raise AuthServiceError(400, "OTP challenge is invalid or already used")
            conn.execute(text("""
                INSERT INTO employee_accounts
                    (full_name, official_email, job_title, password_hash, role, department,
                     approval_status, created_at)
                VALUES (:full_name, :email, :job_title, :password_hash, :role, :department,
                        :approval_status, :created_at)
            """), {
                "full_name": challenge["full_name"],
                "email": email,
                "job_title": challenge["job_title"],
                "password_hash": challenge["password_hash"],
                "role": challenge["role"],
                "department": challenge["department"],
                "approval_status": (
                    "approved"
                    if challenge["role"] == "admin" and _is_bootstrap_admin(email)
                    else "pending"
                ),
                "created_at": now,
            })
    except IntegrityError as error:
        raise AuthServiceError(409, "An account with this email already exists") from error

    account = {
        "official_email": email,
        "full_name": challenge["full_name"],
        "job_title": challenge["job_title"],
        "role": challenge["role"],
        "department": challenge["department"],
    }
    if challenge["role"] == "admin" and _is_bootstrap_admin(email):
        return {"status": "success", "access_token": _make_access_token(account), "user": account}
    return {
        "status": "pending_approval",
        "message": "Your account request has been sent to an administrator. You can sign in after it is approved.",
    }


def login(email: str, password: str, role: str, department: str) -> Dict[str, Any]:
    email = _valid_email(email)
    role, department = _validate_account_type(role, department)
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT full_name, official_email, job_title, password_hash, role, department, approval_status
            FROM employee_accounts WHERE official_email = :email
        """), {"email": email}).mappings().first()
    if (
        row is None
        or not _verify_password(password, row["password_hash"])
        or row["role"] != role
        or (row["role"] != "admin" and row["department"] != department)
    ):
        raise AuthServiceError(401, "Email or password is incorrect")
    if row["approval_status"] != "approved":
        if row["approval_status"] == "pending":
            raise AuthServiceError(403, "Your account request is awaiting administrator approval")
        raise AuthServiceError(403, "Your account has not been approved for system access")

    account = {
        "official_email": row["official_email"],
        "full_name": row["full_name"],
        "job_title": row["job_title"],
        "role": row["role"],
        "department": department,
    }
    return {"status": "success", "access_token": _make_access_token(account), "user": account}


def list_accounts() -> list[Dict[str, Any]]:
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT id, full_name, official_email, role, department, approval_status
            FROM employee_accounts
            ORDER BY created_at ASC, id ASC
        """)).mappings().all()
    return [dict(row) for row in rows]


def approve_account(account_id: int) -> None:
    with engine.begin() as conn:
        result = conn.execute(text("""
            UPDATE employee_accounts
            SET approval_status = 'approved'
            WHERE id = :account_id AND approval_status = 'pending'
        """), {"account_id": account_id})
        if result.rowcount == 1:
            return
        account = conn.execute(text("""
            SELECT approval_status FROM employee_accounts WHERE id = :account_id
        """), {"account_id": account_id}).first()
    if account is None:
        raise AuthServiceError(404, "Account request was not found")
    raise AuthServiceError(409, "Account request is no longer pending")


def verify_reset_otp(email: str, challenge_id: str, otp: str) -> Dict[str, Any]:
    email = _valid_email(email)
    challenge = _get_challenge(challenge_id, email, "reset")
    if challenge is None:
        raise AuthServiceError(400, "OTP challenge is invalid or already used")
    _verify_challenge_code(challenge, otp)

    now = _now()
    token_id = secrets.token_urlsafe(24)
    with engine.begin() as conn:
        consumed = conn.execute(text("""
            UPDATE employee_auth_challenges SET consumed_at = :now
            WHERE challenge_id = :challenge_id AND consumed_at IS NULL
        """), {"now": _iso(now), "challenge_id": challenge_id})
        if consumed.rowcount != 1:
            raise AuthServiceError(400, "OTP challenge is invalid or already used")
        conn.execute(text("""
            INSERT INTO employee_password_reset_grants (token_id, email, expires_at, used_at)
            VALUES (:token_id, :email, :expires_at, NULL)
        """), {
            "token_id": token_id,
            "email": email,
            "expires_at": _iso(now + timedelta(minutes=10)),
        })

    reset_token = _make_token({
        "sub": email,
        "purpose": "password_reset",
        "jti": token_id,
    }, timedelta(minutes=10))
    return {"status": "success", "reset_token": reset_token}


def reset_password(reset_token: str, new_password: str) -> Dict[str, str]:
    _validate_password(new_password)
    try:
        claims = jwt.decode(reset_token, _jwt_secret(), algorithms=["HS256"])
    except InvalidTokenError as error:
        raise AuthServiceError(400, "Password reset session is invalid or expired") from error
    if claims.get("purpose") != "password_reset":
        raise AuthServiceError(400, "Password reset session is invalid")

    email = _valid_email(str(claims.get("sub", "")))
    token_id = str(claims.get("jti", ""))
    now = _now()
    with engine.begin() as conn:
        grant = conn.execute(text("""
            SELECT email, expires_at, used_at
            FROM employee_password_reset_grants WHERE token_id = :token_id
        """), {"token_id": token_id}).mappings().first()
        if grant is None or grant["email"] != email or grant["used_at"] is not None:
            raise AuthServiceError(400, "Password reset session is invalid or already used")
        if datetime.fromisoformat(grant["expires_at"]) <= now:
            conn.execute(text("""
                UPDATE employee_password_reset_grants SET used_at = :now
                WHERE token_id = :token_id
            """), {"now": _iso(now), "token_id": token_id})
            raise AuthServiceError(400, "Password reset session has expired")

        conn.execute(text("""
            UPDATE employee_accounts
            SET password_hash = :password_hash
            WHERE official_email = :email
        """), {
            "password_hash": _hash_password(new_password),
            "email": email,
        })
        used = conn.execute(text("""
            UPDATE employee_password_reset_grants SET used_at = :now
            WHERE token_id = :token_id AND used_at IS NULL
        """), {"now": _iso(now), "token_id": token_id})
        if used.rowcount != 1:
            raise AuthServiceError(400, "Password reset session is invalid or already used")
    return {"status": "success", "message": "Password updated. Sign in with your new password."}
