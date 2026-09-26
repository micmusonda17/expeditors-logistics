from typing import Literal

from pydantic import Field

from app.schemas.common import CamelModel, UTCDateTime

ReviewStatus = Literal["pending", "approved", "hidden"]


class ReviewCreate(CamelModel):
    """Sent by the public review form. New reviews wait for the team to approve them."""

    name: str = Field(min_length=2, max_length=120)
    company: str = Field("", max_length=120)
    town: str = Field("", max_length=80)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10, max_length=1500)
    contact: str = Field("", max_length=254, description="Phone or email, kept private.")
    load_ref: str = Field("", max_length=20)
    website: str = Field("", max_length=200, description="Honeypot. Real visitors never fill this in.")


class ReviewPublic(CamelModel):
    id: int
    name: str
    company: str
    town: str
    rating: int
    comment: str
    created_at: UTCDateTime


class ReviewList(CamelModel):
    average: float | None
    count: int
    reviews: list[ReviewPublic]


class ReviewOut(ReviewPublic):
    contact: str
    load_ref: str
    status: ReviewStatus
    updated_at: UTCDateTime


class ReviewPatch(CamelModel):
    status: ReviewStatus
