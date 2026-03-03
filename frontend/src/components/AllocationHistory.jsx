import React, { useEffect, useState } from 'react'
import { listAllocations } from '../api/client'
import AllocationResult from './AllocationResult'

export default function AllocationHistory() {
  const [allocations, setAllocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)

  const fetchAllocations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAllocations({ limit: 50 })
      setAllocations(res.data)
    } catch (err) {
      setError('Failed to load allocations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllocations()
  }, [])

  const statusClass = {
    Approved: 'status-approved',
    Reduced: 'status-reduced',
    Deferred: 'status-deferred',
    Rejected: 'status-rejected',
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Allocation Results</h2>
            <p className="text-blue-200 text-sm mt-1">All allocation decisions with statutory reasoning</p>
          </div>
          <button
            onClick={fetchAllocations}
            className="text-blue-200 hover:text-white text-sm border border-blue-400 hover:border-white rounded-lg px-3 py-1.5 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading…</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : allocations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No allocations yet. Submit a request first.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Region</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cycle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sector</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Requested (L)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Allocated (L)</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reservoir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allocations.map((a) => (
                  <tr
                    key={a.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selected?.id === a.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelected(selected?.id === a.id ? null : a)}
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800">{a.region_id}</td>
                    <td className="px-4 py-3 text-gray-600">{a.allocation_cycle}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${
                        a.sector === 'Domestic' ? 'text-blue-700' :
                        a.sector === 'Agricultural' ? 'text-green-700' :
                        'text-purple-700'
                      }`}>{a.sector}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{a.requested_volume?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold">{a.allocated_volume?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass[a.status] || ''}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {a.reservoir_level?.toFixed(1)}%
                      {a.drought_mode && (
                        <span className="ml-1 text-orange-600 text-xs">⚠</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Expanded Detail */}
      {selected && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Decision Detail</h3>
          <AllocationResult result={selected} />
        </div>
      )}
    </div>
  )
}
