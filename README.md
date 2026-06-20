# Manifest — Inventory & Order Management System

A full-stack, containerized system for tracking products, customers, orders, and
inventory levels: **React** frontend, **FastAPI** backend, **PostgreSQL** database,
orchestrated with **Docker Compose**.

```
┌─────────────┐      HTTP/JSON      ┌──────────────┐      SQL      ┌──────────────┐
│   React     │ ──────────────────► │   FastAPI    │ ────────────► │  PostgreSQL  │
│  (nginx)    │ ◄────────────────── │  (uvicorn)   │ ◄──────────── │              │
└─────────────┘                     └──────────────┘                └──────────────┘
   :5173/:80                              :8000                          :5432
```

## Project structure

```
inventory-system/
├── docker-compose.yml        # orchestrates db + backend + frontend
├── .env.example              # root env vars used by docker compose
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app, CORS, error handlers
│   │   ├── database.py       # SQLAlchemy engine/session
│   │   ├── models.py         # Product, Customer, Order, OrderItem
│   │   ├── schemas.py        # Pydantic request/response models
│   │   ├── crud.py           # business logic (stock checks, totals)
│   │   ├── seed.py           # optional demo data
│   │   └── routers/          # products, customers, orders, dashboard
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/             # Dashboard, Products, Customers, Orders, OrderDetail
    │   ├── components/        # Layout, Modal, Toast, StockBadge
    │   └── api/client.js      # axios wrapper for the backend API
    ├── package.json
    ├── Dockerfile              # multi-stage: node build → nginx serve
    ├── nginx.conf
    └── .env.example
```

## Business rules implemented

- Product **SKU is unique**; duplicate SKU on create/update returns `409 Conflict`.
- Customer **email is unique**; duplicate email returns `409 Conflict`.
- Product **quantity can never go negative** (enforced in both the API layer and a
  database `CHECK` constraint).
- **Orders are rejected with `400 Bad Request`** if any line item requests more
  units than are currently in stock — no partial orders are created.
- **Stock is decremented automatically** when an order is placed, and **restored
  automatically** if the order is later cancelled/deleted.
- The **order total is always calculated server-side** from each product's price
  at the time of purchase — the client never sends a total.
- A customer with existing orders can't be deleted (`409 Conflict`) to keep order
  history intact.

## Run it locally with Docker Compose

This is the fastest way to see the whole system running.

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000 (interactive docs at `/docs`)
- Postgres: localhost:5432

Optional: load demo data once the containers are up:

```bash
docker compose exec backend python -m app.seed
```

## Run it locally without Docker (manual dev setup)

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # point DATABASE_URL at a local Postgres instance
uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## API reference

All endpoints return JSON. Interactive Swagger docs are auto-generated at
`/docs` and ReDoc at `/redoc` once the backend is running.

| Method | Path                | Description                          |
|--------|---------------------|---------------------------------------|
| POST   | `/products`          | Create a product                      |
| GET    | `/products`          | List all products                     |
| GET    | `/products/{id}`     | Get one product                       |
| PUT    | `/products/{id}`     | Update a product                      |
| DELETE | `/products/{id}`     | Delete a product                      |
| POST   | `/customers`          | Create a customer                     |
| GET    | `/customers`          | List all customers                    |
| GET    | `/customers/{id}`     | Get one customer                      |
| DELETE | `/customers/{id}`     | Delete a customer (must have no orders) |
| POST   | `/orders`             | Create an order (validates & reduces stock) |
| GET    | `/orders`             | List all orders                       |
| GET    | `/orders/{id}`        | Get one order with line items         |
| DELETE | `/orders/{id}`        | Cancel an order and restore stock     |
| GET    | `/dashboard/summary`  | Totals + low-stock products           |

Example: creating an order with two line items —

```json
POST /orders
{
  "customer_id": "5e1c...",
  "items": [
    { "product_id": "a1f0...", "quantity": 2 },
    { "product_id": "9bd3...", "quantity": 1 }
  ]
}
```

## Environment variables

| Variable          | Used by  | Description                                              |
|--------------------|----------|------------------------------------------------------------|
| `DATABASE_URL`     | backend  | SQLAlchemy connection string for Postgres                  |
| `CORS_ORIGINS`     | backend  | Comma-separated allowed frontend origins (or `*`)           |
| `PORT`             | backend  | Port uvicorn binds to (most hosts inject this automatically) |
| `VITE_API_URL`     | frontend | Backend base URL, baked in **at build time**                |
| `POSTGRES_USER/PASSWORD/DB` | db | Database credentials, also used to build `DATABASE_URL` locally |

No credentials are hardcoded anywhere in the codebase — everything above is
read from the environment, with `.env.example` files documenting what's needed.

---

## Deploying for free

These steps map directly to the submission deliverables (GitHub repo, Docker
Hub image, live frontend URL, live backend URL). I can't run these from this
sandbox since it has no internet access — they need your accounts and your
machine/browser.

### 1. Push the code to GitHub

```bash
cd inventory-system
git init
git add .
git commit -m "Inventory & Order Management System"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Build & push the backend image to Docker Hub

```bash
cd backend
docker build -t <your-dockerhub-username>/inventory-backend:latest .
docker login
docker push <your-dockerhub-username>/inventory-backend:latest
```

### 3. Deploy the backend (Render, Railway, or Fly.io)

**Render (simplest)**
1. New → **Web Service** → connect your GitHub repo, root directory `backend`.
2. Render auto-detects the `Dockerfile`. Set:
   - `DATABASE_URL` → from a Render **PostgreSQL** instance (New → PostgreSQL, then copy its internal connection string)
   - `CORS_ORIGINS` → your frontend URL (set this after step 4, then redeploy)
3. Deploy. Note the public URL, e.g. `https://inventory-backend.onrender.com`.

**Railway** — New Project → Deploy from GitHub repo (`backend` as root) → add a
PostgreSQL plugin → Railway sets `DATABASE_URL` automatically → add `CORS_ORIGINS`.

**Fly.io** — `fly launch` from inside `backend/` (it detects the Dockerfile),
`fly postgres create` for the database, `fly secrets set DATABASE_URL=... CORS_ORIGINS=...`.

### 4. Deploy the frontend (Vercel or Netlify)

**Vercel**
1. New Project → import the repo → set root directory to `frontend`.
2. Framework preset: Vite. Build command `npm run build`, output `dist`.
3. Add environment variable `VITE_API_URL` = your backend URL from step 3.
4. Deploy. Note the public URL, e.g. `https://inventory-frontend.vercel.app`.

**Netlify** — New site from Git → base directory `frontend` → build command
`npm run build` → publish directory `frontend/dist` → add `VITE_API_URL` under
Site settings → Environment variables.

> `VITE_API_URL` is compiled into the JS bundle at build time, so if you change
> it later you need to trigger a fresh build/redeploy, not just restart the app.

### 5. Connect the two

Go back to the backend's environment variables and set `CORS_ORIGINS` to your
exact frontend URL (e.g. `https://inventory-frontend.vercel.app`), then redeploy
the backend so it accepts requests from the deployed frontend.

### 6. Final checks before submitting

- [ ] Visit the live frontend URL — Dashboard loads without errors
- [ ] Add a product, a customer, and an order through the UI
- [ ] Visit `<backend-url>/docs` — Swagger UI loads
- [ ] GitHub repo is public (or shared with the reviewer) and contains both `frontend/` and `backend/`
- [ ] Docker Hub image is public: `docker pull <your-dockerhub-username>/inventory-backend:latest` works from a clean machine

## Notes on scope

- Auth/authorization wasn't in the assessment's functional requirements, so the
  API is open — add an auth layer (e.g. API keys or JWT) before using this
  pattern with real customer data.
- Schema migrations use `Base.metadata.create_all` on startup for simplicity;
  Alembic is already in `requirements.txt` if you want versioned migrations.
