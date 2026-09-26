from pydantic import Field

from app.schemas.common import CamelModel


class LoginIn(CamelModel):
    email: str = Field(min_length=3, max_length=254)
    password: str


class UserOut(CamelModel):
    id: int
    email: str
    name: str


class TokenOut(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
