from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession
from app.models import Load
from app.schemas.load import EventOut, TrackingOut

router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.get("/{ref}", response_model=TrackingOut, summary="Track a load by reference (public)")
def track(ref: str, db: DbSession) -> TrackingOut:
    # Public: no login needed. Customers only need their reference, e.g. ELL-7K3Q9.
    clean = "".join(ref.split()).upper()
    # Load the shipment and all its status updates in one query.
    load = db.scalar(select(Load).options(selectinload(Load.events)).where(Load.ref == clean))
    if load is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No load with that reference.")
    # Only send what the customer should see. Rates, driver details and internal notes stay private.
    return TrackingOut(
        ref=load.ref,
        origin=load.origin,
        destination=load.destination,
        from_hub=load.from_hub,
        to_hub=load.to_hub,
        status=load.status,
        at=load.at,
        location=load.location,
        eta=load.eta,
        note=load.public_note,
        updated_at=load.updated_at,
        events=[EventOut.model_validate(e) for e in load.events],
    )
