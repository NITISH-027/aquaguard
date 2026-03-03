import React from 'react'

export default function DroughtIndicator({ reservoirLevel, droughtMode }) {
  const level = parseFloat(reservoirLevel) || 0

  let status = 'normal'
  let color = 'blue'
  let label = 'Normal Operations'
  let bgClass = 'bg-blue-50 border-blue-300'
  let textClass = 'text-blue-800'
  let iconBg = 'bg-blue-500'

  if (level < 25) {
    status = 'emergency'
    color = 'red'
    label = '🚨 EMERGENCY LEVEL'
    bgClass = 'bg-red-50 border-red-300'
    textClass = 'text-red-800'
    iconBg = 'bg-red-500'
  } else if (level < 40 || droughtMode) {
    status = 'drought'
    color = 'orange'
    label = droughtMode ? '⚠️ DROUGHT MODE (Manual)' : '⚠️ DROUGHT CONDITIONS'
    bgClass = 'bg-orange-50 border-orange-300'
    textClass = 'text-orange-800'
    iconBg = 'bg-orange-500'
  } else {
    label = '✅ NORMAL OPERATIONS'
  }

  const rules = {
    normal: [
      'All sectors eligible for allocation',
      'Standard statutory caps apply',
      'Domestic > Agricultural > Industrial priority enforced',
    ],
    drought: [
      'Agricultural allocation reduced to 70% of statutory cap',
      'Industrial allocations DEFERRED',
      'Domestic sector fully protected',
      'Reservoir below 40% safe threshold',
    ],
    emergency: [
      'HARD STOP: Agricultural allocations BLOCKED',
      'HARD STOP: Industrial allocations BLOCKED',
      'Domestic survival minimum PROTECTED',
      'Reservoir below 25% emergency threshold',
    ],
  }

  return (
    <div className={`border-2 rounded-lg p-4 ${bgClass}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-3 h-3 rounded-full ${iconBg} animate-pulse`} />
        <span className={`font-bold text-lg ${textClass}`}>{label}</span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className={textClass}>Reservoir Level</span>
          <span className={`font-bold ${textClass}`}>{level.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              status === 'emergency' ? 'bg-red-500' :
              status === 'drought' ? 'bg-orange-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(level, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 text-gray-500">
          <span>0%</span>
          <span className="text-red-500">25% Emergency</span>
          <span className="text-orange-500">40% Safe</span>
          <span>100%</span>
        </div>
      </div>

      <ul className={`text-sm space-y-1 ${textClass}`}>
        {rules[status].map((rule, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>

      {droughtMode && status !== 'emergency' && (
        <div className="mt-2 text-xs bg-orange-100 border border-orange-200 rounded px-2 py-1 text-orange-700">
          Drought mode manually activated — drought rules enforced regardless of reservoir level
        </div>
      )}
    </div>
  )
}
