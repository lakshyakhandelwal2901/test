import jsPDF from 'jspdf';
import { formatCurrencyForPDF, formatDate } from './calculations';

/**
 * Generate PDF invoice using custom template based on Sri Ram Gems format
 */
export const generateCustomInvoicePDF = (invoice, payments = [], companyInfo = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Get company info from localStorage if not provided
  if (!companyInfo) {
    const savedInfo = localStorage.getItem('companyInfo');
    if (savedInfo) {
      companyInfo = JSON.parse(savedInfo);
    }
  }
  
  // Default company info
  const company = {
    name: companyInfo?.name || 'YOUR COMPANY NAME',
    address: companyInfo?.address || 'Your Address Line 1\nYour Address Line 2\nCity, State - Pincode',
    gst: companyInfo?.gst ? `GST NO: ${companyInfo.gst}` : 'GST NO: XXXXXXXXXXXX',
    mobile: companyInfo?.mobile ? `MOBILE: ${companyInfo.mobile}` : 'MOBILE: +91 XXXXXXXXXX',
    email: companyInfo?.email || 'email@company.com',
    pan: companyInfo?.pan ? `PAN: ${companyInfo.pan}` : 'PAN: XXXXXXXXXX'
  };

  let yPos = 15;

  // Header - TAX INVOICE
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setDrawColor(0);
  doc.line(15, yPos, pageWidth - 15, yPos);
  
  yPos += 8;

  // Company Details (Left side)
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(company.name, 15, yPos);
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const addressLines = company.address.split('\n');
  addressLines.forEach(line => {
    doc.text(line, 15, yPos);
    yPos += 5;
  });
  
  doc.setFont(undefined, 'bold');
  doc.text(company.gst, 15, yPos);
  yPos += 5;
  doc.text(company.mobile, 15, yPos);
  yPos += 5;
  doc.text(`E-Mail: ${company.email}`, 15, yPos);

  // Invoice Details (Right side)
  const rightX = pageWidth - 70;
  let rightY = 38;
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('Invoice No.', rightX, rightY);
  doc.setFont(undefined, 'normal');
  doc.text(invoice.invoiceNumber, rightX + 25, rightY);
  
  rightY += 6;
  doc.setFont(undefined, 'bold');
  doc.text('Dated', rightX, rightY);
  doc.setFont(undefined, 'normal');
  doc.text(formatDate(invoice.issue_date), rightX + 25, rightY);

  yPos = Math.max(yPos, rightY) + 10;
  
  // Horizontal line
  doc.setDrawColor(0);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  // Bill To Section
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('BUYER (BILL TO)', 15, yPos);
  
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text(invoice.client?.name || 'Client Name', 15, yPos);
  
  yPos += 5;
  doc.setFont(undefined, 'normal');
  if (invoice.client?.address) {
    const clientAddressLines = invoice.client.address.split('\n');
    clientAddressLines.forEach(line => {
      doc.text(line, 15, yPos);
      yPos += 5;
    });
  }
  
  if (invoice.client?.phone) {
    doc.text(`CONTACT: ${invoice.client.phone}`, 15, yPos);
    yPos += 5;
  }
  
  if (invoice.client?.email) {
    doc.text(`Email: ${invoice.client.email}`, 15, yPos);
    yPos += 5;
  }

  yPos += 5;
  doc.setDrawColor(0);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  // Items Table Header
  const tableStartY = yPos;
  const colWidths = {
    sno: 15,
    description: 70,
    hsn: 25,
    quantity: 25,
    rate: 25,
    amount: 30
  };
  
  let xPos = 15;
  
  // Header background
  doc.setFillColor(240, 240, 240);
  doc.rect(15, yPos - 6, pageWidth - 30, 8, 'F');
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  
  doc.text('S.NO', xPos + 2, yPos);
  xPos += colWidths.sno;
  
  doc.text('Description of Goods', xPos + 2, yPos);
  xPos += colWidths.description;
  
  doc.text('HSN/SAC', xPos + 2, yPos);
  xPos += colWidths.hsn;
  
  doc.text('Quantity', xPos + 2, yPos);
  xPos += colWidths.quantity;
  
  doc.text('Rate', xPos + 2, yPos);
  xPos += colWidths.rate;
  
  doc.text('Amount', xPos + 2, yPos);
  
  yPos += 8;
  doc.setDrawColor(200);
  doc.line(15, yPos - 2, pageWidth - 15, yPos - 2);

  // Items
  doc.setFont(undefined, 'normal');
  invoice.items?.forEach((item, index) => {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    xPos = 15;
    
    doc.text(String(index + 1), xPos + 2, yPos);
    xPos += colWidths.sno;
    
    doc.text(item.description.substring(0, 35), xPos + 2, yPos);
    xPos += colWidths.description;
    
    // Use HSN if available, otherwise use a default or leave blank
    doc.text(item.hsn || item.hsnCode || '---', xPos + 2, yPos);
    xPos += colWidths.hsn;
    
    doc.text(`${item.quantity}`, xPos + 2, yPos);
    xPos += colWidths.quantity;
    
    doc.text(formatCurrencyForPDF(item.rate), xPos + 2, yPos);
    xPos += colWidths.rate;
    
    doc.text(formatCurrencyForPDF(item.amount), xPos + 2, yPos);
    
    yPos += 7;
  });

  // Tax row if applicable
  if (invoice.gst > 0) {
    xPos = 15 + colWidths.sno;
    const gstAmount = (invoice.subtotal - invoice.discount) * (invoice.gst / 100);
    doc.setFont(undefined, 'italic');
    doc.text(`GST/IGST @ ${invoice.gst}%`, xPos + 2, yPos);
    xPos = pageWidth - 45;
    doc.text(formatCurrencyForPDF(gstAmount), xPos + 2, yPos);
    yPos += 7;
  }

  // Total line
  yPos += 2;
  doc.setDrawColor(0);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 7;

  // Total
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL', 15 + colWidths.sno + 2, yPos);
  doc.text(formatCurrencyForPDF(invoice.total), pageWidth - 45 + 2, yPos);

  yPos += 10;
  doc.setDrawColor(0);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  // Amount in words
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.text('Amount Chargeable (in words)', 15, yPos);
  yPos += 5;
  doc.setFont(undefined, 'normal');
  const amountInWords = numberToWords(invoice.total);
  doc.text(`INR ${amountInWords} ONLY`, 15, yPos);

  yPos += 10;

  // Tax breakdown section if gst > 0
  if (invoice.gst > 0) {
    const gstAmount = (invoice.subtotal - invoice.discount) * (invoice.gst / 100);
    
    doc.setDrawColor(200);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 8;
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Taxable Value', 15, yPos);
    doc.text('GST Rate', 80, yPos);
    doc.text('GST Amount', 130, yPos);
    
    yPos += 6;
    doc.setFont(undefined, 'normal');
    doc.text(formatCurrencyForPDF(invoice.subtotal - invoice.discount), 15, yPos);
    doc.text(`${invoice.gst}%`, 80, yPos);
    doc.text(formatCurrencyForPDF(gstAmount), 130, yPos);
    
    yPos += 8;
    doc.setFont(undefined, 'italic');
    doc.text(`GST Amount (in words): INR ${numberToWords(gstAmount)} ONLY`, 15, yPos);
    
    yPos += 10;
  }

  // Footer section
  const footerY = pageHeight - 40;
  
  // Declaration
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  doc.text('Declaration:', 15, footerY);
  doc.setFont(undefined, 'normal');
  doc.text('We declare that this invoice shows the actual price of the', 15, footerY + 4);
  doc.text('goods described and that all particulars are true and correct.', 15, footerY + 8);

  // Signature section
  doc.setFont(undefined, 'bold');
  doc.text(`For ${company.name}`, pageWidth - 70, footerY);
  
  doc.line(pageWidth - 70, footerY + 15, pageWidth - 20, footerY + 15);
  doc.text('Authorised Signatory', pageWidth - 70, footerY + 20);

  // Company PAN
  doc.setFontSize(7);
  doc.setFont(undefined, 'normal');
  doc.text(company.pan, 15, footerY + 15);

  // Computer generated invoice
  doc.setFontSize(7);
  doc.setFont(undefined, 'italic');
  doc.text('THIS IS A COMPUTER GENERATED INVOICE', pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
};

// Helper function to convert number to words (simplified)
function numberToWords(num) {
  if (num === 0) return 'ZERO';
  
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  
  const numStr = Math.floor(num).toString();
  const len = numStr.length;
  
  let words = '';
  
  // Lakhs
  if (len > 5) {
    const lakhs = parseInt(numStr.substring(0, len - 5));
    if (lakhs > 0) {
      words += convertTwoDigits(lakhs, ones, tens, teens) + ' LAKH ';
    }
  }
  
  // Thousands
  if (len > 3) {
    const thousands = parseInt(numStr.substring(Math.max(0, len - 5), len - 3));
    if (thousands > 0) {
      words += convertTwoDigits(thousands, ones, tens, teens) + ' THOUSAND ';
    }
  }
  
  // Hundreds
  if (len > 2) {
    const hundreds = parseInt(numStr[len - 3]);
    if (hundreds > 0) {
      words += ones[hundreds] + ' HUNDRED ';
    }
  }
  
  // Last two digits
  const lastTwo = parseInt(numStr.substring(len - 2));
  if (lastTwo > 0) {
    words += convertTwoDigits(lastTwo, ones, tens, teens);
  }
  
  return words.trim();
}

function convertTwoDigits(num, ones, tens, teens) {
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  return tens[Math.floor(num / 10)] + (num % 10 > 0 ? ' ' + ones[num % 10] : '');
}
