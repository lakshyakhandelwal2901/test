import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTransactionMatches } from '../services/api'

const TransactionImport = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile)
      setError('')
    } else {
      setError('Please upload a valid CSV file')
      setFile(null)
    }
  }

  const handleProcessFile = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const csvData = e.target.result

        const response = await getTransactionMatches(csvData)
        
        if (response.data.success) {
          // Navigate to matching review page with results
          navigate('/transaction-matching', {
            state: { 
              matches: response.data.matches,
              transactionCount: response.data.transactionCount,
              autoMatchedCount: response.data.autoMatchedCount
            }
          })
        }
      }
      reader.readAsText(file)
    } catch (err) {
      console.error('Processing error:', err)
      setError(err.response?.data?.message || 'Failed to process file')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Import Bank Transactions
        </h1>
        <p className="text-gray-600 mt-1">Upload your bank statement to auto-match with invoices</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Upload CSV File</h2>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-6-12l6 6m0 0l-6 6m6-6H6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <label className="block cursor-pointer">
              <span className="mt-2 block text-sm font-semibold text-gray-900">
                Drop CSV file here or click to select
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-3">
              CSV should contain: Date, Amount, Description (optional), Reference (optional)
            </p>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm font-medium text-green-800">
                ✓ {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </span>
              <button
                onClick={() => setFile(null)}
                className="text-green-600 hover:text-green-800 text-sm font-semibold"
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleProcessFile}
            disabled={!file || loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl disabled:opacity-50 transition disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Process Transactions'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3">📋 How to Use</h3>
        <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
          <li>Export your bank statement as CSV from your bank's website</li>
          <li>Ensure the CSV has columns for Date and Amount</li>
          <li>Upload the CSV file here</li>
          <li>Review AI-matched transactions with your invoices</li>
          <li>Confirm matches to automatically record payments</li>
        </ol>
      </div>

      {/* Sample CSV Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-3">📝 CSV Format Example</h3>
        <div className="bg-white rounded-lg p-4 font-mono text-xs text-gray-700 overflow-x-auto">
          <div>Date,Amount,Description,Reference</div>
          <div>2026-01-10,3100.00,Payment INV-002,CHQ123456</div>
          <div>2026-01-15,2750.00,Global Industries,TXN789456</div>
          <div>2026-01-05,5500.00,Acme Corp Payment,Wire123</div>
        </div>
      </div>
    </div>
  )
}

export default TransactionImport
