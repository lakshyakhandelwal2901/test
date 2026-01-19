import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get payments for an invoice
router.get('/invoice/:invoiceId', authenticate, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { invoiceId: parseInt(req.params.invoiceId) },
      orderBy: { payment_date: 'desc' }
    })
    res.json(payments)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payments', error: error.message })
  }
})

// Create payment
router.post('/', authenticate, async (req, res) => {
  try {
    const { invoice_id, amount_paid, payment_date, payment_mode } = req.body

    // Get invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: parseInt(invoice_id),
        userId: req.userId
      }
    })

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        invoiceId: parseInt(invoice_id),
        amount_paid: parseFloat(amount_paid),
        payment_date: new Date(payment_date),
        payment_mode
      }
    })

    // Calculate total paid
    const allPayments = await prisma.payment.findMany({
      where: { invoiceId: parseInt(invoice_id) }
    })
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount_paid, 0)

    // Update invoice status
    let status = 'Sent'
    const today = new Date()
    const dueDate = new Date(invoice.due_date)

    if (totalPaid >= invoice.total) {
      status = 'Paid'
    } else if (totalPaid > 0 && totalPaid < invoice.total && today > dueDate) {
      status = 'Overdue'
    } else if (totalPaid > 0 && totalPaid < invoice.total) {
      status = 'Partially Paid'
    } else if (totalPaid === 0 && today > dueDate) {
      status = 'Overdue'
    }

    await prisma.invoice.update({
      where: { id: parseInt(invoice_id) },
      data: { status }
    })

    res.status(201).json(payment)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create payment', error: error.message })
  }
})

export default router
