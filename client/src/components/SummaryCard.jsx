const SummaryCard = ({ title, value, icon, color = 'indigo', trend }) => {
  const colorClasses = {
    indigo: 'from-blue-500 to-indigo-600 shadow-blue-500/20',
    green: 'from-emerald-500 to-green-600 shadow-emerald-500/20',
    yellow: 'from-amber-500 to-yellow-600 shadow-amber-500/20',
    red: 'from-rose-500 to-red-600 shadow-rose-500/20',
  }

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 group">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {value}
            </p>
            {trend && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span>{trend > 0 ? '📈' : '📉'}</span>
                <span>{Math.abs(trend)}% vs last month</span>
              </p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]}`} />
    </div>
  )
}

export default SummaryCard
