"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Activity, AlertCircle, CheckCircle } from "lucide-react"

interface SystemOverviewProps {
  systemStats: {
    totalMerchants: number
    activeMerchants: number
    pendingApprovals: number
    totalUPIs: number
    totalTransactions: number
    totalVolume: string
    systemHealth: "healthy" | "warning" | "critical"
    lastUpdated: string
  }
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
    severity: "info" | "warning" | "error"
  }>
}

export function SystemOverview({ systemStats, recentActivity }: SystemOverviewProps) {
  // Mock data for charts
  const transactionData = [
    { name: "Jan", transactions: 4000, volume: 240000 },
    { name: "Feb", transactions: 3000, volume: 180000 },
    { name: "Mar", transactions: 5000, volume: 300000 },
    { name: "Apr", transactions: 4500, volume: 270000 },
    { name: "May", transactions: 6000, volume: 360000 },
    { name: "Jun", transactions: 5500, volume: 330000 },
  ]

  const merchantGrowthData = [
    { name: "Week 1", merchants: 1200 },
    { name: "Week 2", merchants: 1210 },
    { name: "Week 3", merchants: 1225 },
    { name: "Week 4", merchants: 1247 },
  ]

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-destructive" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return "destructive"
      case "warning":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume Trend</CardTitle>
            <CardDescription>Monthly transaction count and volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="transactions" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Merchant Growth</CardTitle>
            <CardDescription>Weekly merchant registration trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={merchantGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="merchants" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity and System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    {getSeverityIcon(activity.severity)}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityBadge(activity.severity) as any} className="text-xs">
                          {activity.type.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Current system status and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Contract Address</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  0xf9d57e56266876b07459f919263caf276b07978766ace8e17b65003bd227fea5
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Module</p>
                <p className="text-xs text-muted-foreground">p2m_system::upi_registry</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total UPI IDs</span>
                <span className="font-medium">{systemStats.totalUPIs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Merchants</span>
                <span className="font-medium">{systemStats.activeMerchants.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">System Health</span>
                <Badge variant={systemStats.systemHealth === "healthy" ? "default" : "destructive"}>
                  {systemStats.systemHealth}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Last Updated</span>
                <span className="text-xs text-muted-foreground">{systemStats.lastUpdated}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
