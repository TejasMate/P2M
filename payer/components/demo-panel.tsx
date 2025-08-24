"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"
import { Settings, Wallet, Store, CreditCard, BarChart3, X } from "lucide-react"

export function DemoPanel() {
  const [isOpen, setIsOpen] = useState(false)

  const demoActions = [
    {
      icon: <Wallet className="w-4 h-4" />,
      label: "Connect Demo Wallet",
      action: () => toast.success("Demo: Wallet connected!"),
      description: "Simulate wallet connection",
    },
    {
      icon: <Store className="w-4 h-4" />,
      label: "Load Test Merchant",
      action: () => toast.info("Demo: Using test merchant"),
      description: "Load demo merchant data",
    },
    {
      icon: <CreditCard className="w-4 h-4" />,
      label: "Simulate Payment",
      action: () => toast.success("Demo: Payment simulated!"),
      description: "Test payment flow",
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      label: "Load Demo Data",
      action: () => toast.info("Demo: Loading transactions..."),
      description: "Populate with sample data",
    },
  ]

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-12 h-12 shadow-lg"
        size="sm"
      >
        <Settings className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Demo Controls</CardTitle>
          <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {demoActions.map((action, index) => (
          <Button
            key={index}
            onClick={action.action}
            variant="outline"
            className="w-full justify-start h-auto p-3 bg-transparent"
          >
            <div className="flex items-center space-x-3">
              {action.icon}
              <div className="text-left">
                <div className="font-medium text-sm">{action.label}</div>
                <div className="text-xs text-gray-500">{action.description}</div>
              </div>
            </div>
          </Button>
        ))}

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500 text-center">Demo UPI IDs: demo@merchant, test@store, grocery@local</p>
        </div>
      </CardContent>
    </Card>
  )
}
