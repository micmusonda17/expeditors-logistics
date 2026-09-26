def _new_load(client, auth, **extra):
    body = {
        "fromHub": "lusaka",
        "toHub": "kitwe",
        "customer": "Mwila Poultry",
        "customerPhone": "0970000101",
        "cargo": "Frozen chicken",
        "weight": 5,
        "truckType": "Refrigerated truck (3 to 5 t)",
        "loadDate": "2026-10-01",
        "rate": 3300,
        "currency": "ZMW",
        **extra,
    }
    res = client.post("/api/loads", json=body, headers=auth)
    assert res.status_code == 201, res.text
    return res.json()


def test_create_load_from_quote_marks_it_won(client, auth, quote_payload):
    client.post("/api/quotes", json=quote_payload)
    qid = client.get("/api/quotes", headers=auth).json()[0]["id"]
    load = _new_load(client, auth, quoteId=qid)
    assert load["ref"].startswith("ELL-")
    assert load["status"] == "Booked" and load["origin"] == "Lusaka, Zambia"
    assert load["events"][0]["note"].startswith("Loading")
    quote = client.get(f"/api/quotes/{qid}", headers=auth).json()
    assert quote["status"] == "won" and quote["loadRef"] == load["ref"]


def test_status_update_shows_on_public_tracking(client, auth):
    load = _new_load(client, auth)
    res = client.post(
        f"/api/loads/{load['ref']}/events",
        json={"status": "In transit", "at": "kabwe", "note": "On schedule", "eta": "2026-10-02"},
        headers=auth,
    )
    assert res.status_code == 200
    assert res.json()["location"] == "Kabwe"

    public = client.get(f"/api/tracking/{load['ref'].lower()}")
    assert public.status_code == 200
    t = public.json()
    assert t["status"] == "In transit" and t["note"] == "On schedule" and t["eta"] == "2026-10-02"
    assert [e["status"] for e in t["events"]] == ["Booked", "In transit"]
    # Private details never leak to the public endpoint.
    for private in ("customer", "customerPhone", "rate", "driver", "driverPhone", "notes"):
        assert private not in t


def test_event_needs_a_location(client, auth):
    load = _new_load(client, auth)
    res = client.post(f"/api/loads/{load['ref']}/events", json={"status": "Loaded"}, headers=auth)
    assert res.status_code == 422


def test_unknown_towns_are_rejected(client, auth):
    res = client.post(
        "/api/loads",
        json={
            "fromHub": "atlantis",
            "toHub": "kitwe",
            "customer": "X",
            "customerPhone": "0970000101",
            "cargo": "Y",
        },
        headers=auth,
    )
    assert res.status_code == 422


def test_patch_list_and_delete(client, auth):
    load = _new_load(client, auth)
    ref = load["ref"]
    res = client.patch(
        f"/api/loads/{ref}", json={"driver": "Joseph Tembo", "truckReg": "ABC 1021"}, headers=auth
    )
    assert res.json()["driver"] == "Joseph Tembo"
    assert len(client.get("/api/loads?stage=active", headers=auth).json()) == 1
    assert client.get("/api/loads?stage=Delivered", headers=auth).json() == []
    assert client.delete(f"/api/loads/{ref}", headers=auth).status_code == 204
    assert client.get(f"/api/tracking/{ref}").status_code == 404
