import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import quote_limiter, review_limiter
from app.core.security import hash_password
from app.db.session import get_db
from app.main import create_app
from app.models import Base, User

STAFF_EMAIL = "staff@example.com"
STAFF_PASSWORD = "correct-horse-battery"


@pytest.fixture()
def session_factory():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with factory() as db:
        db.add(User(email=STAFF_EMAIL, name="Staff Member", password_hash=hash_password(STAFF_PASSWORD)))
        db.commit()
    yield factory
    engine.dispose()


@pytest.fixture()
def client(session_factory):
    app = create_app()

    def override():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override
    quote_limiter.reset()
    review_limiter.reset()
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def auth(client):
    res = client.post("/api/auth/login", json={"email": STAFF_EMAIL, "password": STAFF_PASSWORD})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['accessToken']}"}


@pytest.fixture()
def quote_payload():
    return {
        "service": "One-off load",
        "name": "Chanda Mwila",
        "company": "Mwila Poultry",
        "phone": "+260 97 000 0101",
        "email": "orders@example.com",
        "pickup": "Lusaka, Zambia",
        "delivery": "Kitwe",
        "cargo": "Chilled or frozen food",
        "weight": 5,
        "truck": "Refrigerated truck (3 to 5 t)",
        "notes": "Frozen chicken",
    }
