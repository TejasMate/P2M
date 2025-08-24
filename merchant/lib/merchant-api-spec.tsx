"use client"
\
import { useState } from "react"
\
# Merchant Dashboard Development Prompt

## Project Overview
\
Build a **Merchant Dashboard**
for the P2M System - a comprehensive
business
management
interface
for merchants to manage UPI
registrations, monitor
payments, handle
escrow
wallets, and
track
revenue
analytics.

\
## Technical Stack
\
- **Framework**: React 18+
with TypeScript
\
- **Blockchain**: Aptos SDK (
@aptos
;-labs / ts - sdk
v1
0.28
.0+
)
\
- **Styling**: Tailwind CSS
with shadcn/ui components
\
- **Charts**: Recharts or Chart.js
for analytics
\
- **State Management**
: Zustand
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
\
- **File Upload**: React Dropzone (
for KYC documents)

\
## Smart Contract Details
- **Contract Address**: `0xf9d57e56266876b07459f919263caf276b07978766ace8e17b65003bd227fea5`
- **Module**: `p2m_system::upi_registry`

## Core Features & Demo Implementation

### 1. Merchant Registration & Profile
```typescript
// MerchantProfile.tsx - Demo Implementation
const MerchantProfile = () => {
  const [profile, setProfile] = useState({
    businessName: "Demo Coffee Shop",
    contactInfo: "demo@coffee.com",
    businessType: "Restaurant",
    address: "123 Main Street, City",
    registrationStatus: "verified",
    kycStatus: "approved",
  })
  const [isEditing, setIsEditing] = useState(false)

  const handleSaveProfile = async () => {
    // Demo: Simulate API call
    toast.success("Profile updated successfully!")
    setIsEditing(false)
  }

  const handleKYCUpload = () => {
    // Demo: Simulate file upload
    toast.success("KYC documents uploaded successfully!")
    setProfile((prev) => ({ ...prev, kycStatus: "pending" }))
  }

  return (
    <div className="merchant-profile max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Business Profile</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Business Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.businessName}
                onChange={(e) => setProfile((prev) => ({ ...prev, businessName: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            ) : (
              <p className="text-gray-800">{profile.businessName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contact Email</label>
            {isEditing ? (
              <input
                type="email"
                value={profile.contactInfo}
                onChange={(e) => setProfile((prev) => ({ ...prev, contactInfo: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              />
            ) : (
              <p className="text-gray-800">{profile.contactInfo}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Business Type</label>
            {isEditing ? (
              <select
                value={profile.businessType}
                onChange={(e) => setProfile((prev) => ({ ...prev, businessType: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="Restaurant">Restaurant</option>
                <option value="Retail">Retail</option>
                <option value="Services">Services</option>
                <option value="Online">Online Business</option>
              </select>
            ) : (
              <p className="text-gray-800">{profile.businessType}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Registration Status</label>
            <span
              className={`inline-block px-3 py-1 rounded text-sm ${
                profile.registrationStatus === "verified"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {profile.registrationStatus.toUpperCase()}
            </span>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6">
            <button
              onClick={handleSaveProfile}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 mr-2"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* KYC Section */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">KYC Verification</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Status:
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs ${
                    profile.kycStatus === "approved"
                      ? "bg-green-100 text-green-800"
                      : profile.kycStatus === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {profile.kycStatus.toUpperCase()}
                </span>
              </p>
            </div>
            <button onClick={handleKYCUpload} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Upload KYC Documents
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
