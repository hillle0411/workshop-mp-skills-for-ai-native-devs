from datetime import datetime, timedelta, timezone

from tests.conftest import login
from tests.test_basket_identity import make_token


def test_favourites_require_sign_in(client):
    assert client.get("/api/favourites").status_code == 401
    assert client.put("/api/favourites/1").status_code == 401
    assert client.delete("/api/favourites/1").status_code == 401


def test_favourites_reject_an_expired_session(client):
    expired = make_token(exp=datetime.now(timezone.utc) - timedelta(minutes=1))
    headers = {"Authorization": f"Bearer {expired}"}

    for method in ("get", "put", "delete"):
        path = "/api/favourites" if method == "get" else "/api/favourites/1"
        response = client.request(method.upper(), path, headers=headers)
        assert response.status_code == 401, method
        assert "session has expired" in response.json()["detail"], method


def favourites_of(client, headers):
    response = client.get("/api/favourites", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def favourite_ids(client, headers):
    return [product["id"] for product in favourites_of(client, headers)]


def catalog_product(client, product_id):
    items = client.get("/api/catalog/items").json()["items"]
    return next(item for item in items if item["id"] == product_id)


def test_new_buyer_has_no_favourites(client, demo_headers):
    assert favourites_of(client, demo_headers) == []


def test_favourited_product_is_listed_with_its_catalog_details(client, demo_headers):
    assert client.put("/api/favourites/3", headers=demo_headers).status_code == 204

    assert favourites_of(client, demo_headers) == [catalog_product(client, 3)]


def test_favouriting_twice_keeps_one_favourite(client, demo_headers):
    client.put("/api/favourites/3", headers=demo_headers)
    assert client.put("/api/favourites/3", headers=demo_headers).status_code == 204

    assert favourite_ids(client, demo_headers) == [3]


def test_removing_a_favourite_takes_it_off_the_list(client, demo_headers):
    client.put("/api/favourites/3", headers=demo_headers)
    client.put("/api/favourites/5", headers=demo_headers)

    assert client.delete("/api/favourites/3", headers=demo_headers).status_code == 204

    assert favourite_ids(client, demo_headers) == [5]


def test_removing_something_not_favourited_succeeds(client, demo_headers):
    assert client.delete("/api/favourites/3", headers=demo_headers).status_code == 204


def test_favouriting_an_unknown_product_is_refused(client, demo_headers):
    client.put("/api/favourites/3", headers=demo_headers)

    assert client.put("/api/favourites/9999", headers=demo_headers).status_code == 404

    assert favourite_ids(client, demo_headers) == [3]


def test_favourites_are_listed_newest_first(client, demo_headers):
    for product_id in [3, 1, 5]:
        client.put(f"/api/favourites/{product_id}", headers=demo_headers)

    assert favourite_ids(client, demo_headers) == [5, 1, 3]


def test_buyers_cannot_see_or_change_each_others_favourites(client, demo_headers):
    other = client.post(
        "/api/auth/register",
        json={"email": "other@example.com", "password": "secret123"},
    )
    assert other.status_code == 200, other.text
    other_headers = login(client, "other@example.com", "secret123")
    client.put("/api/favourites/3", headers=demo_headers)
    client.put("/api/favourites/5", headers=other_headers)

    client.delete("/api/favourites/3", headers=other_headers)

    assert favourite_ids(client, demo_headers) == [3]
    assert favourite_ids(client, other_headers) == [5]


def test_favourites_survive_signing_in_again_and_adding_to_basket(
    client, demo_headers
):
    client.put("/api/favourites/3", headers=demo_headers)
    client.post(
        "/api/basket/items", json={"catalog_item_id": 3}, headers=demo_headers
    )

    headers = login(client)

    assert favourite_ids(client, headers) == [3]


def test_favouriting_again_does_not_move_it_to_the_top(client, demo_headers):
    client.put("/api/favourites/3", headers=demo_headers)
    client.put("/api/favourites/5", headers=demo_headers)

    client.put("/api/favourites/3", headers=demo_headers)

    assert favourite_ids(client, demo_headers) == [5, 3]
