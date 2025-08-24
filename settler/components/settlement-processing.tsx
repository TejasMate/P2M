"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Play, CheckCircle, Clock, AlertCircle, Download, RefreshCw } from "lucide-react"

export function SettlementProcessing() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const { toast } = useToast()

  // Mock settlement data
  const settlements = [
    {
      id: "S001",
      batchId: "BATCH_2024_001",
      status: "completed",
      merchantCount: 45,
      totalAmount: "123,456.78 APT",
      processedAt: "2024-01-20 14:30:00",
      transactionCount: 1250,
    },
    {
      id: "S002",
      batchId: "BATCH_2024_002",
      status: "processing",
      merchantCount: 32,
      totalAmount: "89,234.56 APT",
      processedAt: "In Progress",
      transactionCount: 890,
    },
    {
      id: "S003",
      batchId: "BATCH_2024_003",
      status: "pending",
      merchantCount: 28,
      totalAmount: "67,890.12 APT",
      processedAt: "Pending",
      transactionCount: 675,
    },
  ]

  const pendingTransactions = [
    {
      id: "T001",
      merchantName: "Tech Store",
      upiId: "techstore@paytm",
      amount: "1,234.56 APT",
      transactionDate: "2024-01-20",
      status: "pending_settlement",
    },
    {
      id: "T002",
      merchantName: "Fashion Hub",
      upiId: "fashionhub@gpay",
      amount: "2,345.67 APT",
      transactionDate: "2024-01-20",
      status: "pending_settlement",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="secondary">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const startBatchSettlement = () => {
    setIsProcessing(true)
    setProcessingProgress(0)

    toast({
      title: "Batch Settlement Started",
      description: "Processing pending settlements...",
    })

    // Simulate processing
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsProcessing(false)
          toast({
            title: "Batch Settlement Complete",
            description: "All pending settlements have been processed successfully.",
          })
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  return (
    <div className="space-y-6">
      {/* Settlement Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Batch Settlement</CardTitle>
            <CardDescription>Process pending settlements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pending Transactions</span>
                <span className="font-medium">{pendingTransactions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Amount</span>
                <span className="font-medium">3,580.23 APT</span>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} />
              </div>
            )}

            <Button onClick={startBatchSettlement} disabled={isProcessing} className="w-full">
              {isProcessing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {isProcessing ? "Processing..." : "Start Batch Settlement"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settlement Stats</CardTitle>
            <CardDescription>Today's settlement metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Completed Batches</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Settled</span>
                <span className="font-medium">280,581.46 APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Merchants Paid</span>
                <span className="font-medium">105</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Success Rate</span>
                <span className="font-medium text-green-600">99.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Settlement management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Export Settlement Report
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Failed Settlements
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <AlertCircle className="w-4 h-4 mr-2" />
              View Settlement Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Settlement History */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
          <CardDescription>Recent batch settlements</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Merchants</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Processed At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((settlement) => (
                <TableRow key={settlement.id}>
                  <TableCell className="font-mono text-sm">{settlement.batchId}</TableCell>
                  <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                  <TableCell>{settlement.merchantCount}</TableCell>
                  <TableCell>{settlement.transactionCount.toLocaleString()}</TableCell>
                  <TableCell>{settlement.totalAmount}</TableCell>
                  <TableCell>{settlement.processedAt}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
          <CardDescription>Transactions awaiting settlement</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>UPI ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                  <TableCell>{transaction.merchantName}</TableCell>
                  <TableCell className="font-mono text-sm">{transaction.upiId}</TableCell>
                  <TableCell>{transaction.amount}</TableCell>
                  <TableCell>{transaction.transactionDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Settlement
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
