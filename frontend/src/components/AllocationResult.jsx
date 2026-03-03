import React from 'react'

function StatusBadge({ status }) {
  const classes = {
    Approved: 'status-approved',
    Reduced: 'status-reduced',
    Deferred: 'status-deferred',
    Rejected: 'status-rejected',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${classes[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

export default function AllocationResult({ result }) {
  if (!result) return null

  const sectorColors = {
    Domestic: 'text-blue-700',
    Agricultural: 'text-green-700',
    Industrial: 'text-purple-700',
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b ${
        result.status === 'Approved' ? 'bg-green-50 border-green-200' :
        result.status === 'Reduced'  ? 'bg-yellow-50 border-yellow-200' :
        result.status === 'Deferred' ? 'bg-orange-50 border-orange-200' :
        'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Allocation Decision</h3>
            <p className="text-sm text-gray-600">
              Region: <span className="font-mono font-semibold">{result.region_id}</span>
              {' · '}
              <span className={`font-semibold ${sectorColors[result.sector] || ''}`}>{result.sector}</span>
            </p>
          </div>
          <StatusBadge status={result.status} />
        </div>
      </div>

      {/* Volumes */}
      <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Requested</p>
          <p className="text-2xl font-bold text-gray-800">{result.requested_volume?.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Litres</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Allocated</p>
          <p className={`text-2xl font-bold ${
            result.allocated_volume === 0 ? 'text-red-600' :
            result.allocated_volume < result.requested_volume ? 'text-orange-600' :
            'text-green-600'
          }`}>{result.allocated_volume?.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Litres</p>
        </div>
      </div>

      {/* Rule & Reason */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rule Triggered</p>
          <p className="text-sm font-mono bg-gray-50 border border-gray-200 rounded px-3 py-2 text-gray-800">
            {result.rule_triggered}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Decision Reason</p>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 border border-gray-200 rounded px-3 py-2">
            {result.reason}
          </p>
        </div>
      </div>
    </div>
  )
}
