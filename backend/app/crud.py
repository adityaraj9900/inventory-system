from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.orm import Session

from . import models, schemas


# ---------- Products ----------

def get_products(db: Session) -> List[models.Product]:
    return db.scalars(select(models.Product).order_by(models.Product.created_at.desc())).all()


def get_product(db: Session, product_id: str) -> Optional[models.Product]:
    return db.get(models.Product, product_id)


def get_product_by_sku(db: Session, sku: str) -> Optional[models.Product]:
    return db.scalars(select(models.Product).where(models.Product.sku == sku)).first()


def create_product(db: Session, payload: schemas.ProductCreate) -> models.Product:
    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(
    db: Session, product: models.Product, payload: schemas.ProductUpdate
) -> models.Product:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: models.Product) -> None:
    db.delete(product)
    db.commit()


# ---------- Customers ----------

def get_customers(db: Session) -> List[models.Customer]:
    return db.scalars(select(models.Customer).order_by(models.Customer.created_at.desc())).all()


def get_customer(db: Session, customer_id: str) -> Optional[models.Customer]:
    return db.get(models.Customer, customer_id)


def get_customer_by_email(db: Session, email: str) -> Optional[models.Customer]:
    return db.scalars(select(models.Customer).where(models.Customer.email == email)).first()


def create_customer(db: Session, payload: schemas.CustomerCreate) -> models.Customer:
    customer = models.Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer: models.Customer) -> None:
    db.delete(customer)
    db.commit()


# ---------- Orders ----------

def get_orders(db: Session) -> List[models.Order]:
    return db.scalars(select(models.Order).order_by(models.Order.created_at.desc())).all()


def get_order(db: Session, order_id: str) -> Optional[models.Order]:
    return db.get(models.Order, order_id)


def create_order(db: Session, payload: schemas.OrderCreate) -> models.Order:
    """
    Validates stock for every line item, then atomically decrements stock
    and creates the order. Raises ValueError on any business-rule violation;
    the router translates that into the appropriate HTTP error.
    """
    customer = db.get(models.Customer, payload.customer_id)
    if customer is None:
        raise ValueError("CUSTOMER_NOT_FOUND")

    # Pre-fetch + validate every product before mutating anything
    line_items = []
    total = 0
    for item in payload.items:
        product = db.get(models.Product, item.product_id)
        if product is None:
            raise ValueError(f"PRODUCT_NOT_FOUND:{item.product_id}")
        if product.quantity < item.quantity:
            raise ValueError(f"INSUFFICIENT_STOCK:{product.sku}:{product.quantity}")
        line_items.append((product, item.quantity))
        total += float(product.price) * item.quantity

    order = models.Order(customer_id=customer.id, total_amount=round(total, 2))
    db.add(order)
    db.flush()  # get order.id before creating items

    for product, qty in line_items:
        product.quantity -= qty  # automatic stock reduction
        db.add(
            models.OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=product.price,
            )
        )

    db.commit()
    db.refresh(order)
    return order


def delete_order(db: Session, order: models.Order) -> None:
    """Cancelling an order restores the stock it had reserved, then removes it."""
    for item in order.items:
        product = db.get(models.Product, item.product_id)
        if product is not None:
            product.quantity += item.quantity
    db.delete(order)
    db.commit()


# ---------- Dashboard ----------

def get_dashboard_summary(db: Session, low_stock_threshold: int = 10) -> dict:
    total_products = db.scalar(select(func.count()).select_from(models.Product)) or 0
    total_customers = db.scalar(select(func.count()).select_from(models.Customer)) or 0
    total_orders = db.scalar(select(func.count()).select_from(models.Order)) or 0
    low_stock = db.scalars(
        select(models.Product)
        .where(models.Product.quantity <= low_stock_threshold)
        .order_by(models.Product.quantity.asc())
    ).all()
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_products": low_stock,
    }
