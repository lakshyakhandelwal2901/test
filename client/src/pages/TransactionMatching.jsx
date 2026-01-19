import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { confirmMatches } from '../services/api'
import { formatCurrency, formatDate } from '../utils/calculations'

const TransactionMatching = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [matches, setMatches] = useState([])
  const [selectedMatches, setSelectedMatches] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    if (location.state?.matches) {
      setMatches(location.state.matches)
      // Initialize with best matches selected
      const initial = {}
      location.state.matches.forEach((match, idx) => {
        if (match.bestMatch) {
          initial[idx] = match.bestMatch.invoiceId
        }
      })
      setSelectedMatches(initial)
    }
  }, [location.state])

  const handleMatchSelection = (transactionIdx, invoiceId) => {
    setSelectedMatches(prev => ({
      ...prev,
      [transactionIdx]: invoiceId
    }))
  }

  const handleConfirmMatches = async () => {
    try {
      setConfirmLoading(true)
      setError('')

      // Build confirmed matches array
      const confirmedMatches = matches.map((match, idx) => ({
        transactionData: match.transaction,
        selectedInvoiceId: selectedMatches[idx],
        confirmed: !!selectedMatches[idx]
      })).filter(m => m.confirmed)

      if (confirmedMatches.length === 0) {
        setError('Please select at least one match to confirm')
        setConfirmLoading(false)
        return
      }

      const response = await confirmMatches(confirmedMatches)
      
      if (response.data.success) {
        alert(`Successfully recorded ${response.data.processedCount} payment(s)!`)
        navigate('/invoices', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm matches')
    } finally {
      setConfirmLoading(false)
    }
  }

  const getConfidenceColor = (confidence) => {
    switch(confidence) {
      case 'high': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-amber-600 bg-amber-50'
      case 'low': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getConfidenceBadge = (confidence) => {
    switch(confidence) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-amber-100 text-amber-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const confirmedCount = Object.keys(selectedMatches).length
  const totalMatches = matches.length
  const autoMatchedCount = matches.filter(m => m.isAutoMatched).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Review Transaction Matches
        </h1>
        <p className="text-gray-600 mt-1">
          Review and confirm which invoices these transactions match
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalMatches}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Auto-Matched (High Confidence)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{autoMatchedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Confirmed</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 font-medium">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totalMatches - confirmedCount}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Matches List */}
      <div className="space-y-4">
        {matches.map((match, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Transaction Details */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Transaction #{idx + 1}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(match.transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Date: {formatDate(match.transaction.date)}
                  </p>
                  {match.transaction.description && (
                    <p className="text-sm text-gray-700 mt-1">
                      Description: {match.transaction.description}
                    </p>
                  )}
                  {match.transaction.reference && (
                    <p className="text-sm text-gray-700">
                      Reference: {match.transaction.reference}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="p-4">
              {match.suggestions.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Select Matching Invoice:</p>
                  {match.suggestions.map((suggestion, suggIdx) => {
                    const isSelected = selectedMatches[idx] === suggestion.invoiceId
                    return (
                      <label
                        key={suggIdx}
                        className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`transaction-${idx}`}
                          checked={isSelected}
                          onChange={() => handleMatchSelection(idx, suggestion.invoiceId)}
                          className="mt-1"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900">
                              {suggestion.invoiceNumber} - {suggestion.clientName}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getConfidenceBadge(suggestion.confidence)}`}>
                              {suggestion.score}% Match
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Invoice Amount: {formatCurrency(suggestion.invoiceAmount)} | Outstanding: {formatCurrency(suggestion.outstanding)}
                          </p>
                          
                          {/* Score Breakdown */}
                          <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                            <div className={`p-2 rounded ${getConfidenceColor(suggestion.confidence)} bg-opacity-20`}>
                              <p className="font-semibold">Amount</p>
                              <p>{Math.round(suggestion.breakdown.amount.weighted)}%</p>
                            </div>
                            <div className={`p-2 rounded ${getConfidenceColor(suggestion.confidence)} bg-opacity-20`}>
                              <p className="font-semibold">Invoice #</p>
                              <p>{Math.round(suggestion.breakdown.invoiceNumber.weighted)}%</p>
                            </div>
                            <div className={`p-2 rounded ${getConfidenceColor(suggestion.confidence)} bg-opacity-20`}>
                              <p className="font-semibold">Client</p>
                              <p>{Math.round(suggestion.breakdown.clientName.weighted)}%</p>
                            </div>
                            <div className={`p-2 rounded ${getConfidenceColor(suggestion.confidence)} bg-opacity-20`}>
                              <p className="font-semibold">Date</p>
                              <p>{Math.round(suggestion.breakdown.dateRange.weighted)}%</p>
                            </div>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                  <p className="font-semibold">No matching invoices found</p>
                  <p className="text-sm mt-1">No invoices matched this transaction with sufficient confidence.</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-b-xl">
        <button
          onClick={() => navigate('/import', { replace: true })}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmMatches}
          disabled={confirmedCount === 0 || confirmLoading}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium shadow-lg shadow-green-500/30 hover:shadow-xl disabled:opacity-50 transition"
        >
          {confirmLoading ? 'Processing...' : `Confirm ${confirmedCount} Match${confirmedCount !== 1 ? 'es' : ''}`}
        </button>
      </div>
    </div>
  )
}

export default TransactionMatching
