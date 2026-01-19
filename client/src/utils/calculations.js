export const calculateItemAmount = (quantity, rate) => {
  return (parseFloat(quantity) || 0) * (parseFloat(rate) || 0)
}

export const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => sum + calculateItemAmount(item.quantity, item.rate), 0)
}

export const calculateTotal = (subtotal, gst, discount) => {
  const discountAmount = (parseFloat(discount) || 0)
  const subtotalAfterDiscount = subtotal - discountAmount
  const gstAmount = (subtotalAfterDiscount * (parseFloat(gst) || 0)) / 100
  return subtotalAfterDiscount + gstAmount
}

export const getInvoiceStatus = (totalPaid, total, dueDate) => {
  const today = new Date()
  const due = new Date(dueDate)
  
  if (totalPaid === 0) return 'Sent'
  if (totalPaid >= total) return 'Paid'
  if (totalPaid < total && today > due) return 'Overdue'
  if (totalPaid < total) return 'Partially Paid'
  
  return 'Sent'
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount)
}

export const formatCurrencyForPDF = (amount) => {
  // Format for PDF without special characters
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
  return `Rs. ${formatted}`
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
