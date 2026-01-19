import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { parseCSVTransactions, matchTransactionsWithInvoices } from '../utils/transactionParser.js';

const router = express.Router();
const prisma = new PrismaClient();

// Upload and parse bank transactions
router.post('/upload', authenticate, async (req, res) => {
  try {
    const { csvData } = req.body;

    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required' });
    }

    // Parse transactions from CSV
    const transactions = parseCSVTransactions(csvData);

    if (transactions.length === 0) {
      return res.status(400).json({ message: 'No valid transactions found in CSV' });
    }

    // Get all invoices for this user
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.userId },
      include: {
        client: true,
        items: true,
        payments: true
      }
    });

    // Match transactions with invoices
    const matches = matchTransactionsWithInvoices(transactions, invoices);

    res.json({
      success: true,
      transactionCount: transactions.length,
      matches
    });

  } catch (error) {
    console.error('Transaction upload error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to process transactions'
    });
  }
});

// Record payment from matched transaction
router.post('/record-payment', authenticate, async (req, res) => {
  try {
    const { invoiceId, amount, date, description, reference } = req.body;

    if (!invoiceId || !amount || !date) {
      return res.status(400).json({ message: 'Invoice ID, amount, and date are required' });
    }

    // Verify invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: parseInt(invoiceId),
        userId: req.userId
      },
      include: { payments: true }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId: parseInt(invoiceId),
        amount_paid: parseFloat(amount),
        payment_date: new Date(date),
        payment_mode: 'Bank Transfer',
        notes: `${description || ''} | Ref: ${reference || 'N/A'}`
      }
    });

    // Calculate total paid
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount_paid, 0) + parseFloat(amount);

    // Update invoice status
    let newStatus;
    const today = new Date();
    const dueDate = new Date(invoice.due_date);

    if (totalPaid >= invoice.total) {
      newStatus = 'Paid';
    } else if (totalPaid > 0 && totalPaid < invoice.total && today > dueDate) {
      newStatus = 'Overdue';
    } else if (totalPaid > 0 && totalPaid < invoice.total) {
      newStatus = 'Partially Paid';
    } else if (totalPaid === 0 && today > dueDate) {
      newStatus = 'Overdue';
    } else {
      newStatus = 'Sent';
    }

    await prisma.invoice.update({
      where: { id: parseInt(invoiceId) },
      data: { status: newStatus }
    });

    res.status(201).json({
      success: true,
      payment,
      newStatus
    });

  } catch (error) {
    console.error('Payment recording error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to record payment'
    });
  }
});

// Get transaction matches with suggestions (for manual review)
router.post('/get-matches', authenticate, async (req, res) => {
  try {
    const { csvData } = req.body;

    if (!csvData) {
      return res.status(400).json({ message: 'CSV data is required' });
    }

    // Parse transactions from CSV
    const transactions = parseCSVTransactions(csvData);

    if (transactions.length === 0) {
      return res.status(400).json({ message: 'No valid transactions found in CSV' });
    }

    // Get all invoices for this user
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.userId },
      include: {
        client: true,
        items: true,
        payments: true
      }
    });

    // Match transactions with invoices
    const matches = matchTransactionsWithInvoices(transactions, invoices);

    // Format response with clean data
    const formattedMatches = matches.map(match => ({
      transaction: {
        date: match.transaction.date,
        amount: match.transaction.amount,
        description: match.transaction.description,
        reference: match.transaction.reference
      },
      bestMatch: match.bestMatch ? {
        invoiceId: match.bestMatch.invoice.id,
        invoiceNumber: match.bestMatch.invoice.invoiceNumber,
        clientName: match.bestMatch.invoice.client?.name,
        invoiceAmount: match.bestMatch.invoice.total,
        score: match.bestMatch.score,
        confidence: match.bestMatch.confidence,
        outstanding: match.bestMatch.outstanding,
        breakdown: match.bestMatch.breakdown
      } : null,
      suggestions: match.suggestions.map(s => ({
        invoiceId: s.invoice.id,
        invoiceNumber: s.invoice.invoiceNumber,
        clientName: s.invoice.client?.name,
        invoiceAmount: s.invoice.total,
        score: s.score,
        confidence: s.confidence,
        outstanding: s.outstanding,
        breakdown: s.breakdown
      })),
      isAutoMatched: match.isAutoMatched
    }));

    res.json({
      success: true,
      transactionCount: transactions.length,
      matches: formattedMatches,
      autoMatchedCount: formattedMatches.filter(m => m.isAutoMatched).length
    });

  } catch (error) {
    console.error('Transaction matching error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to match transactions'
    });
  }
});

// Confirm matches and create payments
router.post('/confirm-matches', authenticate, async (req, res) => {
  try {
    const { matches } = req.body; // Array of { transactionData, selectedInvoiceId, confirmed }

    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({ message: 'Matches array is required' });
    }

    const results = [];
    const errors = [];

    for (const match of matches) {
      try {
        const { transactionData, selectedInvoiceId, confirmed } = match;

        if (!confirmed || !selectedInvoiceId || !transactionData) {
          continue; // Skip unconfirmed matches
        }

        // Verify invoice belongs to user
        const invoice = await prisma.invoice.findFirst({
          where: {
            id: parseInt(selectedInvoiceId),
            userId: req.userId
          },
          include: { payments: true }
        });

        if (!invoice) {
          errors.push({ transactionData, error: 'Invoice not found' });
          continue;
        }

        // Create payment record
        const payment = await prisma.payment.create({
          data: {
            invoiceId: parseInt(selectedInvoiceId),
            amount_paid: parseFloat(transactionData.amount),
            payment_date: new Date(transactionData.date),
            payment_mode: 'Bank Transfer',
            notes: `${transactionData.description || ''} | Ref: ${transactionData.reference || 'N/A'}`
          }
        });

        // Calculate total paid
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount_paid, 0) + parseFloat(transactionData.amount);

        // Update invoice status
        let newStatus;
        const today = new Date();
        const dueDate = new Date(invoice.due_date);

        if (totalPaid >= invoice.total) {
          newStatus = 'Paid';
        } else if (totalPaid > 0 && totalPaid < invoice.total && today > dueDate) {
          newStatus = 'Overdue';
        } else if (totalPaid > 0 && totalPaid < invoice.total) {
          newStatus = 'Partially Paid';
        } else if (totalPaid === 0 && today > dueDate) {
          newStatus = 'Overdue';
        } else {
          newStatus = 'Sent';
        }

        await prisma.invoice.update({
          where: { id: parseInt(selectedInvoiceId) },
          data: { status: newStatus }
        });

        results.push({
          transactionAmount: transactionData.amount,
          invoiceId: parseInt(selectedInvoiceId),
          paymentId: payment.id,
          newStatus,
          success: true
        });

      } catch (error) {
        errors.push({ 
          transaction: match.transactionData,
          error: error.message 
        });
      }
    }

    res.json({
      success: true,
      processedCount: results.length,
      failedCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Match confirmation error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to confirm matches'
    });
  }
});

export default router;
