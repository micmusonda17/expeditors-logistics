from sqlalchemy import SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

REVIEW_STATUSES = ("pending", "approved", "hidden")


class Review(TimestampMixin, Base):
    """A customer review. Only approved reviews are shown on the website."""

    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    company: Mapped[str] = mapped_column(String(120), default="")
    town: Mapped[str] = mapped_column(String(80), default="")
    rating: Mapped[int] = mapped_column(SmallInteger)
    comment: Mapped[str] = mapped_column(Text)
    # Private: lets the team confirm the reviewer is a real customer. Never shown publicly.
    contact: Mapped[str] = mapped_column(String(254), default="")
    load_ref: Mapped[str] = mapped_column(String(20), default="")
    status: Mapped[str] = mapped_column(String(12), default="pending", index=True)
