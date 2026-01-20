import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getClients, createInvoice, updateInvoice, getInvoice, createPayment } from '../services/api'
import InvoiceForm from '../components/InvoiceForm'

const CreateInvoice = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [clients, setClients] = useState([])
  const [initialData, setInitialData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const clientsRes = await getClients()
      setClients(clientsRes.data)

      if (id) {
        const invoiceRes = await getInvoice(id)
        setInitialData(invoiceRes.data)
      }
      setError('')
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data, markAsPaid = false) => {
    try {
      console.log('Submitting invoice data:', data)
      setError('')
      
      // Set status based on button clicked
      const dataWithStatus = {
        ...data,
        status: markAsPaid ? 'Paid' : 'Sent'
      }
      
      let invoiceId
      if (id) {
        await updateInvoice(id, dataWithStatus)
        invoiceId = id
      } else {
        const response = await createInvoice(dataWithStatus)
        invoiceId = response.data.id
      }

      // If marked as paid, create a payment for the full amount
      if (markAsPaid && invoiceId) {
        const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
        const discountAmount = data.discount || 0
        const subtotalAfterDiscount = subtotal - discountAmount
        const gstAmount = subtotalAfterDiscount * ((data.gst || 0) / 100)
        await createPayment({
          invoice_id: parseInt(invoiceId),
          amount_paid: subtotalAfterDiscount + gstAmount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_mode: 'Cash'
        })
      }

      navigate('/invoices')
    } catch (error) {
      console.error('Failed to save invoice:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save invoice'
      setError(errorMessage)
      alert(errorMessage)
    }
  }

  const handleCancel = () => {
    navigate('/invoices')
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (clients.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Invoice</h1>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p>You need to create at least one client before creating an invoice.</p>
          <button
            onClick={() => navigate('/clients')}
            className="mt-2 text-yellow-800 underline hover:text-yellow-900"
          >
            Go to Clients page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        {id ? 'Edit Invoice' : 'Create New Invoice'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <InvoiceForm
          initialData={initialData}
          clients={clients}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

export default CreateInvoice
