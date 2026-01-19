# Quick Start Guide - Invoice Management App

## 🚀 One-Command Startup

### On Linux/Mac:
```bash
cd /workspaces/test
./start.sh
```

### On Windows:
```cmd
cd /workspaces/test
start.bat
```

## What This Does:
1. ✅ Starts PostgreSQL Database (Docker)
2. ✅ Seeds the database with demo data
3. ✅ Starts Backend Server (port 5000)
4. ✅ Starts Frontend Server (port 3001)

## 📝 Demo Credentials:
- **Email:** demo@example.com
- **Password:** password123

## 🌐 Access Points:
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:5000
- **Database:** postgresql://invoiceuser:invoicepass@localhost:5432/invoice_db

---

## Manual Setup (If needed)

### Prerequisites:
- Node.js 18+ 
- Docker & Docker Compose
- Git

### Step-by-Step:

#### 1. Start Database
```bash
docker-compose up -d
```

#### 2. Setup Backend
```bash
cd server
npm install
npx prisma migrate deploy
node prisma/seed.js
npm run dev
```

#### 3. Setup Frontend (in new terminal)
```bash
cd client
npm install
npm run dev -- --port 3001
```

---

## 🗄️ Database Access

### Using Prisma Studio (Recommended):
```bash
cd server
npx prisma studio
```
Opens http://localhost:5555

### Using psql:
```bash
psql -h localhost -p 5432 -U invoiceuser -d invoice_db
```
Password: `invoicepass`

### Using Docker:
```bash
docker exec -it invoice_db psql -U invoiceuser -d invoice_db
```

---

## 🛑 Stopping Services

Press **Ctrl+C** in each terminal where services are running.

To stop the database:
```bash
docker-compose down
```

---

## ⚡ Available Features

✅ User Authentication (Register/Login)
✅ Invoice CRUD Operations
✅ Client Management
✅ Payment Tracking
✅ PDF Export (Individual & Bulk)
✅ CSV Export (Bulk)
✅ Date Range Filtering
✅ Dashboard with Charts
✅ Responsive Design (Tailwind CSS)

---

## 📞 API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/invoices` - Get all invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get single invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/payments` - Record payment
- `GET /api/payments/invoice/:id` - Get invoice payments
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create client

---

## 🐛 Troubleshooting

**Port Already in Use:**
```bash
# Kill process on port 3001 (frontend)
lsof -i :3001 | grep -v COMMAND | awk '{print $2}' | xargs -r kill -9

# Kill process on port 5000 (backend)
lsof -i :5000 | grep -v COMMAND | awk '{print $2}' | xargs -r kill -9

# Kill process on port 5432 (database)
lsof -i :5432 | grep -v COMMAND | awk '{print $2}' | xargs -r kill -9
```

**Database Connection Failed:**
```bash
# Check if Docker container is running
docker ps | grep invoice_db

# Restart container
docker-compose restart
```

**Dependencies Issues:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📦 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL 16
- **ORM:** Prisma
- **Auth:** JWT
- **PDF:** jsPDF
- **Forms:** React Hook Form

---

For detailed project structure, see [README.md](./README.md)
