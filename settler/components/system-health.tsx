"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Server, Database, Wifi, Shield, Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

export function SystemHealth() {
  // Mock system health data
  const systemMetrics = {
    apiHealth: { status: "healthy", uptime: "99.9%", responseTime: "45ms" },
    databaseHealth: { status: "healthy", connections: 45, maxConnections: 100 },
    blockchainConnection: { status: "healthy", latency: "120ms", blockHeight: 12345678 },
    securityStatus: { status: "secure", lastScan: "2024-01-20 10:00:00", threats: 0 },
  }

  const performanceMetrics = [
    { name: "CPU Usage", value: 35, status: "good" },
    { name: "Memory Usage", value: 68, status: "warning" },
    { name: "Disk Usage", value: 45, status: "good" },
    { name: "Network I/O", value: 23, status: "good" },
  ]

  const systemAlerts = [
    {
      id: "1",
      type: "warning",
      message: "Memory usage approaching 70% threshold",
      timestamp: "5 minutes ago",
    },
    {
      id: "2",
      type: "info",
      message: "Scheduled maintenance completed successfully",
      timestamp: "2 hours ago",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "secure":
      case "good":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "critical":
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
      case "secure":
      case "good":
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "critical":
      case "error":
        return <Badge variant="destructive">Critical</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Health</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusIcon(systemMetrics.apiHealth.status)}
              {getStatusBadge(systemMetrics.apiHealth.status)}
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-xs text-muted-foreground">Uptime: {systemMetrics.apiHealth.uptime}</p>
              <p className="text-xs text-muted-foreground">Response: {systemMetrics.apiHealth.responseTime}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusIcon(systemMetrics.databaseHealth.status)}
              {getStatusBadge(systemMetrics.databaseHealth.status)}
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-xs text-muted-foreground">
                Connections: {systemMetrics.databaseHealth.connections}/{systemMetrics.databaseHealth.maxConnections}
              </p>
              <Progress
                value={(systemMetrics.databaseHealth.connections / systemMetrics.databaseHealth.maxConnections) * 100}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blockchain</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusIcon(systemMetrics.blockchainConnection.status)}
              {getStatusBadge(systemMetrics.blockchainConnection.status)}
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-xs text-muted-foreground">Latency: {systemMetrics.blockchainConnection.latency}</p>
              <p className="text-xs text-muted-foreground">
                Block: #{systemMetrics.blockchainConnection.blockHeight.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {getStatusIcon(systemMetrics.securityStatus.status)}
              {getStatusBadge(systemMetrics.securityStatus.status)}
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-xs text-muted-foreground">Threats: {systemMetrics.securityStatus.threats}</p>
              <p className="text-xs text-muted-foreground">Last scan: {systemMetrics.securityStatus.lastScan}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Real-time system performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceMetrics.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{metric.value}%</span>
                    {getStatusIcon(metric.status)}
                  </div>
                </div>
                <Progress value={metric.value} className={`h-2 ${getProgressColor(metric.status)}`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>Recent system notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {systemAlerts.map((alert) => (
            <Alert key={alert.id} className={alert.type === "warning" ? "border-yellow-200" : ""}>
              {alert.type === "warning" ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{alert.message}</span>
                  <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system configuration and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Contract Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Address:</span>
                  <span className="font-mono text-xs">0xf9d57e...227fea5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Module:</span>
                  <span>p2m_system::upi_registry</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span>Aptos Mainnet</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">System Resources</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span>v1.2.3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment:</span>
                  <span>Production</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Restart:</span>
                  <span>2024-01-19 08:00:00</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
