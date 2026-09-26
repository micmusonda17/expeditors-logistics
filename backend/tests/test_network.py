from app.services.network import get_network


def test_shared_network_routes_match_the_frontend():
    net = get_network()
    assert net.shortest("lusaka", "kitwe").km == 380
    assert net.shortest("lusaka", "johannesburg").km == 1600
    route = net.shortest("lusaka", "polokwane")
    assert net.borders_on(route) == ["chirundu", "beitbridge"]


def test_match_hub_handles_labels_and_aliases():
    net = get_network()
    assert net.match_hub("Kitwe, Zambia") == "kitwe"
    assert net.match_hub("  JHB ") == "johannesburg"
    assert net.match_hub("Somewhere else") is None


def test_route_endpoint(client):
    res = client.get("/api/network/route", params={"from": "Lusaka", "to": "Chipata"})
    assert res.status_code == 200
    assert res.json()["km"] == 570
    assert client.get("/api/network/route", params={"from": "Lusaka", "to": "Nowhere"}).status_code == 404


def test_health(client):
    assert client.get("/api/health").json()["status"] == "ok"
