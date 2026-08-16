import { useState, useEffect } from 'react'
import { issueStock, getInventory } from '../services/api'

function IssueStockModel20() {
  const [inventory, setInventory] = useState([])
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    issuedTo: '',
    department: '',
    purpose: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const data = await getInventory()
      setInventory(data)
    } catch (err) {
      console.error('Failed to fetch inventory:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const selectedItem = inventory.find(item => item.id === formData.itemId)
  const maxQuantity = selectedItem ? selectedItem.quantity : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    const qty = parseInt(formData.quantity, 10)
    if (qty > maxQuantity) {
      setMessage({ type: 'error', text: `Insufficient stock. Available: ${maxQuantity}` })
      setLoading(false)
      return
    }

    try {
      await issueStock({
        ...formData,
        quantity: qty
      })
      setMessage({ type: 'success', text: 'Stock issued successfully!' })
      setFormData({ itemId: '', quantity: '', issuedTo: '', department: '', purpose: '' })
      fetchInventory()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to issue stock. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Issue Stock (Model 20)</h1>

      {message.text && (
        <div className={`p-4 rounded mb-6 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
          <select
            name="itemId"
            value={formData.itemId}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Select Item --</option>
            {inventory.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} (Available: {item.quantity})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity {selectedItem && `(Max: ${maxQuantity})`}
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="1"
            max={maxQuantity}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issued To</label>
          <input
            type="text"
            name="issuedTo"
            value={formData.issuedTo}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
          <textarea
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            rows="3"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Issue Stock'}
        </button>
      </form>
    </div>
  )
}

export default IssueStockModel20
