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

export const convertNumberToWords = (num) => {
  if (num === 0) return 'ZERO'
  
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE']
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN']
  
  const numStr = Math.floor(num).toString()
  const len = numStr.length
  
  let words = ''
  
  // Crores
  if (len > 7) {
    const crores = parseInt(numStr.substring(0, len - 7))
    if (crores > 0) {
      words += convertTwoDigits(crores, ones, tens, teens) + ' CRORE '
    }
  }
  
  // Lakhs
  if (len > 5) {
    const lakhs = parseInt(numStr.substring(Math.max(0, len - 7), len - 5))
    if (lakhs > 0) {
      words += convertTwoDigits(lakhs, ones, tens, teens) + ' LAKH '
    }
  }
  
  // Thousands
  if (len > 3) {
    const thousands = parseInt(numStr.substring(Math.max(0, len - 5), len - 3))
    if (thousands > 0) {
      words += convertTwoDigits(thousands, ones, tens, teens) + ' THOUSAND '
    }
  }
  
  // Hundreds
  if (len > 2) {
    const hundreds = parseInt(numStr[len - 3])
    if (hundreds > 0) {
      words += ones[hundreds] + ' HUNDRED '
    }
  }
  
  // Last two digits
  const lastTwo = parseInt(numStr.substring(len - 2))
  if (lastTwo > 0) {
    words += convertTwoDigits(lastTwo, ones, tens, teens)
  }
  
  return words.trim() + ' RUPEES'
}

const convertTwoDigits = (num, ones, tens, teens) => {
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]
  return tens[Math.floor(num / 10)] + (num % 10 > 0 ? ' ' + ones[num % 10] : '')
}
