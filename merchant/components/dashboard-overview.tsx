import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Users, CreditCard, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react"

const stats = [
  {
    name: "Total Revenue",
    value: "₹2,45,678",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    name: "Active UPI IDs",
    value: "8",
    change: "+2",
    changeType: "positive" as const,
    icon: CreditCard,
  },
  {
    name: "Total Transactions",
    value: "1,234",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: Activity,
  },
  {
    name: "Settlement Pending",
    value: "₹12,450",
    change: "-2.1%",
    changeType: "negative" as const,
    icon: Users,
  },
]

const recentTransactions = [
  {
    id: "TXN001",
    customer: "Rajesh Kumar",
    amount: "₹1,250",
    status: "completed",
    time: "2 minutes ago",
    upiId: "merchant@paytm",
  },
  {
    id: "TXN002",
    customer: "Priya Sharma",
    amount: "₹850",
    status: "pending",
    time: "5 minutes ago",
    upiId: "business@gpay",
  },
  {
    id: "TXN003",
    customer: "Amit Singh",
    amount: "₹2,100",
    status: "completed",
    time: "12 minutes ago",
    upiId: "merchant@paytm",
  },
]

export function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground font-sans">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2 font-serif">
          Welcome back! Here's what's happening with your merchant account today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground font-serif">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground font-sans">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {stat.changeType === "positive" ? (
                  <ArrowUpRight className="h-3 w-3 text-chart-5 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-chart-4 mr-1" />
                )}
                <span className={stat.changeType === "positive" ? "text-chart-5" : "text-chart-4"}>{stat.change}</span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground font-sans">Recent Transactions</CardTitle>
            <CardDescription className="font-serif">Latest payment activities on your merchant account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-card-foreground font-serif">{transaction.customer}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{transaction.id}</span>
                      <span>•</span>
                      <span>{transaction.upiId}</span>
                      <span>•</span>
                      <span>{transaction.time}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-card-foreground font-sans">{transaction.amount}</p>
                    <Badge variant={transaction.status === "completed" ? "default" : "secondary"} className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 bg-transparent">
              View All Transactions
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground font-sans">Quick Actions</CardTitle>
            <CardDescription className="font-serif">Frequently used merchant operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button className="justify-start h-12 bg-transparent" variant="outline">
                <CreditCard className="h-4 w-4 mr-3" />
                Add New UPI ID
              </Button>
              <Button className="justify-start h-12 bg-transparent" variant="outline">
                <DollarSign className="h-4 w-4 mr-3" />
                Generate Payment Link
              </Button>
              <Button className="justify-start h-12 bg-transparent" variant="outline">
                <TrendingUp className="h-4 w-4 mr-3" />
                View Analytics Report
              </Button>
              <Button className="justify-start h-12 bg-transparent" variant="outline">
                <Activity className="h-4 w-4 mr-3" />
                Settlement History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
