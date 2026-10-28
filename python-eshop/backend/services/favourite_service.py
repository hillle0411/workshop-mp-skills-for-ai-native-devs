from db.client import DatabaseClient
from models.entities import CatalogItem


class FavouriteService:
    def __init__(self, db: DatabaseClient):
        self.db = db

    def list_for_buyer(self, buyer_id: str) -> list[CatalogItem]:
        return self.db.list_favourite_products(buyer_id)

    def add(self, buyer_id: str, product_id: int) -> None:
        if not self.db.get_catalog_item_by_id(product_id):
            raise ValueError("Product not found")
        self.db.add_favourite(buyer_id, product_id)

    def remove(self, buyer_id: str, product_id: int) -> None:
        self.db.remove_favourite(buyer_id, product_id)
