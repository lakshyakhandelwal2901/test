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
    
    const { 
      invoice_number, invoiceNumber, 
      client_id, clientId,
      consignee_name, consignee_address, consignee_contact,
      buyer_name, buyer_address, buyer_contact,
      issue_date, due_date, gst, discount, items, status 
    } = req.body

    // Validate required fields
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' })
    }

    // Generate invoice number if not provided
    const actualInvoiceNumber = invoiceNumber || invoice_number || `INV-${Date.now()}`
    const actualClientId = client_id || clientId || null

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.rate)), 0)
    const gstAmount = (subtotal - (parseFloat(discount) || 0)) * (parseFloat(gst) || 0) / 100
    const total = subtotal + gstAmount - (parseFloat(discount) || 0)

    console.log('Calculated subtotal:', subtotal, 'total:', total)

    const invoiceData = {
      invoiceNumber: actualInvoiceNumber,
      userId: req.userId,
      issue_date: new Date(issue_date),
      due_date: new Date(due_date),
      status: status || 'Sent',
      subtotal,
      gst: parseFloat(gst) || 0,
      discount: parseFloat(discount) || 0,
      total: Math.round(total * 100) / 100,
      consignee_name,
      consignee_address,
      consignee_contact,
      buyer_name,
      buyer_address,
      buyer_contact,
      items: {
        create: items.map(item => ({
          description: item.description,
          hsn: item.hsn || '7116',
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.quantity) * parseFloat(item.rate)
        }))
      }
    }

    // Only add clientId if provided
    if (actualClientId) {
      invoiceData.clientId = parseInt(actualClientId)
    }

    const invoice = await prisma.invoice.create({
      data: invoiceData,
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
    const { 
      invoice_number, invoiceNumber,
      client_id, clientId,
      consignee_name, consignee_address, consignee_contact,
      buyer_name, buyer_address, buyer_contact,
      issue_date, due_date, gst, discount, items, status 
    } = req.body

    const actualInvoiceNumber = invoiceNumber || invoice_number || `INV-${Date.now()}`
    const actualClientId = client_id || clientId || null

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.rate)), 0)
    const gstAmount = (subtotal - (parseFloat(discount) || 0)) * (parseFloat(gst) || 0) / 100
    const total = subtotal + gstAmount - (parseFloat(discount) || 0)

    // Delete old items
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: parseInt(req.params.id) }
    })

    const updateData = {
      invoiceNumber: actualInvoiceNumber,
      issue_date: new Date(issue_date),
      due_date: new Date(due_date),
      status: status,
      subtotal,
      gst: parseFloat(gst) || 0,
      discount: parseFloat(discount) || 0,
      total: Math.round(total * 100) / 100,
      consignee_name,
      consignee_address,
      consignee_contact,
      buyer_name,
      buyer_address,
      buyer_contact,
      items: {
        create: items.map(item => ({
          description: item.description,
          hsn: item.hsn || '7116',
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.quantity) * parseFloat(item.rate)
        }))
      }
    }

    // Only add clientId if provided
    if (actualClientId) {
      updateData.clientId = parseInt(actualClientId)
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
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
