export const parseCSVTransactions = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Detect column indices
  const dateIndex = headers.findIndex(h => 
    h.includes('date') || h.includes('transaction date') || h.includes('value date')
  );
  const amountIndex = headers.findIndex(h => 
    h.includes('amount') || h.includes('credit') || h.includes('debit') || h.includes('withdrawal')
  );
  const descriptionIndex = headers.findIndex(h => 
    h.includes('description') || h.includes('narration') || h.includes('particulars') || h.includes('details')
  );
  const referenceIndex = headers.findIndex(h => 
    h.includes('reference') || h.includes('ref') || h.includes('transaction id') || h.includes('cheque')
  );

  if (dateIndex === -1 || amountIndex === -1) {
    throw new Error('Required columns (date, amount) not found in CSV');
  }

  // Parse data rows
  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    
    const dateStr = values[dateIndex]?.trim();
    const amountStr = values[amountIndex]?.trim();
    const description = descriptionIndex !== -1 ? values[descriptionIndex]?.trim() : '';
    const reference = referenceIndex !== -1 ? values[referenceIndex]?.trim() : '';

    if (!dateStr || !amountStr) continue;

    // Parse amount (handle negative values, currency symbols, commas)
    let amount = parseFloat(amountStr.replace(/[₹$,\s]/g, '').replace(/[()]/g, '-'));
    
    // Only consider positive amounts (credits/deposits)
    if (amount > 0) {
      transactions.push({
        date: parseDate(dateStr),
        amount: amount,
        description: description || '',
        reference: reference || '',
        rawLine: line
      });
    }
  }

  return transactions;
};

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map(v => v.replace(/^"|"$/g, '').trim());
};

const parseDate = (dateStr) => {
  // Try various date formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,  // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/,    // DD-MM-YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/,    // YYYY-MM-DD (ISO)
    /^(\d{2})\/(\d{2})\/(\d{2})$/,  // DD/MM/YY
  ];

  for (let format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[2]) {
        // YYYY-MM-DD
        return new Date(match[1], match[2] - 1, match[3]);
      } else if (format === formats[3]) {
        // DD/MM/YY
        const year = parseInt(match[3]) + (parseInt(match[3]) < 50 ? 2000 : 1900);
        return new Date(year, match[2] - 1, match[1]);
      } else {
        // DD/MM/YYYY or DD-MM-YYYY
        return new Date(match[3], match[2] - 1, match[1]);
      }
    }
  }

  // Fallback to Date parser
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Unable to parse date: ${dateStr}`);
  }
  return parsed;
};

export const matchTransactionsWithInvoices = (transactions, invoices) => {
  const matches = [];

  for (const transaction of transactions) {
    const potentialMatches = [];

    for (const invoice of invoices) {
      // Only consider unpaid or partially paid invoices
      const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount_paid, 0) || 0;
      const outstanding = invoice.total - totalPaid;

      if (outstanding <= 0) continue; // Skip fully paid invoices

      const scoring = calculateMatchScore(transaction, invoice);
      
      if (scoring.total >= 30) {
        potentialMatches.push({
          invoice,
          score: scoring.total,
          confidence: scoring.confidence,
          breakdown: scoring.breakdown,
          outstanding
        });
      }
    }

    // Sort by score descending
    potentialMatches.sort((a, b) => b.score - a.score);

    matches.push({
      transaction,
      suggestions: potentialMatches.slice(0, 3), // Top 3 suggestions
      bestMatch: potentialMatches[0] || null,
      isAutoMatched: potentialMatches[0]?.score >= 90 ? true : false
    });
  }

  return matches;
};

const calculateMatchScore = (transaction, invoice) => {
  let totalScore = 0;
  const breakdown = {};

  // 1. Amount Match (40% weight = 40 points)
  const amountScore = calculateAmountScore(transaction.amount, invoice.total);
  breakdown.amount = { score: amountScore, weight: 40, weighted: (amountScore / 100) * 40 };
  totalScore += breakdown.amount.weighted;

  // 2. Invoice Number Match (30% weight = 30 points)
  const invoiceNumScore = calculateInvoiceNumberScore(transaction, invoice);
  breakdown.invoiceNumber = { score: invoiceNumScore, weight: 30, weighted: (invoiceNumScore / 100) * 30 };
  totalScore += breakdown.invoiceNumber.weighted;

  // 3. Client Name Match (20% weight = 20 points)
  const clientScore = calculateClientNameScore(transaction, invoice);
  breakdown.clientName = { score: clientScore, weight: 20, weighted: (clientScore / 100) * 20 };
  totalScore += breakdown.clientName.weighted;

  // 4. Date Range Match (10% weight = 10 points)
  const dateScore = calculateDateScore(transaction.date, invoice);
  breakdown.dateRange = { score: dateScore, weight: 10, weighted: (dateScore / 100) * 10 };
  totalScore += breakdown.dateRange.weighted;

  // Determine confidence level
  let confidence;
  if (totalScore >= 85) confidence = 'high';
  else if (totalScore >= 65) confidence = 'medium';
  else if (totalScore >= 30) confidence = 'low';
  else confidence = 'none';

  return {
    total: Math.round(totalScore),
    confidence,
    breakdown
  };
};

const calculateAmountScore = (transactionAmount, invoiceAmount) => {
  const diff = Math.abs(transactionAmount - invoiceAmount);
  const tolerance = invoiceAmount * 0.05; // 5% tolerance

  if (diff === 0) return 100; // Exact match
  if (diff <= tolerance * 0.2) return 95; // Within 1%
  if (diff <= tolerance) return 80; // Within 5%
  if (diff <= tolerance * 2) return 50; // Within 10%
  return 0;
};

const calculateInvoiceNumberScore = (transaction, invoice) => {
  const searchText = `${transaction.description} ${transaction.reference}`.toLowerCase();
  const invoiceNum = invoice.invoiceNumber.toLowerCase();

  if (searchText.includes(invoiceNum)) return 100; // Exact match
  
  // Fuzzy match: check if invoice number is partially present
  const invoiceParts = invoiceNum.split('-');
  for (const part of invoiceParts) {
    if (part.length > 2 && searchText.includes(part)) return 80;
  }
  
  return 0;
};

const calculateClientNameScore = (transaction, invoice) => {
  const searchText = `${transaction.description} ${transaction.reference}`.toLowerCase();
  const clientName = (invoice.client?.name || '').toLowerCase();

  if (!clientName || clientName.length < 3) return 0;

  if (searchText.includes(clientName)) return 100; // Exact match

  // Fuzzy match: check if major words match
  const clientWords = clientName.split(/\s+/).filter(w => w.length > 2);
  const matchedWords = clientWords.filter(word => searchText.includes(word));
  
  if (matchedWords.length === clientWords.length) return 90; // All words match
  if (matchedWords.length === clientWords.length - 1) return 70; // All but one word match
  if (matchedWords.length > 0) return 40; // Some words match
  
  return 0;
};

const calculateDateScore = (transactionDate, invoice) => {
  const issueDate = new Date(invoice.issue_date);
  const dueDate = new Date(invoice.due_date);
  
  const daysDiffIssue = Math.abs((transactionDate - issueDate) / (1000 * 60 * 60 * 24));
  const daysDiffDue = Math.abs((transactionDate - dueDate) / (1000 * 60 * 60 * 24));
  const daysDiff = Math.min(daysDiffIssue, daysDiffDue);

  if (daysDiff <= 1) return 100; // Same day or next day
  if (daysDiff <= 7) return 85; // Within a week
  if (daysDiff <= 14) return 60; // Within 2 weeks
  if (daysDiff <= 30) return 40; // Within a month
  if (daysDiff <= 90) return 20; // Within 3 months
  
  return 0;
};
