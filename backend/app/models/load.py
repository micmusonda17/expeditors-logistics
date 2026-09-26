from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, utcnow

LOAD_STAGES = ("Booked", "Loaded", "In transit", "At border", "Delivered")


class Load(TimestampMixin, Base):
    """A booked load. Customers follow it on the website with its ELL- reference."""

    __tablename__ = "loads"

    id: Mapped[int] = mapped_column(primary_key=True)
    ref: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    quote_id: Mapped[int | None] = mapped_column(ForeignKey("quotes.id", ondelete="SET NULL"), nullable=True)

    # Private: customer, driver, money. Never exposed on public tracking.
    customer: Mapped[str] = mapped_column(String(120))
    customer_phone: Mapped[str] = mapped_column(String(40))
    customer_email: Mapped[str] = mapped_column(String(254), default="")
    cargo: Mapped[str] = mapped_column(String(120))
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    truck_type: Mapped[str] = mapped_column(String(60), default="")
    truck_reg: Mapped[str] = mapped_column(String(40), default="")
    driver: Mapped[str] = mapped_column(String(120), default="")
    driver_phone: Mapped[str] = mapped_column(String(40), default="")
    load_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    rate: Mapped[float | None] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="ZMW")
    notes: Mapped[str] = mapped_column(Text, default="")

    # Public: route and progress, shown on the tracking page.
    origin: Mapped[str] = mapped_column(String(120))
    destination: Mapped[str] = mapped_column(String(120))
    from_hub: Mapped[str] = mapped_column(String(40))
    to_hub: Mapped[str] = mapped_column(String(40))
    status: Mapped[str] = mapped_column(String(20), default="Booked", index=True)
    at: Mapped[str] = mapped_column(String(40), default="")
    location: Mapped[str] = mapped_column(String(160), default="")
    eta: Mapped[date | None] = mapped_column(Date, nullable=True)
    public_note: Mapped[str] = mapped_column(Text, default="")

    events: Mapped[list["LoadEvent"]] = relationship(
        back_populates="load", cascade="all, delete-orphan", order_by="LoadEvent.created_at"
    )


class LoadEvent(Base):
    """One status update in a load's timeline."""

    __tablename__ = "load_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    load_id: Mapped[int] = mapped_column(ForeignKey("loads.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20))
    at: Mapped[str] = mapped_column(String(40), default="")
    location: Mapped[str] = mapped_column(String(160), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    load: Mapped[Load] = relationship(back_populates="events")
