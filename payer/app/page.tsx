"use client"

import { useState } from "react"
import { WalletConnect } from "@/components/wallet-connect"
import { PaymentForm } from "@/components/payment-form"
import { TransactionHistory } from "@/components/transaction-history"
import { DemoPanel } from "@/components/demo-panel"
import { Toaster } from "react-hot-toast"

export default function PayerDashboard() {
  const [activeTab, setActiveTab] = useState("payment")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">P2M Payer Dashboard</h1>
              <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Aptos Blockchain</span>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("payment")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "payment"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Make Payment
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Transaction History
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === "payment" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Pay with Cryptocurrency</h2>
              <p className="text-gray-600">Send payments to merchants using their UPI IDs on the Aptos blockchain</p>
            </div>
            <PaymentForm />
          </div>
        )}

        {activeTab === "history" && <TransactionHistory />}
      </main>

      {/* Demo Panel for Testing */}
      <DemoPanel />
    </div>
  )
}
