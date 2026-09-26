"""Shared FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.ratelimit import RateLimiter, client_ip
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User
from app.services.network import Network, get_network

DbSession = Annotated[Session, Depends(get_db)]
NetworkDep = Annotated[Network, Depends(get_network)]

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    db: DbSession,
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sign in to continue.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if creds is None:
        raise unauthorized
    user_id = decode_access_token(creds.credentials)
    if user_id is None or not user_id.isdigit():
        raise unauthorized
    user = db.get(User, int(user_id))
    if user is None or not user.is_active:
        raise unauthorized
    return user


StaffUser = Annotated[User, Depends(get_current_user)]

_settings = get_settings()
quote_limiter = RateLimiter(_settings.quote_rate_limit, _settings.quote_rate_window_seconds)


def limit_quotes(request: Request) -> None:
    quote_limiter.check(client_ip(request))


# Reviews: a few per visitor per hour is plenty for real customers.
review_limiter = RateLimiter(3, 3600)


def limit_reviews(request: Request) -> None:
    review_limiter.check(client_ip(request))
