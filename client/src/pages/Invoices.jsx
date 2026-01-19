import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInvoices, deleteInvoice } from '../services/api'
import InvoiceTable from '../components/InvoiceTable'
import { generateBulkInvoicesPDF, generateBulkInvoicesCSV } from '../utils/pdfExport'

const Invoices = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await getInvoices()
      setInvoices(response.data)
      setError('')
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      setError(error.response?.data?.message || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleView = (id) => {
    navigate(`/invoices/${id}`)
  }

  const handleEdit = (id) => {
    navigate(`/invoices/edit/${id}`)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id)
        fetchInvoices()
      } catch (error) {
        console.error('Failed to delete invoice:', error)
      }
    }
  }

  const getDateRange = () => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    switch (dateFilter) {
      case 'month':
        return {
          start: new Date(today.getFullYear(), today.getMonth(), 1),
          end: startOfDay
        }
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3)
        return {
          start: new Date(today.getFullYear(), quarter * 3, 1),
          end: startOfDay
        }
      case 'year':
        return {
          start: new Date(today.getFullYear(), 0, 1),
          end: startOfDay
        }
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : null,
          end: customEndDate ? new Date(customEndDate) : null
        }
      default:
        return { start: null, end: null }
    }
  }

  const getFilteredInvoices = () => {
    let filtered = invoices.filter(inv => {
      const invoiceNum = inv.invoice_number || ''
      const clientName = inv.client?.name || ''
      return invoiceNum.toLowerCase().includes(filter.toLowerCase()) ||
             clientName.toLowerCase().includes(filter.toLowerCase())
    })

    if (dateFilter !== 'all' && dateFilter !== '') {
      const { start, end } = getDateRange()
      if (start && end) {
        filtered = filtered.filter(inv => {
          const invDate = new Date(inv.issue_date)
          return invDate >= start && invDate <= end
        })
      }
    }

    return filtered
  }

  const filteredInvoices = getFilteredInvoices()

  const handleDownloadPDF = () => {
    if (filteredInvoices.length === 0) {
      alert('No invoices to export')
      return
    }
    try {
      const doc = generateBulkInvoicesPDF(filteredInvoices)
      const dateRangeText = dateFilter === 'all' ? 'all' : dateFilter
      doc.save(`invoices-${dateRangeText}-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      console.error('Error details:', err.message, err.stack)
      alert('Failed to generate PDF: ' + err.message)
    }
  }

  const handleDownloadCSV = () => {
    if (filteredInvoices.length === 0) {
      alert('No invoices to export')
      return
    }
    try {
      const csv = generateBulkInvoicesCSV(filteredInvoices)
      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
      const dateRangeText = dateFilter === 'all' ? 'all' : dateFilter
      element.setAttribute('download', `invoices-${dateRangeText}-${new Date().toISOString().split('T')[0]}.csv`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (err) {
      console.error('Failed to generate CSV:', err)
      alert('Failed to generate CSV')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
        <button
          onClick={() => navigate('/invoices/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Create Invoice
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Date Filter and Export Section */}
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDateFilter('all')
                setShowCustomDatePicker(false)
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                dateFilter === 'all'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setDateFilter('month')
                setShowCustomDatePicker(false)
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                dateFilter === 'month'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => {
                setDateFilter('quarter')
                setShowCustomDatePicker(false)
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                dateFilter === 'quarter'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Quarter
            </button>
            <button
              onClick={() => {
                setDateFilter('year')
                setShowCustomDatePicker(false)
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                dateFilter === 'year'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Year
            </button>
            <button
              onClick={() => {
                setDateFilter('custom')
                setShowCustomDatePicker(!showCustomDatePicker)
              }}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                dateFilter === 'custom'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Date
            </button>
          </div>
        </div>

        {/* Custom Date Picker */}
        {showCustomDatePicker && dateFilter === 'custom' && (
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Download PDF
          </button>
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Download CSV
          </button>
          {filteredInvoices.length > 0 && (
            <span className="text-sm text-gray-600 ml-4">
              {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search invoices..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full md:w-1/3 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No invoices found</div>
        ) : (
          <InvoiceTable
            invoices={filteredInvoices}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}

export default Invoices
