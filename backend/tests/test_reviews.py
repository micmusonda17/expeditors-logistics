from app.api.deps import review_limiter

REVIEW = {
    "name": "Grace Phiri",
    "company": "Phiri General Dealers",
    "town": "Chipata",
    "rating": 5,
    "comment": "Groceries arrived on time and in perfect condition.",
    "contact": "+260 95 000 0404",
}


def test_new_review_waits_for_approval(client, auth):
    assert client.post("/api/reviews", json=REVIEW).status_code == 202
    public = client.get("/api/reviews").json()
    assert public == {"average": None, "count": 0, "reviews": []}

    pending = client.get("/api/reviews/all?status=pending", headers=auth).json()
    assert len(pending) == 1 and pending[0]["contact"] == "+260 95 000 0404"

    rid = pending[0]["id"]
    assert client.patch(f"/api/reviews/{rid}", json={"status": "approved"}, headers=auth).status_code == 200
    public = client.get("/api/reviews").json()
    assert public["count"] == 1 and public["average"] == 5.0
    shown = public["reviews"][0]
    assert shown["name"] == "Grace Phiri" and "contact" not in shown and "status" not in shown


def test_average_counts_only_approved(client, auth):
    client.post("/api/reviews", json=REVIEW)
    client.post("/api/reviews", json={**REVIEW, "name": "Joseph Banda", "rating": 3})
    client.post("/api/reviews", json={**REVIEW, "name": "Spam Person", "rating": 1})
    ids = {r["name"]: r["id"] for r in client.get("/api/reviews/all", headers=auth).json()}
    for name in ("Grace Phiri", "Joseph Banda"):
        client.patch(f"/api/reviews/{ids[name]}", json={"status": "approved"}, headers=auth)
    client.patch(f"/api/reviews/{ids['Spam Person']}", json={"status": "hidden"}, headers=auth)
    public = client.get("/api/reviews").json()
    assert public["count"] == 2 and public["average"] == 4.0


def test_validation_and_honeypot(client, auth):
    bad = client.post("/api/reviews", json={**REVIEW, "rating": 6, "comment": "short"})
    assert bad.status_code == 422
    assert {e["loc"][-1] for e in bad.json()["detail"]} >= {"rating", "comment"}
    assert client.post("/api/reviews", json={**REVIEW, "website": "http://spam"}).status_code == 202
    assert client.get("/api/reviews/all", headers=auth).json() == []


def test_staff_only_and_delete(client, auth):
    assert client.get("/api/reviews/all").status_code == 401
    client.post("/api/reviews", json=REVIEW)
    rid = client.get("/api/reviews/all", headers=auth).json()[0]["id"]
    assert client.patch(f"/api/reviews/{rid}", json={"status": "approved"}).status_code == 401
    assert client.delete(f"/api/reviews/{rid}", headers=auth).status_code == 204
    assert client.get("/api/reviews/all", headers=auth).json() == []


def test_rate_limit(client):
    review_limiter.reset()
    codes = [client.post("/api/reviews", json=REVIEW).status_code for _ in range(review_limiter.limit + 1)]
    assert codes[-1] == 429
