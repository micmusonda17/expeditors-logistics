from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select

from app.api.deps import DbSession, StaffUser, limit_reviews
from app.models import Review
from app.schemas.review import ReviewCreate, ReviewList, ReviewOut, ReviewPatch, ReviewPublic, ReviewStatus

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=ReviewList, summary="Approved reviews and the average rating (public)")
def public_reviews(db: DbSession, limit: int = Query(50, le=200)) -> ReviewList:
    approved = Review.status == "approved"
    count, average = db.execute(select(func.count(Review.id), func.avg(Review.rating)).where(approved)).one()
    rows = db.scalars(select(Review).where(approved).order_by(Review.created_at.desc()).limit(limit))
    return ReviewList(
        average=round(float(average), 1) if average is not None else None,
        count=count,
        reviews=[ReviewPublic.model_validate(r) for r in rows],
    )


@router.post(
    "",
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[Depends(limit_reviews)],
    summary="Leave a review (public, shown after approval)",
)
def create_review(body: ReviewCreate, db: DbSession) -> dict[str, str]:
    if not body.website:  # honeypot filled in: pretend it worked, store nothing
        db.add(Review(**body.model_dump(exclude={"website"})))
        db.commit()
    return {"status": "pending"}


@router.get("/all", response_model=list[ReviewOut], summary="Every review, for moderation (staff)")
def all_reviews(
    db: DbSession,
    _: StaffUser,
    status_filter: ReviewStatus | None = Query(None, alias="status"),
) -> list[Review]:
    stmt = select(Review).order_by(Review.created_at.desc())
    if status_filter:
        stmt = stmt.where(Review.status == status_filter)
    return list(db.scalars(stmt))


def _get(db: DbSession, review_id: int) -> Review:
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Review not found.")
    return review


@router.patch("/{review_id}", response_model=ReviewOut, summary="Approve or hide a review (staff)")
def update_review(review_id: int, body: ReviewPatch, db: DbSession, _: StaffUser) -> Review:
    review = _get(db, review_id)
    review.status = body.status
    db.commit()
    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a review (staff)")
def delete_review(review_id: int, db: DbSession, _: StaffUser) -> Response:
    db.delete(_get(db, review_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
