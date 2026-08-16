function StatsCard({ title, value, className = '' }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
      <p className={`mt-2 text-3xl font-bold ${className}`}>{value}</p>
    </div>
  )
}

export default StatsCard
