from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import or_, select

from app.api.deps import DbSession, NetworkDep, StaffUser, limit_quotes
from app.models import Quote
from app.schemas.quote import QuoteCreate, QuoteOut, QuotePatch, QuoteReceipt, QuoteStatus
from app.services.notify import send_quote_email
from app.services.refs import new_quote_ref

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.post(
    "",
    response_model=QuoteReceipt,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(limit_quotes)],
    summary="Submit a quote request (public)",
)
def create_quote(body: QuoteCreate, db: DbSession, net: NetworkDep, tasks: BackgroundTasks) -> QuoteReceipt:
    from_hub = net.match_hub(body.pickup) or ""
    to_hub = net.match_hub(body.delivery) or ""
    route = net.shortest(from_hub, to_hub) if from_hub and to_hub else None
    km = route.km if route else 0

    if body.website:
        # Honeypot filled in: almost certainly a bot. Pretend it worked, store nothing.
        return QuoteReceipt(ref=new_quote_ref(), km=km, from_hub=from_hub, to_hub=to_hub)

    ref = new_quote_ref()
    while db.scalar(select(Quote.id).where(Quote.ref == ref)):
        ref = new_quote_ref()

    quote = Quote(
        ref=ref,
        **body.model_dump(exclude={"website", "email"}),
        email=body.email or "",
        from_hub=from_hub,
        to_hub=to_hub,
        km=km,
    )
    db.add(quote)
    db.commit()
    tasks.add_task(send_quote_email, quote)
    return QuoteReceipt(ref=ref, km=km, from_hub=from_hub, to_hub=to_hub)


@router.get("", response_model=list[QuoteOut], summary="List quote requests (staff)")
def list_quotes(
    db: DbSession,
    _: StaffUser,
    status_filter: QuoteStatus | None = Query(None, alias="status"),
    search: str | None = Query(None, max_length=100),
    limit: int = Query(500, le=2000),
) -> list[Quote]:
    stmt = select(Quote).order_by(Quote.created_at.desc()).limit(limit)
    if status_filter:
        stmt = stmt.where(Quote.status == status_filter)
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                *(
                    col.ilike(like)
                    for col in (
                        Quote.ref,
                        Quote.name,
                        Quote.company,
                        Quote.phone,
                        Quote.pickup,
                        Quote.delivery,
                        Quote.cargo,
                    )
                )
            )
        )
    return list(db.scalars(stmt))


def _get(db: DbSession, quote_id: int) -> Quote:
    quote = db.get(Quote, quote_id)
    if quote is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Quote not found.")
    return quote


@router.get("/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: int, db: DbSession, _: StaffUser) -> Quote:
    return _get(db, quote_id)


@router.patch("/{quote_id}", response_model=QuoteOut)
def update_quote(quote_id: int, body: QuotePatch, db: DbSession, _: StaffUser) -> Quote:
    quote = _get(db, quote_id)
    changes = body.model_dump(exclude_unset=True)
    for key, value in changes.items():
        if key == "internal_notes" and value is None:
            value = ""
        setattr(quote, key, value)
    # Setting a rate on a fresh request moves it to "quoted" unless a status was chosen explicitly.
    if changes.get("rate") and "status" not in changes and quote.status == "new":
        quote.status = "quoted"
    db.commit()
    return quote
