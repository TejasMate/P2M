"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import { RefreshCw, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react"

interface Transaction {
  id: string
  txHash: string
  merchant: string
  upiId: string
  amount: string
  status: "completed" | "pending" | "failed"
  timestamp: string
  type: string
}

export function TransactionHistory() {
  const [transactions] = useState<Transaction[]>([
    {
      id: "1",
      txHash: "0xabc123...def456",
      merchant: "Demo Coffee Shop",
      upiId: "demo@merchant",
      amount: "2.5 APT",
      status: "completed",
      timestamp: "2024-01-15 10:30:00",
      type: "payment",
    },
    {
      id: "2",
      txHash: "0x789xyz...012abc",
      merchant: "Test Electronics Store",
      upiId: "test@store",
      amount: "15.0 APT",
      status: "pending",
      timestamp: "2024-01-15 09:15:00",
      type: "payment",
    },
    {
      id: "3",
      txHash: "0xdef456...ghi789",
      merchant: "Local Grocery Store",
      upiId: "grocery@local",
      amount: "5.75 APT",
      status: "failed",
      timestamp: "2024-01-14 18:45:00",
      type: "payment",
    },
    {
      id: "4",
      txHash: "0x111222...333444",
      merchant: "Demo Coffee Shop",
      upiId: "demo@merchant",
      amount: "3.25 APT",
      status: "completed",
      timestamp: "2024-01-14 14:20:00",
      type: "payment",
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleRefresh = () => {
    toast.info("Refreshing transactions...")
  }

  const openTransaction = (txHash: string) => {
    toast.info(`Opening transaction: ${txHash}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Transaction History</h2>
          <p className="text-gray-600 mt-1">View all your payment transactions</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {transactions.map((tx) => (
          <Card key={tx.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(tx.status)}
                    <h3 className="font-semibold text-lg">{tx.merchant}</h3>
                    <Badge variant={getStatusVariant(tx.status)}>{tx.status.toUpperCase()}</Badge>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>UPI ID: {tx.upiId}</p>
                    <p>Transaction: {tx.txHash}</p>
                    <p>Date: {tx.timestamp}</p>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <p className="font-bold text-xl">{tx.amount}</p>
                  <Button onClick={() => openTransaction(tx.txHash)} variant="outline" size="sm">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {transactions.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-500 text-lg">No transactions found</p>
            <p className="text-gray-400 text-sm mt-2">Your payment history will appear here</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
