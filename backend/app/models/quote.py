from datetime import date

from sqlalchemy import Date, Float, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

QUOTE_STATUSES = ("new", "quoted", "won", "lost")


class Quote(TimestampMixin, Base):
    """A quote request sent from the website.

    This class is the `quotes` table: each attribute below is a column. SQLAlchemy turns
    Python objects of this class into rows and back. Changes to the table go through an
    Alembic migration in backend/alembic/versions.
    """

    __tablename__ = "quotes"

    id: Mapped[int] = mapped_column(primary_key=True)
    ref: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    service: Mapped[str] = mapped_column(String(60), default="One-off load")

    # Customer
    name: Mapped[str] = mapped_column(String(120))
    company: Mapped[str] = mapped_column(String(120), default="")
    phone: Mapped[str] = mapped_column(String(40))
    email: Mapped[str] = mapped_column(String(254), default="")

    # Load
    pickup: Mapped[str] = mapped_column(String(120))
    delivery: Mapped[str] = mapped_column(String(120))
    from_hub: Mapped[str] = mapped_column(String(40), default="")
    to_hub: Mapped[str] = mapped_column(String(40), default="")
    km: Mapped[int] = mapped_column(Integer, default=0)
    cargo: Mapped[str] = mapped_column(String(80))
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    truck: Mapped[str] = mapped_column(String(60), default="")
    load_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str] = mapped_column(Text, default="")

    # Handling by the team
    status: Mapped[str] = mapped_column(String(12), default="new", index=True)
    rate: Mapped[float | None] = mapped_column(Numeric(12, 2, asdecimal=False), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="ZMW")
    internal_notes: Mapped[str] = mapped_column(Text, default="")
    load_ref: Mapped[str | None] = mapped_column(String(20), nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="website")
