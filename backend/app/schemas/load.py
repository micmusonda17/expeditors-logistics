from datetime import date
from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import CamelModel, UTCDateTime, phone_digits

Stage = Literal["Booked", "Loaded", "In transit", "At border", "Delivered"]
Currency = Literal["ZMW", "USD", "ZAR"]


def _blank_to_none(v: object) -> object:
    return None if v == "" else v


class LoadCreate(CamelModel):
    from_hub: str
    to_hub: str
    customer: str = Field(min_length=1, max_length=120)
    customer_phone: str = Field(max_length=40)
    customer_email: EmailStr | None = None
    cargo: str = Field(min_length=1, max_length=120)
    weight: float | None = Field(None, ge=0, le=200)
    truck_type: str = Field("", max_length=60)
    truck_reg: str = Field("", max_length=40)
    driver: str = Field("", max_length=120)
    driver_phone: str = Field("", max_length=40)
    load_date: date | None = None
    eta: date | None = None
    rate: float | None = Field(None, ge=0)
    currency: Currency = "ZMW"
    notes: str = Field("", max_length=4000)
    quote_id: int | None = None

    _phone = field_validator("customer_phone")(phone_digits)
    _blanks = field_validator("customer_email", "load_date", "eta", "rate", "weight", mode="before")(
        _blank_to_none
    )


class LoadPatch(CamelModel):
    customer: str | None = Field(None, min_length=1, max_length=120)
    customer_phone: str | None = Field(None, max_length=40)
    customer_email: EmailStr | None = None
    cargo: str | None = Field(None, min_length=1, max_length=120)
    weight: float | None = Field(None, ge=0, le=200)
    truck_type: str | None = Field(None, max_length=60)
    truck_reg: str | None = Field(None, max_length=40)
    driver: str | None = Field(None, max_length=120)
    driver_phone: str | None = Field(None, max_length=40)
    load_date: date | None = None
    eta: date | None = None
    rate: float | None = Field(None, ge=0)
    currency: Currency | None = None
    notes: str | None = Field(None, max_length=4000)
    public_note: str | None = Field(None, max_length=500)

    _blanks = field_validator("customer_email", "load_date", "eta", "rate", "weight", mode="before")(
        _blank_to_none
    )


class EventCreate(CamelModel):
    status: Stage
    at: str = Field("", max_length=40, description="Hub or border key from shared/network.json")
    location: str = Field("", max_length=160, description="Free text when the place is not on the map")
    note: str = Field("", max_length=500)
    eta: date | None = None

    _blanks = field_validator("eta", mode="before")(_blank_to_none)


class EventOut(CamelModel):
    status: str
    at: str
    location: str
    note: str
    created_at: UTCDateTime


class LoadOut(CamelModel):
    id: int
    ref: str
    quote_id: int | None
    customer: str
    customer_phone: str
    customer_email: str
    cargo: str
    weight: float | None
    truck_type: str
    truck_reg: str
    driver: str
    driver_phone: str
    load_date: date | None
    rate: float | None
    currency: str
    notes: str
    origin: str
    destination: str
    from_hub: str
    to_hub: str
    status: str
    at: str
    location: str
    eta: date | None
    public_note: str
    created_at: UTCDateTime
    updated_at: UTCDateTime
    events: list[EventOut]


class TrackingOut(CamelModel):
    """What a customer sees. No customer, driver or money fields."""

    ref: str
    origin: str
    destination: str
    from_hub: str
    to_hub: str
    status: str
    at: str
    location: str
    eta: date | None
    note: str
    updated_at: UTCDateTime
    events: list[EventOut]
