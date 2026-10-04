"""Password hashing and JSON Web Tokens for staff sign-in."""

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.core.config import get_settings

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    # bcrypt scrambles the password with a random salt. Only this hash is stored, never the password.
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    # Hashes the password typed at sign-in the same way and compares it with the stored hash.
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(subject: str | int, minutes: int | None = None) -> str:
    # A JWT is a signed note that says "this is user 3, valid until ...". The server signs it
    # with SECRET_KEY, so nobody can change it without the signature breaking.
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": now + timedelta(minutes=minutes or settings.access_token_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    # Returns the user id if the signature is valid and the token has not expired, otherwise None.
    try:
        payload = jwt.decode(token, get_settings().secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    return payload.get("sub")
