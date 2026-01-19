import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/Invoices'
import InvoiceDetail from './pages/InvoiceDetail'
import CreateInvoice from './pages/CreateInvoice'
import Clients from './pages/Clients'
import Payments from './pages/Payments'
import TransactionImport from './pages/TransactionImport'
import TransactionMatching from './pages/TransactionMatching'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/invoices/new" element={<CreateInvoice />} />
            <Route path="/invoices/edit/:id" element={<CreateInvoice />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/import" element={<TransactionImport />} />
            <Route path="/transaction-matching" element={<TransactionMatching />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  )
}

export default App
