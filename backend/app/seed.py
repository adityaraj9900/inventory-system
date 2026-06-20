"""
Optional helper to populate the database with sample data for demos/testing.

Run from the backend/ directory (with DATABASE_URL set, e.g. via docker compose exec):
    python -m app.seed
"""

from .database import SessionLocal, Base, engine
from . import models

Base.metadata.create_all(bind=engine)


def run():
    db = SessionLocal()
    try:
        if db.query(models.Product).first():
            print("Database already has data — skipping seed.")
            return

        products = [
            models.Product(name="Stainless Steel Water Bottle", sku="SKU-0001", price=18.50, quantity=120),
            models.Product(name="Wireless Mouse", sku="SKU-0002", price=24.99, quantity=8),
            models.Product(name="Mechanical Keyboard", sku="SKU-0003", price=89.00, quantity=35),
            models.Product(name="USB-C Hub", sku="SKU-0004", price=32.00, quantity=2),
            models.Product(name="Desk Lamp", sku="SKU-0005", price=45.00, quantity=60),
        ]
        db.add_all(products)

        customers = [
            models.Customer(full_name="Asha Patel", email="asha.patel@example.com", phone="+91 98765 43210"),
            models.Customer(full_name="Diego Fernández", email="diego.f@example.com", phone="+34 612 345 678"),
        ]
        db.add_all(customers)

        db.commit()
        print(f"Seeded {len(products)} products and {len(customers)} customers.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
