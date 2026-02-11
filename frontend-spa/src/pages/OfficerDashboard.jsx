import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Navbar from '../components/Navbar'

export default function OfficerDashboard() {
  const { user } = useAuth()
  const [challans, setChallans] = useState([])
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('challans')
  const [editingChallan, setEditingChallan] = useState(null)
  const [editForm, setEditForm] = useState({ fine_amount: '', status: '' })

  useEffect(() => {
    fetchChallans()
    fetchViolations()
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

  const fetchViolations = async () => {
    try {
      const response = await api.get('/violations')
      setViolations(response.data.violations || [])
    } catch (err) {
      console.error('Failed to load violations:', err)
    }
  }

  const handleEditChallan = (challan) => {
    setEditingChallan(challan.id)
    setEditForm({
      fine_amount: challan.fine_amount.toString(),
      status: challan.status,
    })
  }

  const handleSaveEdit = async (challanId) => {
    try {
      const updates = {}
      if (editForm.fine_amount) {
        updates.fine_amount = parseFloat(editForm.fine_amount)
      }
      if (editForm.status) {
        updates.status = editForm.status
      }

      await api.patch(`/challans/${challanId}`, updates)
      alert('Challan updated successfully')
      setEditingChallan(null)
      fetchChallans()
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || 'Unknown error'))
    }
  }

  const handleDeleteChallan = async (challanId) => {
    if (!window.confirm('Are you sure you want to delete this challan?')) return

    try {
      await api.delete(`/challans/${challanId}`)
      alert('Challan deleted successfully')
      fetchChallans()
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || 'Unknown error'))
    }
  }

  const handleCreateChallanFromViolation = async (violationId) => {
    try {
      await api.post('/challans/from-violation', { violation_id: violationId })
      alert('Challan created successfully')
      fetchChallans()
      setActiveTab('challans')
    } catch (err) {
      alert('Failed to create challan: ' + (err.response?.data?.message || 'Unknown error'))
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Officer Dashboard</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('challans')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'challans'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Challans ({challans.length})
            </button>
            <button
              onClick={() => setActiveTab('violations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'violations'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Violations ({violations.length})
            </button>
          </nav>
        </div>

        {/* Challans Tab */}
        {activeTab === 'challans' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="text-center py-12">Loading challans...</div>
            ) : challans.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No challans found.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {challans.map((challan) => (
                  <li key={challan.id} className="p-6">
                    {editingChallan === challan.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Fine Amount (₹)
                          </label>
                          <input
                            type="number"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={editForm.fine_amount}
                            onChange={(e) =>
                              setEditForm({ ...editForm, fine_amount: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <select
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={editForm.status}
                            onChange={(e) =>
                              setEditForm({ ...editForm, status: e.target.value })
                            }
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveEdit(challan.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingChallan(null)}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
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
                              <strong>Fine:</strong> {formatCurrency(challan.fine_amount)}
                            </p>
                            <p>
                              <strong>Date:</strong> {formatDate(challan.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4 flex space-x-2">
                          <button
                            onClick={() => handleEditChallan(challan)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteChallan(challan.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Violations Tab */}
        {activeTab === 'violations' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {violations.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No violations found.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {violations.map((violation) => {
                  const hasChallan = challans.some((c) => c.violation_id === violation.id)
                  return (
                    <li key={violation.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {violation.violation_type.replace('_', ' ').toUpperCase()}
                          </h3>
                          <div className="mt-2 text-sm text-gray-600">
                            <p>
                              <strong>Vehicle:</strong> {violation.vehicle_number || 'UNKNOWN'}
                            </p>
                            <p>
                              <strong>Speed:</strong> {violation.speed_kmph?.toFixed(1)} km/h
                            </p>
                            <p>
                              <strong>Date:</strong> {formatDate(violation.timestamp)}
                            </p>
                            {violation.extra?.ocr_confidence && (
                              <p>
                                <strong>OCR Confidence:</strong>{' '}
                                {(violation.extra.ocr_confidence * 100).toFixed(1)}%
                              </p>
                            )}
                          </div>
                          {violation.snapshot_path && (
                            <div className="mt-2">
                              <img
                                src={`http://localhost:5000${violation.snapshot_path}`}
                                alt="Violation snapshot"
                                className="h-32 w-auto rounded"
                              />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {hasChallan ? (
                            <span className="text-green-600 font-semibold">Challan Created</span>
                          ) : (
                            <button
                              onClick={() => handleCreateChallanFromViolation(violation.id)}
                              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm"
                            >
                              Create Challan
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
