import React, { useState } from 'react'
import { requestAllocation } from '../api/client'
import DroughtIndicator from './DroughtIndicator'
import AllocationResult from './AllocationResult'

const SECTORS = ['Domestic', 'Agricultural', 'Industrial']

const initialForm = {
  region_id: '',
  population: '',
  sector: 'Domestic',
  requested_volume: '',
  allocation_cycle: '',
  reservoir_level: '',
  drought_mode: false,
}

export default function RequestForm() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    const payload = {
      region_id: form.region_id.trim(),
      population: parseInt(form.population, 10),
      sector: form.sector,
      requested_volume: parseFloat(form.requested_volume),
      allocation_cycle: form.allocation_cycle.trim(),
      reservoir_level: parseFloat(form.reservoir_level),
      drought_mode: form.drought_mode,
    }

    try {
      const res = await requestAllocation(payload)
      setResult(res.data)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setLoading(false)
    }
  }

  const reservoirLevel = parseFloat(form.reservoir_level) || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-blue-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Water Allocation Request</h2>
          <p className="text-blue-200 text-sm mt-1">
            Statutory compliance engine — Priority: Domestic &gt; Agricultural &gt; Industrial
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Region ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="region_id"
                value={form.region_id}
                onChange={handleChange}
                required
                placeholder="e.g. REG-001-NORTH"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Allocation Cycle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allocation Cycle <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="allocation_cycle"
                value={form.allocation_cycle}
                onChange={handleChange}
                required
                placeholder="e.g. 2024-Q1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector <span className="text-red-500">*</span>
              </label>
              <select
                name="sector"
                value={form.sector}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Population */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Population <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="population"
                value={form.population}
                onChange={handleChange}
                required
                min="0"
                placeholder="e.g. 50000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Requested Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requested Volume (Litres/day) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="requested_volume"
                value={form.requested_volume}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="e.g. 6750000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reservoir Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reservoir Level (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="reservoir_level"
                value={form.reservoir_level}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g. 55.5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Drought Mode Toggle */}
          <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <input
              type="checkbox"
              id="drought_mode"
              name="drought_mode"
              checked={form.drought_mode}
              onChange={handleChange}
              className="w-5 h-5 text-orange-600 accent-orange-600"
            />
            <label htmlFor="drought_mode" className="text-sm font-medium text-orange-800 cursor-pointer">
              Drought Mode — Activate drought restrictions regardless of reservoir level
            </label>
          </div>

          {/* Drought Indicator Preview */}
          {form.reservoir_level && (
            <DroughtIndicator
              reservoirLevel={reservoirLevel}
              droughtMode={form.drought_mode}
            />
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg px-4 py-3 text-sm text-red-800">
              <strong>Error:</strong> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Processing Allocation Request…' : 'Submit Allocation Request'}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && <AllocationResult result={result} />}
    </div>
  )
}
