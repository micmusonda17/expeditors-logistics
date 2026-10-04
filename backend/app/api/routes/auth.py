from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.api.deps import DbSession, StaffUser
from app.core.security import create_access_token, verify_password
from app.models import User
from app.schemas.auth import LoginIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: DbSession) -> TokenOut:
    # Find the staff member by email (not case sensitive) and check the password against the stored hash.
    user = db.scalar(select(User).where(func.lower(User.email) == body.email.lower()))
    if user is None or not user.is_active or not verify_password(body.password, user.password_hash):
        # Same message for a wrong email or a wrong password, so nobody can test which emails exist.
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Email or password is incorrect.")
    # Signed in: send back a token. The portal sends it with every staff request after this.
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: StaffUser) -> User:
    # The portal calls this on load to check whether its saved token is still valid.
    return user
