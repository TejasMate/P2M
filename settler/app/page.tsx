"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, CreditCard, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react"
import { SystemOverview } from "@/components/system-overview"
import { MerchantManagement } from "@/components/merchant-management"
import { SettlementProcessing } from "@/components/settlement-processing"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [systemStats, setSystemStats] = useState({
    totalMerchants: 1247,
    activeMerchants: 1156,
    pendingApprovals: 23,
    totalUPIs: 3421,
    totalTransactions: 45678,
    totalVolume: "2,345,678.50 APT",
    systemHealth: "healthy" as "healthy" | "warning" | "critical",
    lastUpdated: new Date().toLocaleString(),
  })

  const [recentActivity, setRecentActivity] = useState([
    {
      id: "1",
      type: "merchant_registration",
      message: 'New merchant "Tech Store" registered',
      timestamp: "2 minutes ago",
      severity: "info" as "info" | "warning" | "error",
    },
    {
      id: "2",
      type: "settlement_completed",
      message: "Batch settlement #1234 completed (₹2,45,000)",
      timestamp: "5 minutes ago",
      severity: "info" as "info" | "warning" | "error",
    },
    {
      id: "3",
      type: "system_alert",
      message: "High transaction volume detected",
      timestamp: "10 minutes ago",
      severity: "warning" as "info" | "warning" | "error",
    },
  ])

  const refreshData = () => {
    setSystemStats((prev) => ({
      ...prev,
      lastUpdated: new Date().toLocaleString(),
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">P2M Admin Dashboard</h1>
              <p className="text-muted-foreground">Payment to Merchant System Administration</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={systemStats.systemHealth === "healthy" ? "default" : "destructive"}>
                {systemStats.systemHealth === "healthy" ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                System {systemStats.systemHealth}
              </Badge>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalMerchants.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{systemStats.activeMerchants} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalTransactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalVolume}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Alert */}
        {recentActivity.some((activity) => activity.severity === "warning" || activity.severity === "error") && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>System alerts detected. Check the activity feed for details.</AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="merchants">Merchants</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SystemOverview systemStats={systemStats} recentActivity={recentActivity} />
          </TabsContent>

          <TabsContent value="merchants">
            <MerchantManagement />
          </TabsContent>

          <TabsContent value="settlements">
            <SettlementProcessing />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
