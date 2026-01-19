import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get all invoices for authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.userId },
      include: {
        client: true,
        items: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(invoices)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoices', error: error.message })
  }
})

// Get single invoice
router.get('/:id', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId
      },
      include: {
        client: true,
        items: true
      }
    })

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }

    res.json(invoice)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoice', error: error.message })
  }
})

// Create invoice
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('Received invoice data:', JSON.stringify(req.body, null, 2))
    
    const { invoice_number, invoiceNumber, client_id, clientId, issue_date, due_date, tax, discount, items } = req.body

    // Validate required fields
    if (!invoice_number && !invoiceNumber) {
      return res.status(400).json({ message: 'Invoice number is required' })
    }
    if (!client_id && !clientId) {
      return res.status(400).json({ message: 'Client is required' })
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' })
    }

    const actualInvoiceNumber = invoiceNumber || invoice_number
    const actualClientId = client_id || clientId

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.rate)), 0)
    const total = subtotal + (parseFloat(tax) || 0) - (parseFloat(discount) || 0)

    console.log('Calculated subtotal:', subtotal, 'total:', total)

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: actualInvoiceNumber,
        userId: req.userId,
        clientId: parseInt(actualClientId),
        issue_date: new Date(issue_date),
        due_date: new Date(due_date),
        status: 'Sent',
        subtotal,
        gst: parseFloat(gst) || 0,
        discount: parseFloat(discount) || 0,
        total,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            rate: parseFloat(item.rate),
            amount: parseFloat(item.quantity) * parseFloat(item.rate)
          }))
        }
      },
      include: {
        client: true,
        items: true
      }
    })

    console.log('Invoice created successfully:', invoice.id)
    res.status(201).json(invoice)
  } catch (error) {
    console.error('Failed to create invoice:', error)
    res.status(500).json({ 
      message: 'Failed to create invoice', 
      error: error.message,
      details: error.toString()
    })
  }
})

// Update invoice
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { invoice_number, invoiceNumber, client_id, clientId, issue_date, due_date, tax, discount, items } = req.body

    const actualInvoiceNumber = invoiceNumber || invoice_number
    const actualClientId = client_id || clientId

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.rate)), 0)
    const total = subtotal + (parseFloat(tax) || 0) - (parseFloat(discount) || 0)

    // Delete old items
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: parseInt(req.params.id) }
    })

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(req.params.id) },
      data: {
        invoiceNumber: actualInvoiceNumber,
        clientId: parseInt(actualClientId),
        issue_date: new Date(issue_date),
        due_date: new Date(due_date),
        subtotal,
        gst: parseFloat(gst) || 0,
        discount: parseFloat(discount) || 0,
        total,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            rate: parseFloat(item.rate),
            amount: parseFloat(item.quantity) * parseFloat(item.rate)
          }))
        }
      },
      include: {
        client: true,
        items: true
      }
    })

    res.json(invoice)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update invoice', error: error.message })
  }
})

// Delete invoice
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: parseInt(req.params.id) }
    })

    await prisma.invoice.delete({
      where: { id: parseInt(req.params.id) }
    })

    res.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete invoice', error: error.message })
  }
})

export default router
