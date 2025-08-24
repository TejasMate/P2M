"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Search, Filter, CheckCircle, XCircle, Clock, Eye, MoreHorizontal } from "lucide-react"

export function MerchantManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const { toast } = useToast()

  // Mock merchant data
  const merchants = [
    {
      id: "M001",
      name: "Tech Store",
      email: "contact@techstore.com",
      upiId: "techstore@paytm",
      status: "active",
      registrationDate: "2024-01-15",
      totalTransactions: 1250,
      totalVolume: "45,678.50 APT",
    },
    {
      id: "M002",
      name: "Fashion Hub",
      email: "info@fashionhub.com",
      upiId: "fashionhub@gpay",
      status: "pending",
      registrationDate: "2024-01-20",
      totalTransactions: 0,
      totalVolume: "0 APT",
    },
    {
      id: "M003",
      name: "Food Corner",
      email: "orders@foodcorner.com",
      upiId: "foodcorner@phonepe",
      status: "suspended",
      registrationDate: "2024-01-10",
      totalTransactions: 890,
      totalVolume: "23,456.75 APT",
    },
  ]

  const pendingApprovals = merchants.filter((m) => m.status === "pending")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "suspended":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleApprove = (merchantId: string) => {
    console.log(`Approving merchant ${merchantId}`)
    toast({
      title: "Merchant Approved",
      description: `Merchant ${merchantId} has been approved successfully.`,
    })
  }

  const handleReject = (merchantId: string) => {
    console.log(`Rejecting merchant ${merchantId}`)
    toast({
      title: "Merchant Rejected",
      description: `Merchant ${merchantId} has been rejected.`,
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Merchants</TabsTrigger>
            <TabsTrigger value="pending">Pending Approvals ({pendingApprovals.length})</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search merchants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Merchants</CardTitle>
              <CardDescription>Complete list of registered merchants</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>UPI ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{merchant.name}</p>
                          <p className="text-sm text-muted-foreground">{merchant.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{merchant.upiId}</TableCell>
                      <TableCell>{getStatusBadge(merchant.status)}</TableCell>
                      <TableCell>{merchant.registrationDate}</TableCell>
                      <TableCell>{merchant.totalTransactions.toLocaleString()}</TableCell>
                      <TableCell>{merchant.totalVolume}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Merchants awaiting approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((merchant) => (
                  <div key={merchant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{merchant.name}</h4>
                      <p className="text-sm text-muted-foreground">{merchant.email}</p>
                      <p className="text-sm font-mono">{merchant.upiId}</p>
                      <p className="text-xs text-muted-foreground">Registered: {merchant.registrationDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleReject(merchant.id)}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(merchant.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Merchants</CardTitle>
              <CardDescription>Currently active merchants</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>UPI ID</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants
                    .filter((m) => m.status === "active")
                    .map((merchant) => (
                      <TableRow key={merchant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{merchant.name}</p>
                            <p className="text-sm text-muted-foreground">{merchant.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{merchant.upiId}</TableCell>
                        <TableCell>{merchant.totalTransactions.toLocaleString()}</TableCell>
                        <TableCell>{merchant.totalVolume}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspended">
          <Card>
            <CardHeader>
              <CardTitle>Suspended Merchants</CardTitle>
              <CardDescription>Merchants currently suspended</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>UPI ID</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants
                    .filter((m) => m.status === "suspended")
                    .map((merchant) => (
                      <TableRow key={merchant.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{merchant.name}</p>
                            <p className="text-sm text-muted-foreground">{merchant.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{merchant.upiId}</TableCell>
                        <TableCell>{merchant.registrationDate}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Reactivate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
