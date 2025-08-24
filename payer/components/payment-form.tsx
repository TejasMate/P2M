"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"
import { Search, Store, CheckCircle, CreditCard } from "lucide-react"

interface MerchantInfo {
  name: string
  address: string
  verified: boolean
  businessType: string
}

export function PaymentForm() {
  const [upiId, setUpiId] = useState("")
  const [amount, setAmount] = useState("")
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Demo merchant data
  const demoMerchants: Record<string, MerchantInfo> = {
    "demo@merchant": {
      name: "Demo Coffee Shop",
      address: "0xabcd...efgh",
      verified: true,
      businessType: "Restaurant",
    },
    "test@store": {
      name: "Test Electronics Store",
      address: "0x9876...5432",
      verified: true,
      businessType: "Electronics",
    },
    "grocery@local": {
      name: "Local Grocery Store",
      address: "0x5555...9999",
      verified: true,
      businessType: "Grocery",
    },
  }

  const handleUpiLookup = async () => {
    if (!upiId) {
      toast.error("Please enter a UPI ID")
      return
    }

    setIsLoading(true)

    // Demo: Simulate API call delay
    setTimeout(() => {
      const merchant = demoMerchants[upiId]
      if (merchant) {
        setMerchantInfo(merchant)
        toast.success("Merchant found!")
      } else {
        toast.error("Merchant not found")
        setMerchantInfo(null)
      }
      setIsLoading(false)
    }, 1000)
  }

  const handlePayment = async () => {
    if (!merchantInfo || !amount) {
      toast.error("Please complete all fields")
      return
    }

    if (Number.parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsLoading(true)

    // Demo: Simulate payment processing
    setTimeout(() => {
      const txHash = "0x" + Math.random().toString(16).substr(2, 8)
      toast.success(`Payment successful! TX: ${txHash}`)
      setIsLoading(false)

      // Reset form
      setUpiId("")
      setAmount("")
      setMerchantInfo(null)
    }, 2000)
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Make Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* UPI ID Input */}
          <div className="space-y-2">
            <Label htmlFor="upi-id">Merchant UPI ID</Label>
            <div className="flex gap-2">
              <Input
                id="upi-id"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="Enter UPI ID (try: demo@merchant)"
                className="flex-1"
              />
              <Button onClick={handleUpiLookup} disabled={!upiId || isLoading} variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Merchant Info Display */}
          {merchantInfo && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <Store className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <h3 className="font-semibold text-green-800">{merchantInfo.name}</h3>
                      <p className="text-sm text-green-600">Type: {merchantInfo.businessType}</p>
                      <p className="text-xs text-green-500">Address: {merchantInfo.address}</p>
                    </div>
                  </div>
                  {merchantInfo.verified && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">Verified</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (APT)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          {/* Payment Button */}
          <Button onClick={handlePayment} disabled={!merchantInfo || !amount || isLoading} className="w-full">
            {isLoading ? "Processing..." : `Pay ${amount || "0"} APT`}
          </Button>

          {/* Demo Quick Actions */}
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Quick Demo:</p>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setUpiId("demo@merchant")} variant="outline" size="sm">
                Demo UPI
              </Button>
              <Button onClick={() => setUpiId("test@store")} variant="outline" size="sm">
                Test Store
              </Button>
              <Button onClick={() => setAmount("1.5")} variant="outline" size="sm">
                Set Amount
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
