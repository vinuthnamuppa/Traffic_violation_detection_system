import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Navbar from '../components/Navbar'

export default function UserDashboard() {
  const { user } = useAuth()
  const [challans, setChallans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchChallans()
  }, [])

  const fetchChallans = async () => {
    try {
      const response = await api.get('/challans')
      setChallans(response.data.challans || [])
    } catch (err) {
      setError('Failed to load challans')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePayChallan = async (challanId) => {
    if (!window.confirm('Proceed with payment?')) return

    try {
      const response = await api.post(`/challans/${challanId}/pay`)
      alert('Payment successful! Receipt generated.')
      fetchChallans() // Refresh list
    } catch (err) {
      alert('Payment failed: ' + (err.response?.data?.message || 'Unknown error'))
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString('en-IN')
  }

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Challans</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading challans...</div>
        ) : challans.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No challans found.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {challans.map((challan) => (
                <li key={challan.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">
                          {challan.violation_type.replace('_', ' ').toUpperCase()}
                        </h3>
                        <span
                          className={`ml-3 px-2 py-1 text-xs font-semibold rounded ${
                            challan.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {challan.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          <strong>Vehicle:</strong> {challan.vehicle_number || 'UNKNOWN'}
                        </p>
                        <p>
                          <strong>Fine Amount:</strong> {formatCurrency(challan.fine_amount)}
                        </p>
                        <p>
                          <strong>Date:</strong> {formatDate(challan.created_at)}
                        </p>
                        {challan.paid_at && (
                          <p>
                            <strong>Paid On:</strong> {formatDate(challan.paid_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {challan.status === 'unpaid' ? (
                        <button
                          onClick={() => handlePayChallan(challan.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Pay Challan
                        </button>
                      ) : (
                        <span className="text-green-600 font-semibold">Paid</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
