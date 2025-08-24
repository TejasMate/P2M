"use client"
\
import { useState } from "react"
\
# Admin/Settler Dashboard Development Prompt

## Project Overview
\
Build an **Admin/Settler Dashboard**
for the P2M System - a comprehensive
administrative
interface
for system administrators and settlement
operators
to
manage
the
entire
platform, monitor
system
health, handle
merchant
approvals, and
process
settlements.

\
## Technical Stack
\
- **Framework**: React 18+
with TypeScript
\
- **Blockchain**: Aptos SDK (
@aptos
;-labs / ts - sdk
v1
0.28
.0+
)
\
- **Styling**: Tailwind CSS
with shadcn/ui components
\
- **Charts**: Recharts + D3.js
for advanced visualizations
\
- **State Management**
: Zustand
- **HTTP Client**: Axios
\
- **Real-time**: Socket.io-client
for live updates
\
- **Notifications**
: React Hot Toast
\
- **Export**: jsPDF + xlsx
for report generation

\
#
#
Smart
Contract
Details
\
- **Contract Address**: `0xf9d57e56266876b07459f919263caf276b07978766ace8e17b65003bd227fea5`
- **Module**: `p2m_system::upi_registry`
- **Admin Functions**: `add_admin()`, `initialize()`, system management

## Core Features & Demo Implementation

### 1. System Overview Dashboard
```typescript
// SystemOverview.tsx - Demo Implementation
const SystemOverview = () => {
  const [systemStats, setSystemStats] = useState({
    totalMerchants: 1247,
    activeMerchants: 1156,
    pendingApprovals: 23,
    totalUPIs: 3421,
    totalTransactions: 45678,
    totalVolume: "2,345,678.50 APT",
    systemHealth: "healthy",
    lastUpdated: new Date().toLocaleString(),
  })

  const [recentActivity, setRecentActivity] = useState([
    {
      id: "1",
      type: "merchant_registration",
      message: 'New merchant "Tech Store" registered',
      timestamp: "2 minutes ago",
      severity: "info",
    },
    {
      id: "2",
      type: "settlement_completed",
      message: "Batch settlement #1234 completed (₹2,45,000)",
      timestamp: "15 minutes ago",
      severity: "success",
    },
    {
      id: "3",
      type: "system_alert",
      message: "High transaction volume detected",
      timestamp: "1 hour ago",
      severity: "warning",
    },
    {
      id: "4",
      type: "kyc_approval",
      message: 'KYC approved for merchant "Coffee Corner"',
      timestamp: "2 hours ago",
      severity: "success",
    },
  ])

  const [alerts, setAlerts] = useState([
    {
      id: "1",
      title: "Settlement Queue Full",
      message: "156 settlements pending processing",
      severity: "warning",
      timestamp: "5 minutes ago",
    },
    {
      id: "2",
      title: "KYC Backlog",
      message: "23 merchants awaiting KYC verification",
      severity: "info",
      timestamp: "1 hour ago",
    },
  ])

  const handleRefreshStats = () => {
    // Demo: Simulate real-time updates
    setSystemStats((prev) => ({
      ...prev,
      totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 10),
      lastUpdated: new Date().toLocaleString(),
    }))
    toast.success("System stats refreshed!")
  }

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
    toast.success("Alert dismissed")
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "text-green-600 bg-green-100"
      case "warning":
        return "text-yellow-600 bg-yellow-100"
      case "critical":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      case "info":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="system-overview max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">P2M System Administration Panel</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefreshStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Refresh Stats
          </button>
          <div className={`px-3 py-2 rounded-lg ${getHealthColor(systemStats.systemHealth)}`}>
            System: {systemStats.systemHealth.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Total Merchants</h3>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-blue-600">{systemStats.totalMerchants.toLocaleString()}</p>
            <span className="text-sm text-green-600">+12 today</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Active Merchants</h3>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-green-600">{systemStats.activeMerchants.toLocaleString()}</p>
            <span className="text-sm text-gray-600">92.7% active</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Pending Approvals</h3>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-yellow-600">{systemStats.pendingApprovals}</p>
            <span className="text-sm text-red-600">Needs attention</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600">Total Volume</h3>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-purple-600">{systemStats.totalVolume}</p>
            <span className="text-sm text-green-600">+5.2% today</span>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">System Alerts</h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === "warning" ? "bg-yellow-50 border-yellow-400" : "bg-blue-50 border-blue-400"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{alert.title}</h3>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                  </div>
                  <button onClick={() => handleDismissAlert(alert.id)} className="text-gray-400 hover:text-gray-600">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded">
              <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(activity.severity)}`}></div>
              <div className="flex-1">
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Demo Actions */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Demo Actions:</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newActivity = {
                  id: Date.now().toString(),
                  type: "demo_action",
                  message: "Demo activity added by admin",
                  timestamp: "Just now",
                  severity: "info",
                }
                setRecentActivity((prev) => [newActivity, ...prev.slice(0, 9)])
                toast.success("Demo activity added!")
              }}
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
            >
              Add Demo Activity
            </button>
            <button
              onClick={() => toast.info("System maintenance scheduled")}
              className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
            >
              Schedule Maintenance
            </button>
            <button
              onClick={() => toast.success("System backup initiated")}
              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
            >
              Backup System
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
