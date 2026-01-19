import { useState, useEffect } from 'react'

const Settings = () => {
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    address: '',
    gst: '',
    mobile: '',
    email: '',
    pan: ''
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load from localStorage
    const savedInfo = localStorage.getItem('companyInfo')
    if (savedInfo) {
      setCompanyInfo(JSON.parse(savedInfo))
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setCompanyInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Configure your company details for custom invoice templates</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Company Information</h2>
        
        {saved && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
            ✓ Company information saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="name"
              value={companyInfo.name}
              onChange={handleChange}
              required
              placeholder="YOUR COMPANY NAME"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <textarea
              name="address"
              value={companyInfo.address}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Street Address&#10;City, State&#10;Pincode"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Use line breaks for multi-line address</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                name="gst"
                value={companyInfo.gst}
                onChange={handleChange}
                placeholder="08AGNPK3532E1ZH"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number
              </label>
              <input
                type="text"
                name="pan"
                value={companyInfo.pan}
                onChange={handleChange}
                placeholder="AGNPK3532E"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobile"
                value={companyInfo.mobile}
                onChange={handleChange}
                required
                placeholder="+91 9928151922"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={companyInfo.email}
                onChange={handleChange}
                required
                placeholder="info@company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl transition"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3">ℹ️ About Custom Template</h3>
        <p className="text-sm text-blue-800">
          The custom template is based on your uploaded invoice format and includes GST/Tax invoice layout.
          Your company information will appear on all invoices downloaded using the custom template.
          This information is stored locally in your browser.
        </p>
      </div>
    </div>
  )
}

export default Settings
