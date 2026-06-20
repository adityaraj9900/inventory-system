# Inventory & Order Management System - Deployment Guide

## Project Verification ✅

### Functional Requirements

#### Product Management ✅
- **POST /products** - Create product with unique SKU validation
- **GET /products** - List all products
- **GET /products/{id}** - Get specific product
- **PUT /products/{id}** - Update product (with SKU uniqueness check)
- **DELETE /products/{id}** - Delete product
- **Fields**: name, SKU (unique), price, quantity
- **Validation**: SKU uniqueness enforced (409 Conflict on duplicate)

#### Customer Management ✅
- **POST /customers** - Create customer with unique email validation
- **GET /customers** - List all customers
- **GET /customers/{id}** - Get specific customer
- **DELETE /customers/{id}** - Delete customer (protected if has orders)
- **Fields**: full_name, email (unique), phone
- **Validation**: Email uniqueness enforced (409 Conflict on duplicate)
- **Protection**: Cannot delete customers with existing orders (409 Conflict)

#### Order Management ✅
- **POST /orders** - Create order with stock validation
- **GET /orders** - List all orders
- **GET /orders/{id}** - Get order with line items
- **DELETE /orders/{id}** - Cancel order and restore stock
- **Fields**: customer_id, items (product references + quantities), total_amount
- **Business Rules**:
  - ✅ Stock validation before order creation (400 Bad Request if insufficient)
  - ✅ Automatic stock reduction on order creation
  - ✅ Automatic stock restoration on order cancellation
  - ✅ Backend calculates total from product prices
  - ✅ No partial orders created

#### Dashboard ✅
- **GET /dashboard/summary** - Returns:
  - Total products count
  - Total customers count
  - Total orders count
  - Low stock products (configurable threshold)

### Business Logic Requirements ✅

1. ✅ **Product SKU uniqueness** - Database unique constraint + API validation
2. ✅ **Customer email uniqueness** - Database unique constraint + API validation
3. ✅ **Non-negative quantity** - Database CHECK constraint + API validation
4. ✅ **Stock validation** - Orders rejected if insufficient inventory
5. ✅ **Automatic stock management** - Decremented on order, restored on cancel
6. ✅ **Backend total calculation** - Order total calculated server-side
7. ✅ **Error handling** - Proper HTTP status codes (400, 404, 409, 422)
8. ✅ **Data validation** - Pydantic schemas validate all requests

### Frontend Features ✅

#### Pages
- ✅ **Dashboard** - Summary stats + low stock alerts
- ✅ **Products** - CRUD operations with modal forms
- ✅ **Customers** - Create/delete with email validation
- ✅ **Orders** - Create with line items, view details, cancel
- ✅ **Order Detail** - View order items, cancel order

#### UI/UX
- ✅ Responsive design (mobile + desktop)
- ✅ Clean professional interface
- ✅ Form validation with error messages
- ✅ Success/error toast notifications
- ✅ Organized component structure
- ✅ Proper state management with React hooks

### Technical Stack ✅

- ✅ **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0
- ✅ **Frontend**: React 18, Vite, Tailwind CSS
- ✅ **Database**: PostgreSQL (configured), SQLite (for local dev)
- ✅ **API**: RESTful with automatic OpenAPI docs at /docs

### Docker Configuration ✅

#### Files Present
- ✅ `docker-compose.yml` - Orchestrates all services
- ✅ `backend/Dockerfile` - Production-ready Python image
- ✅ `frontend/Dockerfile` - Multi-stage build (Node → Nginx)
- ✅ `backend/.dockerignore` - Excludes venv, .env, cache files
- ✅ `frontend/.dockerignore` - Excludes node_modules, dist, .env

#### Services
- ✅ **db** - PostgreSQL 16-alpine with healthcheck
- ✅ **backend** - FastAPI with uvicorn
- ✅ **frontend** - Nginx serving built React app

#### Best Practices
- ✅ Named volumes for PostgreSQL persistence
- ✅ Environment variables (no hardcoded credentials)
- ✅ Health checks for database
- ✅ Slim/lightweight base images
- ✅ Non-root user in backend
- ✅ Proper dependency ordering

## Local Development Setup

### Prerequisites
- Python 3.9+
- Node.js 20+
- npm 10+

### Quick Start (Without Docker)

```bash
# 1. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Already configured for SQLite
uvicorn app.main:app --reload --port 8000

# 2. Frontend (in new terminal)
cd frontend
npm install
cp .env.example .env  # Already configured
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Production Deployment

### Option 1: Docker Compose (Self-Hosted)

```bash
# Configure environment
cp .env.example .env
# Edit .env with your values

# Start all services
docker compose up --build -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Option 2: Cloud Deployment

#### Backend Deployment (Render)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/inventory-system.git
git push -u origin main
```

2. **Deploy on Render**
   - Create new Web Service
   - Connect GitHub repo
   - Root directory: `backend`
   - Build command: `docker build -t inventory-backend .`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Add environment variables:
     - `DATABASE_URL` - PostgreSQL connection string
     - `CORS_ORIGINS` - Your frontend URL
     - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

3. **Add PostgreSQL**
   - Create new PostgreSQL instance on Render
   - Copy internal connection string to `DATABASE_URL`

#### Frontend Deployment (Vercel)

1. **Import Project**
   - Import GitHub repo
   - Root directory: `frontend`
   - Framework: Vite

2. **Environment Variables**
   - `VITE_API_URL` - Your backend URL (e.g., https://inventory-backend.onrender.com)

3. **Build Settings**
   - Build command: `npm run build`
   - Output directory: `dist`

4. **Deploy**
   - Click deploy
   - Note the live URL

5. **Update Backend CORS**
   - Go back to Render backend
   - Update `CORS_ORIGINS` with your Vercel URL
   - Redeploy backend

## Environment Variables

### Root `.env` (Docker Compose)
```env
POSTGRES_USER=inventory_user
POSTGRES_PASSWORD=inventory_pass
POSTGRES_DB=inventory_db
CORS_ORIGINS=*
VITE_API_URL=http://localhost:8000
```

### Backend `.env`
```env
DATABASE_URL=postgresql://inventory_user:inventory_pass@db:5432/inventory_db
CORS_ORIGINS=*
PORT=8000
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:8000
```

## API Testing

### Interactive Docs
Visit http://localhost:8000/docs for Swagger UI

### Example Requests

#### Create Product
```bash
curl -X POST http://localhost:8000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Water Bottle",
    "sku": "WB-001",
    "price": 24.99,
    "quantity": 100
  }'
```

#### Create Customer
```bash
curl -X POST http://localhost:8000/customers \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 555 0100"
  }'
```

#### Create Order
```bash
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "CUSTOMER_UUID",
    "items": [
      {"product_id": "PRODUCT_UUID", "quantity": 2}
    ]
  }'
```

## Project Structure

```
inventory-system/
├── docker-com.yml          # Service orchestration
├── .env.example            # Environment template
├── backend/
│   ├── Dockerfile          # Production image
│   ├── .dockerignore
│   ├── requirements.txt
│   └── app/
│       ├── main.py         # FastAPI app, CORS, error handlers
│       ├── database.py     # SQLAlchemy setup
│       ├── models.py       # Database models
│       ├── schemas.py      # Pydantic schemas
│       ├── crud.py         # Business logic
│       ├── seed.py         # Demo data
│       └── routers/        # API endpoints
│           ├── products.py
│           ├── customers.py
│           ├── orders.py
│           └── dashboard.py
└── frontend/
    ├── Dockerfile          # Multi-stage build
    ├── .dockerignore
    ├── nginx.conf          # Production config
    ├── package.json
    └── src/
        ├── App.jsx         # Routing
        ├── pages/          # Dashboard, Products, Customers, Orders
        ├── components/     # Layout, Modal, Toast, StockBadge
        └── api/            # Axios client
```

## Verification Checklist

### Backend ✅
- [x] All CRUD endpoints implemented
- [x] SKU uniqueness validation
- [x] Email uniqueness validation
- [x] Stock validation on orders
- [x] Automatic stock management
- [x] Backend total calculation
- [x] Proper HTTP status codes
- [x] Request validation with Pydantic
- [x] Error handling middleware
- [x] CORS configuration
- [x] Health check endpoint
- [x] Interactive API docs

### Frontend ✅
- [x] Dashboard with stats
- [x] Product management (CRUD)
- [x] Customer management (CRUD)
- [x] Order creation with line items
- [x] Order details view
- [x] Order cancellation
- [x] Form validation
- [x] Error/success messages
- [x] Responsive design
- [x] Client-side routing

### Docker ✅
- [x] docker-compose.yml with 3 services
- [x] Backend Dockerfile (production-ready)
- [x] Frontend Dockerfile (multi-stage)
- [x] .dockerignore files
- [x] Named volumes for persistence
- [x] Environment variables
- [x] Health checks
- [x] No hardcoded credentials

### Code Quality ✅
- [x] Type hints (Python)
- [x] Component structure (React)
- [x] Separation of concerns
- [x] Database constraints
- [x] Business logic in CRUD layer
- [x] RESTful API design

## Notes

- **Local Development**: Using SQLite for convenience (no PostgreSQL installation needed)
- **Production**: Configured for PostgreSQL via environment variables
- **Database Migrations**: Using `Base.metadata.create_all` for simplicity; Alembic available in requirements.txt
- **Authentication**: Not implemented (not in requirements); add JWT/API keys for production use
- **Seeding**: Run `python -m app.seed` to load demo data

## Support

For issues or questions, refer to:
- Backend docs: http://localhost:8000/docs
- README.md for project overview
- Inline code comments for implementation details