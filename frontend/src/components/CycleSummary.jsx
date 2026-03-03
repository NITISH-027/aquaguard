import React, { useEffect, useState } from 'react'
import { getCycleSummary } from '../api/client'

export default function CycleSummary() {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCycleSummary()
      setSummaries(res.data)
    } catch (err) {
      setError('Failed to load cycle summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const fmtL = (n) => n?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '—'

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-blue-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Cycle Summary</h2>
          <p className="text-blue-200 text-sm mt-1">Aggregated water allocation per cycle</p>
        </div>
        <button
          onClick={fetchSummary}
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
        ) : summaries.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No allocation data yet. Submit a request to get started.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cycle</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Regions</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Requested (L)</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Allocated (L)</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Approved</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reduced</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deferred</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rejected</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaries.map((s) => {
                const efficiency = s.total_requested > 0
                  ? ((s.total_allocated / s.total_requested) * 100).toFixed(1)
                  : '—'
                return (
                  <tr key={s.allocation_cycle} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800">{s.allocation_cycle}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{s.total_regions}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtL(s.total_requested)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">{fmtL(s.total_allocated)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold status-approved">{s.approved_count}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold status-reduced">{s.reduced_count}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold status-deferred">{s.deferred_count}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold status-rejected">{s.rejected_count}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{efficiency}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
