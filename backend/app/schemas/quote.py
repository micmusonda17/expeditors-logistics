from datetime import date
from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import CamelModel, UTCDateTime, phone_digits

QuoteStatus = Literal["new", "quoted", "won", "lost"]
Currency = Literal["ZMW", "USD", "ZAR"]


# Schemas describe the JSON that goes in and out of the API. Models (app/models) describe the
# database. Keeping them separate means the API never exposes a column by accident.


class QuoteCreate(CamelModel):
    """Sent by the public quote form. FastAPI rejects a request that breaks these rules."""

    service: str = Field("One-off load", max_length=60)
    name: str = Field(min_length=2, max_length=120)
    company: str = Field("", max_length=120)
    phone: str = Field(max_length=40)
    email: EmailStr | None = None
    pickup: str = Field(min_length=2, max_length=120)
    delivery: str = Field(min_length=2, max_length=120)
    cargo: str = Field(min_length=1, max_length=80)
    weight: float | None = Field(None, gt=0, le=200)
    truck: str = Field("", max_length=60)
    load_date: date | None = None
    notes: str = Field("", max_length=2000)
    website: str = Field("", max_length=200, description="Honeypot. Real visitors never fill this in.")

    _phone = field_validator("phone")(phone_digits)

    @field_validator("email", mode="before")
    @classmethod
    def _blank_email(cls, v: object) -> object:
        return None if v == "" else v


# What the customer gets back after sending the form.
class QuoteReceipt(CamelModel):
    ref: str
    km: int
    from_hub: str
    to_hub: str


# What the staff portal gets for each quote.
class QuoteOut(CamelModel):
    id: int
    ref: str
    service: str
    name: str
    company: str
    phone: str
    email: str
    pickup: str
    delivery: str
    from_hub: str
    to_hub: str
    km: int
    cargo: str
    weight: float | None
    truck: str
    load_date: date | None
    notes: str
    status: QuoteStatus
    rate: float | None
    currency: str
    internal_notes: str
    load_ref: str | None
    source: str
    created_at: UTCDateTime
    updated_at: UTCDateTime


class QuotePatch(CamelModel):
    status: QuoteStatus | None = None
    rate: float | None = Field(None, ge=0)
    currency: Currency | None = None
    internal_notes: str | None = Field(None, max_length=4000)
