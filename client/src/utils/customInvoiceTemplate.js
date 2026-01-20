import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrencyForPDF, formatDate, convertNumberToWords } from './calculations'

export const generateCustomInvoicePDF = (invoice) => {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 5
  const footerSpace = 6
  const maxContentHeight = pageHeight - margin - footerSpace
  
  let yPos = margin
  // Get company info from localStorage
  const companyInfo = JSON.parse(localStorage.getItem('companyInfo') || '{}')

  const company = {
    name: companyInfo.companyName || 'SRI RAM GEMS',
    address: companyInfo.address || '36,37 , LAXMI VIHAR COLONY\nNEAR SUNIL HOSPITAL\nNAYLA ROAD\nKANOTA:- 303012',
    gstin: companyInfo.gstin || '08AGNPK3532E1ZH',
    mobile: companyInfo.mobile || '+91 9928151922',
    email: companyInfo.email || 'shriramgems@yahoo.com',
    pan: companyInfo.pan || 'AGNPK3532E'
  }

  const consignee = {
    name: invoice.consignee_name || invoice.client?.name || 'Consignee Name',
    address: invoice.consignee_address || invoice.client?.address || 'Address not provided',
    contact: invoice.consignee_contact || invoice.client?.phone || 'Contact not provided'
  }

  const buyer = {
    name: invoice.buyer_name || invoice.client?.name || 'Buyer Name',
    address: invoice.buyer_address || invoice.client?.address || 'Address not provided',
    contact: invoice.buyer_contact || invoice.client?.phone || 'Contact not provided'
  }

  // ===== TITLE =====
  doc.setFontSize(22)
  doc.setFont(undefined, 'bold')
  doc.text('TAX INVOICE', pageWidth / 2, yPos + 6, { align: 'center' })
  yPos += 10

  const usableWidth = pageWidth - margin * 2
  const leftWidth = usableWidth * 0.48
  const rightWidth = usableWidth - leftWidth
  const leftX = margin
  const rightX = leftX + leftWidth

  const topStartY = yPos
  let leftY = topStartY + 6
  const sectionSplitLines = []

  // Company block
  doc.setFont(undefined, 'bold')
  doc.setFontSize(10.5)
  doc.text((company.name || '').toUpperCase(), leftX + 2, leftY)
  leftY += 5

  doc.setFont(undefined, 'bold')
  doc.setFontSize(8.6)
  const companyLines = [
    ...company.address.split('\n'),
    `GST NO:- ${company.gstin}`,
    `MOBILE:- ${company.mobile}`,
    `E-Mail :- ${company.email}`
  ]
  companyLines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, leftWidth - 8)
    wrapped.forEach(wLine => {
      doc.text(wLine, leftX + 2, leftY)
      leftY += 4
    })
  })
  leftY += 2
  sectionSplitLines.push(leftY)

  // Consignee block
  doc.setFont(undefined, 'bold')
  doc.setFontSize(9)
  doc.text('CONSIGNEE (SHIP TO)', leftX + 2, leftY + 4)
  leftY += 9

  doc.text('TO', leftX + 2, leftY)
  leftY += 4

  doc.setFont(undefined, 'bold')
  doc.setFontSize(8.6)
  const consigneeAddressLines = (consignee.address || 'Address not provided')
    .split('\n')
    .flatMap(line => doc.splitTextToSize(line, leftWidth - 8))
  const consigneeLines = [
    (consignee.name || 'Consignee Name').toUpperCase(),
    ...consigneeAddressLines,
    `CONTACT :- ${consignee.contact || 'Not provided'}`
  ]
  consigneeLines.forEach(line => {
    doc.text(line, leftX + 2, leftY)
    leftY += 4
  })
  leftY += 2
  sectionSplitLines.push(leftY)

  // Buyer block
  doc.setFont(undefined, 'bold')
  doc.setFontSize(9)
  doc.text('BUYER (BILL TO)', leftX + 2, leftY + 4)
  leftY += 9

  doc.text('TO', leftX + 2, leftY)
  leftY += 4

  doc.setFont(undefined, 'bold')
  doc.setFontSize(8.6)
  const buyerAddressLines = (buyer.address || 'Address not provided')
    .split('\n')
    .flatMap(line => doc.splitTextToSize(line, leftWidth - 8))
  const buyerLines = [
    (buyer.name || 'Buyer Name').toUpperCase(),
    ...buyerAddressLines,
    `CONTACT :- ${buyer.contact || 'Not provided'}`
  ]
  buyerLines.forEach(line => {
    doc.text(line, leftX + 2, leftY)
    leftY += 4
  })
  leftY += 3

  const leftBlockHeight = leftY - topStartY 

  // ===== RIGHT BLOCK - Invoice meta grid =====
  let rightY = topStartY
  const rowHalf = rightWidth / 2

  doc.setFontSize(8.5)
  doc.setFont(undefined, 'bold')

  const rightRows = [
    { l: 'Invoice No.', lv: invoice.invoiceNumber || '', r: 'Dated', rv: formatDate(invoice.issue_date), h: 8 },
    { l: 'Delivery Note', lv: '', r: 'Mode/Terms of Payment', rv: '', h: 7 },
    { l: 'Reference No. & Date.', lv: '', r: 'Other References', rv: '', h: 7 },
    { l: "Buyer's Order No.", lv: '', r: 'Dated', rv: formatDate(invoice.due_date), h: 7 },
    { l: 'Dispatch Doc No.', lv: '', r: 'Delivery Note Date', rv: '', h: 7 },
    { l: 'Dispatched Through', lv: '', r: 'Destination', rv: '', h: 7 }
  ]

  rightRows.forEach((row, idx) => {
    doc.rect(rightX, rightY, rowHalf, row.h)
    doc.rect(rightX + rowHalf, rightY, rowHalf, row.h)

    doc.setFont(undefined, 'bold')
    doc.text(row.l, rightX + 2, rightY + 5)

    doc.setFont(undefined, 'normal')
    doc.text(row.lv || '', rightX + rowHalf - 2, rightY + 5, { align: 'right' })

    doc.setFont(undefined, 'bold')
    doc.text(row.r, rightX + rowHalf + 2, rightY + 5)

    if (row.r === 'Dated' && idx === 0) {
      doc.setFontSize(12)
      doc.text(row.rv || '', rightX + rightWidth - 2, rightY + 6, { align: 'right' })
      doc.setFontSize(8.5)
    } else {
      doc.setFont(undefined, 'normal')
      doc.text(row.rv || '', rightX + rightWidth - 2, rightY + 5, { align: 'right' })
    }

    rightY += row.h
    doc.setFont(undefined, 'bold')
  })

  const termsHeight = 35
  doc.rect(rightX, rightY, rightWidth, termsHeight)
  doc.setFont(undefined, 'bold')
  doc.text('Terms of Delivery', rightX + 2, rightY + 6)
  rightY += termsHeight

  const rightBlockHeight = rightY - topStartY

  // ===== OUTER BORDER =====
  const topBlockHeight = Math.max(leftBlockHeight, rightBlockHeight)
  doc.rect(leftX, topStartY, leftWidth, topBlockHeight)
  doc.rect(rightX, topStartY, rightWidth, topBlockHeight)
  sectionSplitLines.forEach(lineY => {
    doc.line(leftX, lineY, leftX + leftWidth, lineY)
  })

  yPos = topStartY + topBlockHeight + 4

  // ===== ITEMS TABLE =====
  const checkPageBreak = (requiredHeight) => {
    if (yPos + requiredHeight > maxContentHeight) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  const taxableValue = invoice.subtotal - invoice.discount
  const gstAmount = taxableValue * (invoice.gst / 100)
  const total = invoice.total
  const totalQty = invoice.items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0)

  const itemRows = invoice.items.map((item, index) => ([
    (index + 1).toString(),
    item.description || '',
    item.hsn || item.hsnCode || '',
    `${item.quantity}`,
    formatCurrencyForPDF(item.rate),
    item.per || 'GMS',
    formatCurrencyForPDF(item.amount)
  ]))

  const gstRow = ['', `IGST OUTPUT@${invoice.gst || 0}%`, '', '', '', '', formatCurrencyForPDF(gstAmount)]
  const totalRow = ['', 'TOTAL', '', totalQty ? `${totalQty}` : '', '', '', formatCurrencyForPDF(total)]

  const estimatedTableHeight = (itemRows.length + 2) * 8 + 12
  checkPageBreak(estimatedTableHeight + 15)

  autoTable(doc, {
    startY: yPos,
    head: [['S.NO', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Rate', 'Per', 'Amount']],
    body: itemRows.concat([gstRow, totalRow]),
    margin: { left: margin, right: margin },
    pageBreak: 'auto',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      halign: 'center',
      valign: 'middle',
      textColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 70, halign: 'left' },
      2: { cellWidth: 18 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 14 },
      6: { cellWidth: 30, halign: 'right' }
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontStyle: 'normal',
      textColor: [0, 0, 0]
    },
    didParseCell: (data) => {
      const isGST = data.row.index === itemRows.length
      const isTotal = data.row.index === itemRows.length + 1
      if (isGST) {
        data.cell.styles.fontStyle = 'italic'
      }
      if (isTotal) {
        data.cell.styles.fontStyle = 'bold'
      }
    }
  })

  yPos = doc.lastAutoTable.finalY + 4
  

  // ===== AMOUNT IN WORDS =====
  doc.setFont(undefined, 'bold')
  doc.setFontSize(8.5)
  doc.text('Amount Chargeable (in words)   E. & O.E', margin, yPos)
  yPos += 5
  doc.setFont(undefined, 'normal')
  doc.text(`INR ${convertNumberToWords(Math.round(total))} ONLY`, margin, yPos)
  yPos += 8

  // ===== TAX BREAKDOWN TABLE =====
  const taxHead = [
    'Taxable Value',
    { content: 'Integrated Tax', colSpan: 2, styles: { halign: 'center' } },
    'Total Tax Amount'
  ]
  const taxHead2 = ['', 'Rate', 'Amount', '']
  const taxBody = [
    [
      formatCurrencyForPDF(taxableValue),
      `${invoice.gst}%`,
      formatCurrencyForPDF(gstAmount),
      formatCurrencyForPDF(gstAmount)
    ]
  ]

  autoTable(doc, {
    startY: yPos,
    head: [taxHead, taxHead2],
    body: taxBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.35,
      halign: 'center',
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [240, 240, 240],
      fontStyle: 'bold',
      textColor: [0, 0, 0]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 36 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 32 }
    }
  })

  yPos = doc.lastAutoTable.finalY + 4

  // Check page break before footer
  checkPageBreak(20)

  // Tax amount in words
  doc.setFont(undefined, 'bold')
  doc.setFontSize(8.5)
  doc.text('Tax Amount (in words) :', margin, yPos)
  doc.setFont(undefined, 'normal')
  doc.text(`INR ${convertNumberToWords(Math.round(gstAmount))} ONLY`, margin + 45, yPos)
  yPos += 10

  // ===== DECLARATION & SIGNATURE =====
  const panY = yPos
  doc.setFont(undefined, 'bold')
  doc.setFontSize(8)
  doc.text(`Company's PAN   :   ${company.pan}`, margin, panY)
  doc.text('For SRI RAM GEMS', pageWidth - margin - 50, panY)
  yPos += 6
  doc.text('Declaration :-', margin, yPos)
  yPos += 4
  doc.setFont(undefined, 'normal')
  doc.setFontSize(7.5)
  doc.text('We declare that this invoice shows the actual price of the', margin, yPos)
  yPos += 3.5
  doc.text('goods described and that all particulars are true and correct.', margin, yPos)

  // Signature line
  const sigY = panY + 20
  doc.line(pageWidth - margin - 50, sigY, pageWidth - margin - 10, sigY)
  doc.setFont(undefined, 'bold')
  doc.setFontSize(8)
  doc.text('Authorised Signatory', pageWidth - margin - 45, sigY + 5)

  // ===== FOOTER ON ALL PAGES =====
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setFont(undefined, 'bold')
    doc.text('THIS IS A COMPUTER GENERATED INVOICE', pageWidth / 2, pageHeight - 4, { align: 'center' })
  }

  return doc
}
