from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .. import crud, schemas, models
from ..database import get_db

router = APIRouter(prefix="/orders", tags=["orders"])


def _to_order_out(order: models.Order) -> schemas.OrderOut:
    return schemas.OrderOut(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name if order.customer else None,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=[
            schemas.OrderItemOut(
                id=i.id,
                product_id=i.product_id,
                product_name=i.product.name if i.product else None,
                quantity=i.quantity,
                unit_price=i.unit_price,
            )
            for i in order.items
        ],
    )


@router.post("", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        order = crud.create_order(db, payload)
    except ValueError as exc:
        code = str(exc)
        if code == "CUSTOMER_NOT_FOUND":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        if code.startswith("PRODUCT_NOT_FOUND"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if code.startswith("INSUFFICIENT_STOCK"):
            _, sku, available = code.split(":")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for SKU '{sku}': only {available} unit(s) available",
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to create order")
    return _to_order_out(order)


@router.get("", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.items).joinedload(models.OrderItem.product), joinedload(models.Order.customer))
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [_to_order_out(o) for o in orders]


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return _to_order_out(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: str, db: Session = Depends(get_db)):
    """Cancels and deletes an order, restoring the reserved stock to inventory."""
    order = crud.get_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    crud.delete_order(db, order)
    return None
