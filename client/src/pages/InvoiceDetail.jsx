import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getInvoice, getPayments, createPayment } from '../services/api'
import { formatCurrency, formatDate, getInvoiceStatus } from '../utils/calculations'
import { generateInvoicePDF } from '../utils/pdfExport'
import { generateCustomInvoicePDF } from '../utils/customInvoiceTemplate'

const InvoiceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showPdfMenu, setShowPdfMenu] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('Bank Transfer')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [invoiceRes, paymentsRes] = await Promise.all([
        getInvoice(id),
        getPayments(id)
      ])
      setInvoice(invoiceRes.data)
      setPayments(paymentsRes.data)
      setError('')
    } catch (err) {
      console.error('Failed to fetch invoice:', err)
      setError('Failed to load invoice details')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    try {
      setSubmitting(true)
      await createPayment({
        invoice_id: parseInt(id),
        amount_paid: parseFloat(paymentAmount),
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: paymentMode
      })
      
      // Refresh invoice and payments
      await fetchData()
      setPaymentAmount('')
      setShowPaymentForm(false)
    } catch (err) {
      console.error('Failed to add payment:', err)
      alert('Failed to add payment')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = (useCustomTemplate = false) => {
    try {
      // If not specified, use the saved preference from localStorage
      const template = useCustomTemplate !== false 
        ? useCustomTemplate 
        : localStorage.getItem('invoiceTemplate') === 'custom';
      
      const doc = template
        ? generateCustomInvoicePDF(invoice, payments)
        : generateInvoicePDF(invoice, payments);
      doc.save(`invoice-${invoice.invoiceNumber}.pdf`)
      setShowPdfMenu(false)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      alert('Failed to generate PDF: ' + err.message)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading invoice...</div>
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/invoices')}
          className="text-indigo-600 hover:text-indigo-900 mb-4"
        >
          ← Back to Invoices
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Invoice not found'}
        </div>
      </div>
    )
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0)
  const outstandingAmount = invoice.total - totalPaid
  const status = getInvoiceStatus(totalPaid, invoice.total, invoice.due_date)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/invoices')}
          className="text-indigo-600 hover:text-indigo-900"
        >
          ← Back to Invoices
        </button>
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Print
          </button>
          <div className="relative">
            <button
              onClick={() => setShowPdfMenu(!showPdfMenu)}
              className="px-4 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
            >
              Download PDF
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showPdfMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => handleDownloadPDF(false)}
                  className={`w-full text-left px-4 py-3 text-sm rounded-t-lg transition ${
                    localStorage.getItem('invoiceTemplate') !== 'custom'
                      ? 'bg-blue-50 text-blue-700 border-b border-gray-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium flex items-center gap-2">
                    {localStorage.getItem('invoiceTemplate') !== 'custom' && <span>✓</span>}
                    Standard Template
                  </div>
                  <div className="text-xs text-gray-500">Default invoice layout</div>
                </button>
                <button
                  onClick={() => handleDownloadPDF(true)}
                  className={`w-full text-left px-4 py-3 text-sm rounded-b-lg transition ${
                    localStorage.getItem('invoiceTemplate') === 'custom'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 border-t border-gray-100'
                  }`}
                >
                  <div className="font-medium flex items-center gap-2">
                    {localStorage.getItem('invoiceTemplate') === 'custom' && <span>✓</span>}
                    Custom Template
                  </div>
                  <div className="text-xs text-gray-500">Tax invoice with GST format</div>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate(`/invoices/edit/${id}`)}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-8 print:shadow-none">
        {/* Header */}
        <div className="mb-8 pb-8 border-b">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-gray-500 mt-2">Invoice #{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                status === 'Paid' ? 'bg-green-100 text-green-800' :
                status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                status === 'Overdue' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {status}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Bill To:</h3>
              <p className="text-gray-900 font-medium">{invoice.client?.name}</p>
              <p className="text-gray-600">{invoice.client?.email}</p>
              {invoice.client?.phone && <p className="text-gray-600">{invoice.client?.phone}</p>}
              {invoice.client?.address && <p className="text-gray-600">{invoice.client?.address}</p>}
            </div>
            <div className="text-right">
              <div className="mb-2">
                <p className="text-sm text-gray-600">Invoice Date</p>
                <p className="text-gray-900 font-medium">{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="text-gray-900 font-medium">{formatDate(invoice.due_date)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Qty</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Rate</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 px-4 text-gray-900">{item.description}</td>
                  <td className="text-center py-3 px-4 text-gray-900">{item.quantity}</td>
                  <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(item.rate)}</td>
                  <td className="text-right py-3 px-4 text-gray-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div></div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.gst > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">GST ({invoice.gst}%):</span>
                <span className="text-gray-900">{formatCurrency((invoice.subtotal - invoice.discount) * (invoice.gst / 100))}</span>
              </div>
            )}
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="text-gray-900">-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 font-semibold text-lg">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-gray-900 font-medium">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid Amount:</span>
              <span className="text-green-600 font-medium">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-semibold">Outstanding:</span>
              <span className={`font-semibold ${outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(outstandingAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Mode</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-3 px-4">{formatDate(payment.payment_date)}</td>
                    <td className="text-right py-3 px-4 text-green-600 font-medium">{formatCurrency(payment.amount_paid)}</td>
                    <td className="py-3 px-4">{payment.payment_mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Payment Section */}
      <div className="print:hidden">
        {outstandingAmount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
            {!showPaymentForm ? (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Payment
              </button>
            ) : (
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={`Up to ${formatCurrency(outstandingAmount)}`}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option>Bank Transfer</option>
                      <option>Cash</option>
                      <option>Credit Card</option>
                      <option>Cheque</option>
                      <option>UPI</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? 'Recording...' : 'Record Payment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        {outstandingAmount <= 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-green-800">✓ This invoice has been fully paid!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InvoiceDetail
