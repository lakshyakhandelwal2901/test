# Invoice Management Web App

A full-stack invoice management application built with React, Express, PostgreSQL, and Prisma.

## 🏗️ Tech Stack

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Recharts** for data visualization
- **jsPDF** for PDF generation
- **Axios** for API calls

### Backend
- **Node.js** + **Express**
- **PostgreSQL** database
- **Prisma ORM**
- **JWT** authentication
- **bcryptjs** for password hashing

## 📁 Project Structure

```
/workspaces/test/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json
│
└── server/                # Express backend
    ├── routes/            # API routes
    ├── middleware/        # Auth middleware
    ├── prisma/            # Database schema & seeds
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### 1. Setup Database (Optional - Using Docker)

```bash
# Start PostgreSQL in Docker
docker-compose up -d

# The database will be available at:
# Host: localhost
# Port: 5432
# Database: invoice_db
# Username: invoiceuser
# Password: invoicepass
```

### 2. Setup Backend

```bash
cd server

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# For Docker: DATABASE_URL="postgresql://invoiceuser:invoicepass@localhost:5432/invoice_db"

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with demo data
npm run prisma:seed

# Start the server
npm run dev
```

The API will run on `http://localhost:5000`

### 3. Setup Frontend

```bash
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will run on `http://localhost:3000`

## 🔑 Demo Credentials

After seeding the database:
- **Email:** demo@example.com
- **Password:** password123

## 📋 Features

### ✅ Implemented
- User authentication (register/login)
- Dashboard with summary cards and charts
- Invoice management (create, edit, delete, view)
- Client management
- Invoice calculations (subtotal, tax, discount, total)
- Protected routes with JWT
- Responsive UI with Tailwind CSS

### 🚧 To Be Implemented
- PDF generation and download
- Invoice sharing via link
- Payment tracking with partial payments
- Auto status updates (paid/overdue/partial)
- Reports with date filters
- CSV/PDF export

## 🗄️ Database Schema

- **users** - User accounts
- **clients** - Client information
- **invoices** - Invoice headers
- **invoice_items** - Line items for invoices
- **payments** - Payment records

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get single invoice
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Payments
- `GET /api/payments/invoice/:id` - Get payments for invoice
- `POST /api/payments` - Create payment

### Reports
- `GET /api/reports` - Get invoice reports

## 🛠️ Development Commands

### Backend
```bash
npm run dev          # Start with auto-reload
npm run prisma:studio # Open Prisma Studio (DB GUI)
npm run prisma:seed   # Seed database
```

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 📦 Next Steps

1. ✅ Complete PDF generation feature
2. ✅ Add payment tracking
3. ✅ Implement invoice status automation
4. ✅ Build reports page
5. ✅ Add export functionality
6. 🎨 Polish UI/UX
7. 🚀 Deploy to production

## 📝 License

MIT