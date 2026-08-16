import { useState, useEffect } from 'react'
import { getInventory } from '../services/api'
import StatsCard from '../components/StatsCard'
import InventoryTable from '../components/InventoryTable'

function Dashboard() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const data = await getInventory()
      setInventory(data)
    } catch (err) {
      setError('Failed to fetch inventory')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0)
  const lowStockItems = inventory.filter(item => item.quantity <= item.reorderLevel).length
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Total Items" value={totalItems} />
        <StatsCard title="Low Stock Alerts" value={lowStockItems} className="text-orange-500" />
        <StatsCard title="Total Value" value={`$${totalValue.toFixed(2)}`} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Inventory Overview</h2>
        <InventoryTable items={inventory} />
      </div>
    </div>
  )
}

export default Dashboard
