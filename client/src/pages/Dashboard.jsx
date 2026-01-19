import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInvoices } from '../services/api'
import SummaryCard from '../components/SummaryCard'
import { formatCurrency } from '../utils/calculations'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0
  })
  const [recentInvoices, setRecentInvoices] = useState([])
  const [chartData, setChartData] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await getInvoices()
      const invoices = response.data || []

      // Calculate stats
      const total = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
      const paid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.total || 0), 0)
      const unpaid = invoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + (inv.total || 0), 0)
      const overdue = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + (inv.total || 0), 0)

      setStats({ total, paid, unpaid, overdue })
      setRecentInvoices(invoices.slice(0, 5))

      // Chart data
      const statusCount = invoices.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1
        return acc
      }, {})

      setChartData(Object.entries(statusCount).map(([name, value]) => ({ name, value })))
      setError('')
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setError('Failed to load dashboard data')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your business overview</p>
        </div>
        <button
          onClick={() => navigate('/invoices/new')}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          + New Invoice
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Revenue"
          value={formatCurrency(stats.total)}
          color="indigo"
          icon={<span className="text-white text-2xl">💰</span>}
        />
        <SummaryCard
          title="Paid"
          value={formatCurrency(stats.paid)}
          color="green"
          icon={<span className="text-white text-2xl">✓</span>}
        />
        <SummaryCard
          title="Unpaid"
          value={formatCurrency(stats.unpaid)}
          color="yellow"
          icon={<span className="text-white text-2xl">⏳</span>}
        />
        <SummaryCard
          title="Overdue"
          value={formatCurrency(stats.overdue)}
          color="red"
          icon={<span className="text-white text-2xl">⚠</span>}
        />
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Invoice Status</h2>
            <span className="text-2xl">📊</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                }} 
              />
              <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Invoices</h2>
            <span className="text-2xl">📄</span>
          </div>
          <div className="space-y-4">
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-2">📋</p>
                <p>No invoices yet</p>
              </div>
            ) : (
              recentInvoices.map(invoice => (
                <div key={invoice.id} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                  <div>
                    <p className="font-semibold text-gray-900">{invoice.invoiceNumber || invoice.invoice_number}</p>
                    <p className="text-sm text-gray-500">{invoice.client?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
