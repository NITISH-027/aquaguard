import React, { useState } from 'react'
import RequestForm from './components/RequestForm'
import AllocationHistory from './components/AllocationHistory'
import ReservoirPanel from './components/ReservoirPanel'
import AuditLogViewer from './components/AuditLogViewer'
import CycleSummary from './components/CycleSummary'

const TABS = [
  { id: 'request',   label: '📋 Request',        component: RequestForm },
  { id: 'results',   label: '📊 Results',         component: AllocationHistory },
  { id: 'reservoir', label: '💧 Reservoir',       component: ReservoirPanel },
  { id: 'audit',     label: '🔒 Audit Log',       component: AuditLogViewer },
  { id: 'summary',   label: '📈 Cycle Summary',   component: CycleSummary },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('request')

  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component || RequestForm

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Nav */}
      <header className="bg-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">AquaGuard</h1>
                <p className="text-blue-300 text-xs">Smart Water Allocation & Statutory Compliance</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="bg-blue-700 text-blue-200 text-xs px-3 py-1 rounded-full border border-blue-600">
                No AI/ML · Rule-Based Only
              </span>
              <span className="bg-green-700 text-green-200 text-xs px-3 py-1 rounded-full border border-green-600">
                Priority: DOM &gt; AGR &gt; IND
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statutory Notice */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-blue-600 text-lg mt-0.5">⚖️</span>
          <div className="text-sm text-blue-800">
            <strong>Statutory Compliance Engine</strong> — All decisions are rule-based and legally explainable.
            Priority hierarchy: <strong>Domestic (1st) → Agricultural (2nd) → Industrial (3rd)</strong>.
            Reservoir Safe Level: <strong>40%</strong> | Emergency Level: <strong>25%</strong>.
            Domestic cap: <strong>135 L/person/day</strong>.
          </div>
        </div>

        <ActiveComponent />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-xs text-center py-4 mt-12">
        AquaGuard v1.0.0 — Statutory Water Compliance Engine — No AI/ML — All decisions are rule-based and auditable
      </footer>
    </div>
  )
}
