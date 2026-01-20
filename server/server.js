import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import invoiceRoutes from './routes/invoices.js'
import clientRoutes from './routes/clients.js'
import paymentRoutes from './routes/payments.js'
import reportRoutes from './routes/reports.js'
import transactionRoutes from './routes/transactions.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' })) // Increased limit for CSV uploads

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/transactions', transactionRoutes)

// API root for quick info
app.get('/api', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Invoice Management API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login, /api/auth/register',
      invoices: '/api/invoices',
      clients: '/api/clients',
      payments: '/api/payments',
      reports: '/api/reports'
    }
  })
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Invoice API is running' })
})

// Serve built frontend (for Electron/production)
const distPath = path.join(__dirname, '../client/dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!', error: err.message })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
