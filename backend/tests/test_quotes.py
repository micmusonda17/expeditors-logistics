from app.api.deps import quote_limiter


def test_public_quote_is_stored_with_route(client, auth, quote_payload):
    res = client.post("/api/quotes", json=quote_payload)
    assert res.status_code == 201, res.text
    receipt = res.json()
    assert receipt["ref"].startswith("Q")
    assert receipt["fromHub"] == "lusaka" and receipt["toHub"] == "kitwe"
    assert receipt["km"] == 380

    quotes = client.get("/api/quotes", headers=auth).json()
    assert len(quotes) == 1
    q = quotes[0]
    assert q["status"] == "new" and q["km"] == 380 and q["email"] == "orders@example.com"


def test_validation_errors(client, quote_payload):
    bad = {**quote_payload, "phone": "123", "weight": 500}
    res = client.post("/api/quotes", json=bad)
    assert res.status_code == 422
    fields = {e["loc"][-1] for e in res.json()["detail"]}
    assert {"phone", "weight"} <= fields


def test_blank_email_is_allowed(client, auth, quote_payload):
    res = client.post("/api/quotes", json={**quote_payload, "email": ""})
    assert res.status_code == 201


def test_honeypot_drops_the_request(client, auth, quote_payload):
    res = client.post("/api/quotes", json={**quote_payload, "website": "http://spam.example"})
    assert res.status_code == 201
    assert client.get("/api/quotes", headers=auth).json() == []


def test_rate_limit(client, quote_payload):
    quote_limiter.reset()
    codes = [
        client.post("/api/quotes", json=quote_payload).status_code for _ in range(quote_limiter.limit + 1)
    ]
    assert codes[-1] == 429 and set(codes[:-1]) == {201}


def test_setting_a_rate_marks_the_quote_quoted(client, auth, quote_payload):
    client.post("/api/quotes", json=quote_payload)
    qid = client.get("/api/quotes", headers=auth).json()[0]["id"]
    res = client.patch(f"/api/quotes/{qid}", json={"rate": 4200, "currency": "ZMW"}, headers=auth)
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "quoted" and body["rate"] == 4200


def test_filter_and_search(client, auth, quote_payload):
    client.post("/api/quotes", json=quote_payload)
    client.post("/api/quotes", json={**quote_payload, "name": "Grace Phiri", "delivery": "Chipata"})
    assert len(client.get("/api/quotes?search=grace", headers=auth).json()) == 1
    assert len(client.get("/api/quotes?status=new", headers=auth).json()) == 2
    assert client.get("/api/quotes?status=won", headers=auth).json() == []
