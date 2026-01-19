import { useState, useEffect, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { calculateItemAmount, calculateSubtotal, calculateTotal } from '../utils/calculations'

const InvoiceForm = ({ initialData, clients, onSubmit, onCancel }) => {
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState(
    initialData?.client_id ? clients.find(c => c.id === parseInt(initialData.client_id)) : null
  )
  const [templateStyle, setTemplateStyle] = useState(
    localStorage.getItem('invoiceTemplate') || 'standard'
  )
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const dropdownRef = useRef(null)

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: initialData || {
      invoice_number: '',
      client_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      gst: 0,
      discount: 0,
      items: [{ description: '', quantity: 1, rate: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  })

  const items = watch('items')
  const gst = watch('gst')
  const discount = watch('discount')

  const subtotal = calculateSubtotal(items)
  const total = calculateTotal(subtotal, gst, discount)

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const handleClientSelect = (client) => {
    setSelectedClient(client)
    setValue('client_id', client.id)
    setClientSearch(client.name)
    setShowClientDropdown(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowClientDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
          <input
            {...register('invoice_number', { required: 'Invoice number is required' })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.invoice_number && <p className="mt-1 text-sm text-red-600">{errors.invoice_number.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Client</label>
          <div className="relative mt-1" ref={dropdownRef}>
            <input
              type="text"
              value={selectedClient ? selectedClient.name : clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value)
                setShowClientDropdown(true)
                if (!e.target.value) {
                  setSelectedClient(null)
                  setValue('client_id', '')
                }
              }}
              onFocus={() => setShowClientDropdown(true)}
              placeholder="Search for a client..."
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <input
              type="hidden"
              {...register('client_id', { required: 'Client is required' })}
            />
            
            {showClientDropdown && filteredClients.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-xs opacity-75">{client.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showClientDropdown && clientSearch && filteredClients.length === 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-2 px-3 text-sm text-gray-500">
                No clients found
              </div>
            )}
          </div>
          {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Issue Date</label>
          <input
            type="date"
            {...register('issue_date', { required: 'Issue date is required' })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.issue_date && <p className="mt-1 text-sm text-red-600">{errors.issue_date.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Due Date</label>
          <input
            type="date"
            {...register('due_date', { required: 'Due date is required' })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.due_date && <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Items</h3>
          <button
            type="button"
            onClick={() => append({ description: '', quantity: 1, rate: 0 })}
            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-5">
                <input
                  {...register(`items.${index}.description`, { required: 'Description is required' })}
                  placeholder="Description"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.quantity`, { required: true, min: 0.01, valueAsNumber: true })}
                  placeholder="Qty"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.rate`, { required: true, min: 0, valueAsNumber: true })}
                  placeholder="Rate"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  value={`₹${calculateItemAmount(items[index]?.quantity, items[index]?.rate).toFixed(2)}`}
                  readOnly
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                />
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-600 hover:text-red-900"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        {/* Template Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Invoice Template</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setTemplateStyle('standard');
                localStorage.setItem('invoiceTemplate', 'standard');
              }}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${
                templateStyle === 'standard'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-semibold text-gray-900">Standard Template</div>
              <div className="text-xs text-gray-500 mt-1">Default invoice layout</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setTemplateStyle('custom');
                localStorage.setItem('invoiceTemplate', 'custom');
              }}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition ${
                templateStyle === 'custom'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-semibold text-gray-900">Custom Template</div>
              <div className="text-xs text-gray-500 mt-1">Tax invoice with GST format</div>
            </button>
          </div>
          
          {templateStyle === 'custom' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              ℹ️ Make sure to configure your company details in Settings for this template.
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t mb-6"></div>

        {/* Totals Section */}
        <div className="flex justify-end space-y-2 flex-col max-w-xs ml-auto">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Subtotal:</span>
            <span className="text-sm font-medium">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">GST (%):</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('gst', { valueAsNumber: true })}
              className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Discount:</span>
            <input
              type="number"
              step="0.01"
              {...register('discount', { valueAsNumber: true })}
              className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
            />
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-base font-semibold">Total:</span>
            <span className="text-base font-bold">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit((data) => onSubmit(data, true))}
          className="px-4 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 hover:bg-green-50"
        >
          Already Paid
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Save Invoice
        </button>
      </div>
    </form>
  )
}

export default InvoiceForm
