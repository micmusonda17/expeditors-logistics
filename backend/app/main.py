"""FastAPI application: public website API and the staff operations API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes import auth, loads, network, quotes, reviews, tracking
from app.core.config import get_settings
from app.db.session import SessionLocal


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url=None,
        openapi_url="/api/openapi.json",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    for router in (auth.router, quotes.router, loads.router, reviews.router, tracking.router, network.router):
        app.include_router(router, prefix="/api")

    @app.get("/api/health", tags=["health"])
    def health() -> dict[str, str]:
        try:
            with SessionLocal() as db:
                db.execute(text("select 1"))
            database = "ok"
        except Exception:  # noqa: BLE001
            database = "unavailable"
        return {"status": "ok", "database": database}

    return app


app = create_app()
