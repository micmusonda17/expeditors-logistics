from app.schemas.common import CamelModel


class RouteOut(CamelModel):
    from_hub: str
    to_hub: str
    km: int
    nodes: list[str]
    borders: list[str]
    stops: list[str]
