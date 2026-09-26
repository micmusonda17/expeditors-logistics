from tests.conftest import STAFF_EMAIL


def test_login_rejects_wrong_password(client):
    res = client.post("/api/auth/login", json={"email": STAFF_EMAIL, "password": "nope"})
    assert res.status_code == 401


def test_login_is_case_insensitive_and_returns_user(client, auth):
    res = client.get("/api/auth/me", headers=auth)
    assert res.status_code == 200
    assert res.json()["email"] == STAFF_EMAIL


def test_staff_endpoints_need_a_token(client):
    for path in ("/api/quotes", "/api/loads", "/api/auth/me"):
        assert client.get(path).status_code == 401
    assert client.get("/api/quotes", headers={"Authorization": "Bearer not-a-token"}).status_code == 401
