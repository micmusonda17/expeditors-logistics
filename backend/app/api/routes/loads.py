from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, NetworkDep, StaffUser
from app.models import Load, LoadEvent, Quote
from app.schemas.load import EventCreate, LoadCreate, LoadOut, LoadPatch
from app.services.refs import new_load_ref

router = APIRouter(prefix="/loads", tags=["loads"])


def _get(db: DbSession, ref: str) -> Load:
    load = db.scalar(select(Load).options(selectinload(Load.events)).where(Load.ref == ref.upper()))
    if load is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Load not found.")
    return load


@router.get("", response_model=list[LoadOut], summary="List loads (staff)")
def list_loads(
    db: DbSession,
    _: StaffUser,
    stage: str = Query("all", description="all, active, or a stage such as 'In transit'"),
    search: str | None = Query(None, max_length=100),
) -> list[Load]:
    stmt = select(Load).options(selectinload(Load.events)).order_by(Load.updated_at.desc())
    if stage == "active":
        stmt = stmt.where(Load.status != "Delivered")
    elif stage != "all":
        stmt = stmt.where(Load.status == stage)
    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                *(
                    col.ilike(like)
                    for col in (
                        Load.ref,
                        Load.customer,
                        Load.origin,
                        Load.destination,
                        Load.driver,
                        Load.truck_reg,
                        Load.location,
                    )
                )
            )
        )
    return list(db.scalars(stmt))


@router.post("", response_model=LoadOut, status_code=status.HTTP_201_CREATED, summary="Book a load (staff)")
def create_load(body: LoadCreate, db: DbSession, net: NetworkDep, _: StaffUser) -> Load:
    if not net.is_hub(body.from_hub) or not net.is_hub(body.to_hub):
        raise HTTPException(422, detail="Pick the route towns from the list.")
    if body.from_hub == body.to_hub:
        raise HTTPException(422, detail="Pick two different towns.")

    ref = new_load_ref()
    while db.scalar(select(Load.id).where(Load.ref == ref)):
        ref = new_load_ref()

    first_note = f"Loading {body.load_date:%a %d %b %Y}" if body.load_date else ""
    load = Load(
        ref=ref,
        **body.model_dump(exclude={"customer_email"}),
        customer_email=body.customer_email or "",
        origin=net.hub_label(body.from_hub),
        destination=net.hub_label(body.to_hub),
        status="Booked",
        at=body.from_hub,
        location=net.place_name(body.from_hub),
    )
    load.events.append(LoadEvent(status="Booked", at=body.from_hub, location=load.location, note=first_note))
    db.add(load)

    if body.quote_id:
        quote = db.get(Quote, body.quote_id)
        if quote is not None:
            quote.status = "won"
            quote.load_ref = ref
    db.commit()
    return _get(db, ref)


@router.get("/{ref}", response_model=LoadOut)
def get_load(ref: str, db: DbSession, _: StaffUser) -> Load:
    return _get(db, ref)


@router.patch("/{ref}", response_model=LoadOut)
def update_load(ref: str, body: LoadPatch, db: DbSession, _: StaffUser) -> Load:
    load = _get(db, ref)
    for key, value in body.model_dump(exclude_unset=True).items():
        if value is None and key in {
            "customer_email",
            "truck_type",
            "truck_reg",
            "driver",
            "driver_phone",
            "notes",
            "public_note",
        }:
            value = ""
        if value is None and key in {"customer", "customer_phone", "cargo", "currency"}:
            continue
        setattr(load, key, value)
    db.commit()
    return _get(db, ref)


@router.post("/{ref}/events", response_model=LoadOut, summary="Post a status update (staff)")
def add_event(ref: str, body: EventCreate, db: DbSession, net: NetworkDep, _: StaffUser) -> Load:
    load = _get(db, ref)
    at = body.at if net.is_place(body.at) else ""
    location = body.location or (net.place_name(at) if at else "")
    if not location:
        raise HTTPException(422, detail="Say where the truck is.")
    load.events.append(LoadEvent(status=body.status, at=at, location=location, note=body.note))
    load.status = body.status
    load.at = at
    load.location = location
    load.public_note = body.note
    if body.eta:
        load.eta = body.eta
    db.commit()
    return _get(db, ref)


@router.delete("/{ref}", status_code=status.HTTP_204_NO_CONTENT)
def delete_load(ref: str, db: DbSession, _: StaffUser) -> Response:
    load = _get(db, ref)
    for quote in db.scalars(select(Quote).where(Quote.load_ref == load.ref)):
        quote.load_ref = None
    db.delete(load)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
