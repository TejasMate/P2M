"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { Wallet, LogOut } from "lucide-react"

export function WalletConnect() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [balance, setBalance] = useState("0")

  const handleConnect = async () => {
    // Demo: Simulate wallet connection
    setIsConnected(true)
    setWalletAddress("0x1234...5678")
    setBalance("10.5 APT")
    toast.success("Wallet connected successfully!")
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setWalletAddress("")
    setBalance("0")
    toast.info("Wallet disconnected")
  }

  if (!isConnected) {
    return (
      <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700 text-white">
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{walletAddress}</p>
        <p className="text-xs text-gray-500">Balance: {balance}</p>
      </div>
      <Button onClick={handleDisconnect} variant="outline" size="sm">
        <LogOut className="w-4 h-4 mr-2" />
        Disconnect
      </Button>
    </div>
  )
}
