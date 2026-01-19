import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get all clients
router.get('/', authenticate, async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.json(clients)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch clients', error: error.message })
  }
})

// Get single client
router.get('/:id', authenticate, async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: {
        id: parseInt(req.params.id),
        userId: req.userId
      }
    })

    if (!client) {
      return res.status(404).json({ message: 'Client not found' })
    }

    res.json(client)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch client', error: error.message })
  }
})

// Create client
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        userId: req.userId
      }
    })

    res.status(201).json(client)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create client', error: error.message })
  }
})

// Update client
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, email, phone, address } = req.body

    const client = await prisma.client.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email, phone, address }
    })

    res.json(client)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update client', error: error.message })
  }
})

// Delete client
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.client.delete({
      where: { id: parseInt(req.params.id) }
    })

    res.json({ message: 'Client deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete client', error: error.message })
  }
})

export default router
