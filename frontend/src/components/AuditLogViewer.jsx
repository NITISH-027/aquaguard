import React, { useEffect, useState } from 'react'
import { listAuditLogs } from '../api/client'

function StatusBadge({ decision }) {
  const classes = {
    Approved: 'status-approved',
    Reduced:  'status-reduced',
    Deferred: 'status-deferred',
    Rejected: 'status-rejected',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${classes[decision] || 'bg-gray-100 text-gray-700'}`}>
      {decision}
    </span>
  )
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ region_id: '', allocation_cycle: '', decision: '' })
  const [expanded, setExpanded] = useState(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (filters.region_id) params.region_id = filters.region_id
      if (filters.allocation_cycle) params.allocation_cycle = filters.allocation_cycle
      if (filters.decision) params.decision = filters.decision
      const res = await listAuditLogs(params)
      setLogs(res.data)
    } catch (err) {
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleFilter = (e) => {
    e.preventDefault()
    fetchLogs()
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-blue-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Audit Log Viewer</h2>
          <p className="text-blue-200 text-sm mt-1">
            Immutable audit trail — all decisions logged with SHA-256 hash signatures
          </p>
        </div>

        {/* Filters */}
        <form onSubmit={handleFilter} className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Region ID"
            value={filters.region_id}
            onChange={(e) => setFilters((f) => ({ ...f, region_id: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Allocation Cycle"
            value={filters.allocation_cycle}
            onChange={(e) => setFilters((f) => ({ ...f, allocation_cycle: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.decision}
            onChange={(e) => setFilters((f) => ({ ...f, decision: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Decisions</option>
            <option value="Approved">Approved</option>
            <option value="Reduced">Reduced</option>
            <option value="Deferred">Deferred</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-lg"
          >
            Filter
          </button>
          <button
            type="button"
            onClick={() => { setFilters({ region_id: '', allocation_cycle: '', decision: '' }); fetchLogs() }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-lg"
          >
            Clear
          </button>
        </form>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading audit logs…</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No audit logs found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Region</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cycle</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Decision</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rule Triggered</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <React.Fragment key={log.log_id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpanded(expanded === log.log_id ? null : log.log_id)}
                    >
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-gray-800">{log.region_id}</td>
                      <td className="px-4 py-3 text-gray-600">{log.allocation_cycle}</td>
                      <td className="px-4 py-3"><StatusBadge decision={log.decision} /></td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-xs truncate">{log.rule_triggered}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-xs truncate">{log.hash_signature}</td>
                    </tr>
                    {expanded === log.log_id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 bg-gray-50 border-l-4 border-blue-400">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Input Data</p>
                              <pre className="text-xs bg-white border border-gray-200 rounded p-2 overflow-auto max-h-40">
                                {JSON.stringify(log.input_data, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Full Hash Signature</p>
                              <p className="font-mono text-xs break-all text-gray-600 bg-white border border-gray-200 rounded p-2">
                                {log.hash_signature}
                              </p>
                              <p className="text-xs font-semibold text-gray-500 uppercase mt-2 mb-1">Log ID</p>
                              <p className="font-mono text-xs text-gray-600 bg-white border border-gray-200 rounded p-2">
                                {log.log_id}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
