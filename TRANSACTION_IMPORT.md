# Bank Transaction Import Feature

## 🎯 Overview
Automatically match bank transactions with invoices and record payments in bulk. This feature significantly reduces manual data entry and speeds up payment reconciliation.

## ✨ Features

### 1. CSV Upload
- Upload bank statement CSV files
- Supports multiple date formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD/MM/YY)
- Flexible column detection (works with most bank CSV formats)
- Only processes credit/deposit transactions (positive amounts)

### 2. Intelligent Matching
The system automatically matches transactions with invoices based on:
- **Amount Matching** (50 points for exact, 40 for 1% tolerance, 20 for 5% tolerance)
- **Date Proximity** (30 points within 7 days, 15 points within 30 days)
- **Invoice Number Detection** (40 points if invoice# found in description/reference)
- **Client Name Detection** (25 points if client name found)

**Confidence Levels:**
- **High** (≥70 points): Very likely correct match
- **Medium** (50-69 points): Probably correct, review recommended
- **Low** (30-49 points): Possible match, verify carefully
- **None** (<30 points): No good matches found

### 3. Review & Confirm
- View all matched transactions with confidence scores
- See match reasoning (why each invoice was suggested)
- Select or change invoice for each transaction
- Skip transactions that don't match any invoice
- See outstanding amounts for each invoice

### 4. Bulk Recording
- Record multiple payments at once
- Automatic invoice status updates (Paid, Partially Paid, etc.)
- Transaction details stored with each payment (description, reference)
- Successful/failed payment summary

## 📋 CSV Format Requirements

Your CSV must have these columns (names can vary):
- **Date** (required): Transaction date
- **Amount** (required): Transaction amount (positive for credits)
- **Description** (optional but recommended): Transaction details
- **Reference** (optional but recommended): Transaction reference/ID

### Example CSV Format:
```csv
Date,Description,Amount,Reference
12/01/2026,"Payment from Acme Corporation",5500.00,INV-001
13/01/2026,"Transfer - TechStart",2300.50,TXN-12345
14/01/2026,"Deposit - Global Industries",8750.00,REF-98765
```

### Supported Column Names:
- **Date columns:** date, transaction date, value date
- **Amount columns:** amount, credit, debit, withdrawal
- **Description columns:** description, narration, particulars, details
- **Reference columns:** reference, ref, transaction id, cheque

## 🚀 How to Use

### Step 1: Export Bank Statement
1. Log in to your bank's website
2. Navigate to Account Statements
3. Select date range
4. Export as CSV format

### Step 2: Upload to App
1. Navigate to **Import** in the menu
2. Click "Choose File" and select your CSV
3. Click "Process Transactions"

### Step 3: Review Matches
1. Review each transaction and its suggested invoice matches
2. Click on the radio button to select the correct invoice
3. Check the confidence level and match reasons
4. Skip any transactions that don't match

### Step 4: Record Payments
1. Verify your selections
2. Click "Record X Payment(s)" button
3. System will record all payments and update invoice statuses
4. See success/failure summary

## 💡 Tips for Better Matching

1. **Include Invoice Numbers**: Ask clients to include invoice numbers in transfer descriptions
2. **Consistent Naming**: Use consistent client names
3. **Timely Upload**: Upload bank statements soon after receiving payments for better date matching
4. **Reference Fields**: Encourage use of payment references

## 🔧 Technical Details

### Backend Endpoints
- `POST /api/transactions/upload` - Upload and parse CSV
- `POST /api/transactions/record-payment` - Record single payment
- `POST /api/transactions/bulk-record` - Record multiple payments

### Matching Algorithm
```javascript
Score = Amount Match (0-50) 
      + Date Proximity (0-30) 
      + Invoice Number Found (0-40)
      + Client Name Found (0-25)
Minimum: 30 points to show as potential match
```

### Files Created
- `/server/routes/transactions.js` - API endpoints
- `/server/utils/transactionParser.js` - CSV parsing & matching logic
- `/client/src/pages/TransactionImport.jsx` - Import UI
- `/client/src/services/api.js` - API functions (updated)
- `sample-bank-statement.csv` - Example format

## 📊 Sample Use Case

**Scenario:** You received 3 bank deposits today

1. Upload today's bank statement CSV (3 transactions)
2. System finds:
   - Transaction 1 (₹5,500): HIGH match with INV-001 (exact amount, invoice# found)
   - Transaction 2 (₹2,300): MEDIUM match with INV-002 (similar amount, within 7 days)
   - Transaction 3 (₹8,750): LOW match with INV-003 (amount match only)
3. Review and confirm all 3 matches
4. Click "Record 3 Payments"
5. All invoices updated to "Paid" status instantly!

**Time Saved:** Manual entry ~5-10 minutes → Automated ~30 seconds

## 🐛 Troubleshooting

**"Required columns not found"**
- Ensure CSV has Date and Amount columns
- Check column names match supported names
- Remove any extra header rows

**"No valid transactions found"**
- Check that amounts are positive numbers
- Ensure dates are in supported formats
- Remove currency symbols if causing issues

**"No matching invoices found"**
- Transaction amount may not match any invoice
- Date may be too far from invoice dates
- Create invoice first, then import transaction

**Poor matching quality**
- Add invoice numbers to bank references
- Ensure client names are consistent
- Upload statements more frequently

## 🎉 Benefits

- ⚡ **Speed**: Process dozens of payments in seconds
- ✅ **Accuracy**: Reduce manual entry errors
- 📊 **Tracking**: Better payment history and audit trail
- 💼 **Professional**: Faster client payment reconciliation
- 📈 **Scalability**: Handle high payment volumes easily

---

Need help? Check the main [QUICKSTART.md](./QUICKSTART.md) for general setup instructions.
