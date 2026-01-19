import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data)
    if (error.response?.status === 401) {
      // Token expired, clear and redirect to login
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const register = (data) => API.post('/auth/register', data)
export const login = (data) => API.post('/auth/login', data)

// Invoices
export const getInvoices = (params) => API.get('/invoices', { params })
export const getInvoice = (id) => API.get(`/invoices/${id}`)
export const createInvoice = (data) => API.post('/invoices', data)
export const updateInvoice = (id, data) => API.put(`/invoices/${id}`, data)
export const deleteInvoice = (id) => API.delete(`/invoices/${id}`)

// Clients
export const getClients = () => API.get('/clients')
export const getClient = (id) => API.get(`/clients/${id}`)
export const createClient = (data) => API.post('/clients', data)
export const updateClient = (id, data) => API.put(`/clients/${id}`, data)
export const deleteClient = (id) => API.delete(`/clients/${id}`)

// Payments
export const getPayments = (invoiceId) => API.get(`/payments/invoice/${invoiceId}`)
export const createPayment = (data) => API.post('/payments', data)

// Reports
export const getReports = (params) => API.get('/reports', { params })

// Transactions
export const uploadTransactions = (csvData) => API.post('/transactions/upload', { csvData })
export const getTransactionMatches = (csvData) => API.post('/transactions/get-matches', { csvData })
export const confirmMatches = (matches) => API.post('/transactions/confirm-matches', { matches })
export const recordTransactionPayment = (data) => API.post('/transactions/record-payment', data)
export const bulkRecordPayments = (payments) => API.post('/transactions/bulk-record', { payments })

export default API
