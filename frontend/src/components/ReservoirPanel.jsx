import React, { useEffect, useState } from 'react'
import { getReservoirStatus } from '../api/client'
import DroughtIndicator from './DroughtIndicator'

export default function ReservoirPanel() {
  const [level, setLevel] = useState(50)
  const [droughtMode, setDroughtMode] = useState(false)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await getReservoirStatus({ reservoir_level: level, drought_mode: droughtMode })
      setStatus(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [level, droughtMode])

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-blue-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Reservoir Status Panel</h2>
          <p className="text-blue-200 text-sm mt-1">
            Simulate reservoir levels to preview statutory rules in effect
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Level Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Reservoir Level</label>
              <span className="text-2xl font-bold text-blue-700">{level}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span className="text-red-500 font-medium">25% Emergency</span>
              <span className="text-orange-500 font-medium">40% Safe</span>
              <span>100%</span>
            </div>
          </div>

          {/* Drought Toggle */}
          <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <input
              type="checkbox"
              id="panel-drought"
              checked={droughtMode}
              onChange={(e) => setDroughtMode(e.target.checked)}
              className="w-5 h-5 accent-orange-600"
            />
            <label htmlFor="panel-drought" className="text-sm font-medium text-orange-800 cursor-pointer">
              Drought Mode Override
            </label>
          </div>

          {/* Status Display */}
          <DroughtIndicator reservoirLevel={level} droughtMode={droughtMode} />

          {/* Active Rules from API */}
          {status && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Active Statutory Rules
              </h4>
              <ul className="space-y-1">
                {status.active_rules.map((rule, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">⚖</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <span>Safe threshold: <strong>{status.safe_level_threshold}%</strong></span>
                <span>Emergency threshold: <strong>{status.emergency_level_threshold}%</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
