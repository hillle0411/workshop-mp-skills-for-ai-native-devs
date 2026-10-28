from fastapi import APIRouter, Depends, HTTPException, Response, status

from dependencies import get_favourite_service, require_authenticated_user
from models.schemas import CatalogItemResponse
from services.favourite_service import FavouriteService

router = APIRouter(prefix="/api/favourites", tags=["favourites"])


@router.get("", response_model=list[CatalogItemResponse])
def list_favourites(
    buyer_id: str = Depends(require_authenticated_user),
    service: FavouriteService = Depends(get_favourite_service),
):
    return service.list_for_buyer(buyer_id)


@router.put("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def add_favourite(
    product_id: int,
    buyer_id: str = Depends(require_authenticated_user),
    service: FavouriteService = Depends(get_favourite_service),
):
    try:
        service.add(buyer_id, product_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favourite(
    product_id: int,
    buyer_id: str = Depends(require_authenticated_user),
    service: FavouriteService = Depends(get_favourite_service),
):
    service.remove(buyer_id, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
