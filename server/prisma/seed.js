import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword
    }
  })

  console.log('✅ Created user:', user.email)

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1-555-0123',
        address: '123 Business St, New York, NY 10001',
        userId: user.id
      }
    }),
    prisma.client.create({
      data: {
        name: 'TechStart LLC',
        email: 'info@techstart.com',
        phone: '+1-555-0456',
        address: '456 Tech Ave, San Francisco, CA 94105',
        userId: user.id
      }
    }),
    prisma.client.create({
      data: {
        name: 'Global Industries',
        email: 'hello@globalindustries.com',
        phone: '+1-555-0789',
        address: '789 Industry Blvd, Chicago, IL 60601',
        userId: user.id
      }
    })
  ])

  console.log('✅ Created', clients.length, 'clients')

  // Create invoices
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-001',
        userId: user.id,
        clientId: clients[0].id,
        issue_date: new Date('2026-01-01'),
        due_date: new Date('2026-01-31'),
        status: 'Paid',
        subtotal: 5000,
        gst: 10,
        discount: 0,
        total: 5500,
        items: {
          create: [
            {
              description: 'Web Development Services',
              quantity: 40,
              rate: 100,
              amount: 4000
            },
            {
              description: 'UI/UX Design',
              quantity: 20,
              rate: 50,
              amount: 1000
            }
          ]
        }
      }
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-002',
        userId: user.id,
        clientId: clients[1].id,
        issue_date: new Date('2026-01-05'),
        due_date: new Date('2026-02-05'),
        status: 'Sent',
        subtotal: 3000,
        gst: 10,
        discount: 200,
        total: 3100,
        items: {
          create: [
            {
              description: 'Mobile App Development',
              quantity: 30,
              rate: 100,
              amount: 3000
            }
          ]
        }
      }
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-003',
        userId: user.id,
        clientId: clients[2].id,
        issue_date: new Date('2026-01-10'),
        due_date: new Date('2026-01-15'),
        status: 'Overdue',
        subtotal: 2500,
        gst: 10,
        discount: 0,
        total: 2750,
        items: {
          create: [
            {
              description: 'Consulting Services',
              quantity: 25,
              rate: 100,
              amount: 2500
            }
          ]
        }
      }
    })
  ])

  console.log('✅ Created', invoices.length, 'invoices')

  // Create payments
  await prisma.payment.create({
    data: {
      invoiceId: invoices[0].id,
      amount_paid: 5500,
      payment_date: new Date('2026-01-25'),
      payment_mode: 'Bank Transfer'
    }
  })

  console.log('✅ Created payment')
  console.log('🎉 Seeding complete!')
  console.log('\n📝 Demo credentials:')
  console.log('   Email: demo@example.com')
  console.log('   Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
