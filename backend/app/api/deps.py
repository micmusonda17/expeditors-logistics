"""Shared FastAPI dependencies.

A dependency is something an endpoint asks for in its parameters, such as a database session
or the signed-in staff member. FastAPI creates it for each request and passes it in.
"""

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

# A database session for this request. It is closed automatically when the request ends.
DbSession = Annotated[Session, Depends(get_db)]
# The road network (towns, roads, distances) loaded from shared/network.json.
NetworkDep = Annotated[Network, Depends(get_network)]

# Reads the "Authorization: Bearer <token>" header that the portal sends with each request.
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
    # 1. No token sent at all: not signed in.
    if creds is None:
        raise unauthorized
    # 2. Check the token's signature and expiry, and read the user id stored inside it.
    user_id = decode_access_token(creds.credentials)
    if user_id is None or not user_id.isdigit():
        raise unauthorized
    # 3. The user must still exist and still be allowed in.
    user = db.get(User, int(user_id))
    if user is None or not user.is_active:
        raise unauthorized
    return user


# Adding a `StaffUser` parameter to an endpoint makes it staff only (the padlock on /api/docs).
StaffUser = Annotated[User, Depends(get_current_user)]

# Rate limits stop one visitor (one IP address) from flooding the quote form.
_settings = get_settings()
quote_limiter = RateLimiter(_settings.quote_rate_limit, _settings.quote_rate_window_seconds)


def limit_quotes(request: Request) -> None:
    quote_limiter.check(client_ip(request))


# Reviews: a few per visitor per hour is plenty for real customers.
review_limiter = RateLimiter(3, 3600)


def limit_reviews(request: Request) -> None:
    review_limiter.check(client_ip(request))
