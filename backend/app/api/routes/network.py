from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import NetworkDep
from app.schemas.network import RouteOut

router = APIRouter(prefix="/network", tags=["network"])


@router.get("/route", response_model=RouteOut, summary="Shortest road route between two towns")
def route(net: NetworkDep, from_: str = Query(alias="from"), to: str = Query()) -> RouteOut:
    a, b = net.match_hub(from_) or from_, net.match_hub(to) or to
    r = net.shortest(a, b)
    if r is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No route between those towns.")
    return RouteOut(
        from_hub=a, to_hub=b, km=r.km, nodes=r.nodes, borders=net.borders_on(r), stops=net.stops(r)
    )
