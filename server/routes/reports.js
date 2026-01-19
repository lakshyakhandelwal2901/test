import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get reports
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const where = {
      userId: req.userId,
      ...(startDate && endDate && {
        issue_date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        items: true
      }
    })

    const summary = {
      totalInvoices: invoices.length,
      totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
      paidAmount: invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.total, 0),
      unpaidAmount: invoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.total, 0),
      overdueAmount: invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.total, 0),
      statusBreakdown: invoices.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1
        return acc
      }, {})
    }

    res.json({ summary, invoices })
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate report', error: error.message })
  }
})

export default router
