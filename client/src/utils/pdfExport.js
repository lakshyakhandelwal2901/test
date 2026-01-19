import jsPDF from 'jspdf';
import { formatCurrencyForPDF, formatDate } from './calculations';

export const generateInvoicePDF = (invoice, payments) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Header
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, yPosition);
  
  // Status - Top Right
  yPosition = 20;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0);
  const status = invoice.status || 'Sent';
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(`Status: ${status}`, pageWidth - 70, yPosition);
  
  // Bill To section
  yPosition = 50;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('BILL TO:', 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(invoice.client?.name || 'N/A', 20, yPosition);
  yPosition += 6;
  if (invoice.client?.email) {
    doc.text(invoice.client.email, 20, yPosition);
    yPosition += 6;
  }
  if (invoice.client?.phone) {
    doc.text(invoice.client.phone, 20, yPosition);
    yPosition += 6;
  }
  if (invoice.client?.address) {
    doc.text(invoice.client.address, 20, yPosition);
    yPosition += 6;
  }

  // Dates - Top Right
  yPosition = 50;
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Invoice Date:', pageWidth - 70, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatDate(invoice.issue_date), pageWidth - 70, yPosition + 6);
  
  doc.setFont(undefined, 'bold');
  doc.text('Due Date:', pageWidth - 70, yPosition + 14);
  doc.setFont(undefined, 'normal');
  doc.text(formatDate(invoice.due_date), pageWidth - 70, yPosition + 20);

  // Items Table
  yPosition = 95;
  const tableData = invoice.items?.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrencyForPDF(item.rate),
    formatCurrencyForPDF(item.amount)
  ]) || [];

  doc.autoTable({
    startY: yPosition,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: [0, 0, 0]
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    margin: 20,
    didDrawPage: function (data) {
      // This will be called after the table is drawn
    }
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Totals section
  const totalLabel = pageWidth - 70;
  const totalValue = pageWidth - 30;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Subtotal:', totalLabel, yPosition);
  doc.text(formatCurrencyForPDF(invoice.subtotal), totalValue, yPosition, { align: 'right' });
  
  yPosition += 8;
  if (invoice.gst > 0) {
    const gstAmount = (invoice.subtotal - invoice.discount) * (invoice.gst / 100);
    doc.text(`GST (${invoice.gst}%):`, totalLabel, yPosition);
    doc.text(formatCurrencyForPDF(gstAmount), totalValue, yPosition, { align: 'right' });
    yPosition += 8;
  }
  
  if (invoice.discount > 0) {
    doc.text('Discount:', totalLabel, yPosition);
    doc.text(`-${formatCurrencyForPDF(invoice.discount)}`, totalValue, yPosition, { align: 'right' });
    yPosition += 8;
  }

  // Total with border
  yPosition += 2;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.line(totalLabel - 5, yPosition, pageWidth - 20, yPosition);
  doc.text('TOTAL:', totalLabel, yPosition + 8);
  doc.text(formatCurrencyForPDF(invoice.total), totalValue, yPosition + 8, { align: 'right' });

  // Payment Summary
  yPosition += 25;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('PAYMENT SUMMARY', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Amount: ${formatCurrencyForPDF(invoice.total)}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Paid Amount: ${formatCurrencyForPDF(totalPaid)}`, 20, yPosition);
  yPosition += 6;
  const outstanding = invoice.total - totalPaid;
  doc.text(`Outstanding: ${formatCurrencyForPDF(outstanding)}`, 20, yPosition);

  // Payment History if exists
  if (payments.length > 0) {
    yPosition += 15;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('PAYMENT HISTORY', 20, yPosition);
    
    yPosition += 10;
    
    // Payment history table
    const paymentHeaders = ['Date', 'Amount', 'Mode'];
    const paymentColWidths = [40, 40, 40];
    
    // Draw headers
    doc.setFillColor(79, 70, 229);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    
    let paymentXPos = 20;
    paymentHeaders.forEach((header, index) => {
      doc.rect(paymentXPos, yPosition - 6, paymentColWidths[index], 8, 'F');
      doc.text(header, paymentXPos + 2, yPosition);
      paymentXPos += paymentColWidths[index];
    });
    
    yPosition += 10;
    
    // Draw payment rows
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    payments.forEach((payment, index) => {
      const paymentRow = [
        formatDate(payment.payment_date),
        formatCurrencyForPDF(payment.amount_paid),
        payment.payment_mode
      ];
      
      paymentXPos = 20;
      paymentRow.forEach((cell, colIndex) => {
        doc.text(String(cell), paymentXPos + 2, yPosition);
        paymentXPos += paymentColWidths[colIndex];
      });
      
      yPosition += 7;
    });
  }

  return doc;
};

export const generateBulkInvoicesPDF = (invoices) => {
  const doc = new jsPDF('l'); // landscape
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICES REPORT', 20, 15);
  
  // Date range info
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated on: ${formatDate(new Date())}`, 20, 25);

  // Table headers
  const headers = ['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Total', 'Paid', 'Outstanding', 'Status'];
  const columnPositions = [15, 40, 75, 105, 135, 160, 190, 230];
  
  let yPosition = 35;
  const lineHeight = 7;
  
  // Draw header row
  doc.setFillColor(79, 70, 229);
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(9);
  
  headers.forEach((header, index) => {
    doc.text(header, columnPositions[index], yPosition);
  });
  
  yPosition += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(12, yPosition - 1, pageWidth - 12, yPosition - 1);
  
  // Draw data rows
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  
  invoices.forEach((inv, rowIndex) => {
    const totalPaid = inv.payments?.reduce((sum, p) => sum + p.amount_paid, 0) || 0;
    const outstanding = inv.total - totalPaid;
    
    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.setFillColor(240, 240, 245);
      doc.rect(12, yPosition - lineHeight + 2, pageWidth - 24, lineHeight - 1, 'F');
    }
    
    // Draw text
    const rowData = [
      inv.invoiceNumber,
      (inv.client?.name || 'N/A').substring(0, 20),
      formatDate(inv.issue_date),
      formatDate(inv.due_date),
      formatCurrencyForPDF(inv.total),
      formatCurrencyForPDF(totalPaid),
      formatCurrencyForPDF(outstanding),
      inv.status || 'Sent'
    ];
    
    rowData.forEach((cell, index) => {
      const alignment = index >= 4 ? 'right' : 'left';
      const xPos = index >= 4 ? columnPositions[index] + 20 : columnPositions[index];
      doc.text(String(cell), xPos, yPosition, { align: alignment });
    });
    
    yPosition += lineHeight;
    
    // New page if needed
    if (yPosition > pageHeight - 25) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  // Summary Footer
  yPosition += 10;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => {
    const paid = inv.payments?.reduce((s, p) => s + p.amount_paid, 0) || 0;
    return sum + paid;
  }, 0);
  
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Invoices: ${invoices.length}`, 20, yPosition);
  doc.text(`Total Amount: ${formatCurrencyForPDF(totalAmount)}`, 120, yPosition);
  yPosition += 8;
  doc.text(`Total Paid: ${formatCurrencyForPDF(totalPaid)}`, 120, yPosition);
  yPosition += 8;
  doc.text(`Outstanding: ${formatCurrencyForPDF(totalAmount - totalPaid)}`, 120, yPosition);

  return doc;
};

export const generateBulkInvoicesCSV = (invoices) => {
  const headers = ['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Total', 'Paid', 'Outstanding', 'Status'];
  
  const rows = invoices.map(inv => {
    const totalPaid = inv.payments?.reduce((sum, p) => sum + p.amount_paid, 0) || 0;
    return [
      inv.invoiceNumber,
      `"${inv.client?.name || 'N/A'}"`,
      formatDate(inv.issue_date),
      formatDate(inv.due_date),
      inv.total,
      totalPaid,
      inv.total - totalPaid,
      inv.status || 'Sent'
    ];
  });

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csv;
};
