"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Building2, MapPin, FileText, Shield, CheckCircle, AlertCircle, Clock, Edit, Save, X } from "lucide-react"

// Mock merchant data
const merchantData = {
  id: "MERCH_001",
  businessName: "Tech Solutions Pvt Ltd",
  ownerName: "Rajesh Kumar",
  email: "rajesh@techsolutions.com",
  phone: "+91 9876543210",
  address: {
    street: "123 Business Park",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    country: "India",
  },
  businessType: "Technology Services",
  gstNumber: "27AABCT1234C1Z5",
  panNumber: "AABCT1234C",
  registrationDate: "2024-01-15",
  kycStatus: "verified",
  verificationLevel: "Level 2",
  businessCategory: "IT Services",
  description:
    "Leading technology solutions provider specializing in software development and digital transformation services.",
  website: "https://techsolutions.com",
  establishedYear: "2020",
}

const kycDocuments = [
  { type: "PAN Card", status: "verified", uploadDate: "2024-01-15" },
  { type: "GST Certificate", status: "verified", uploadDate: "2024-01-15" },
  { type: "Bank Statement", status: "verified", uploadDate: "2024-01-16" },
  { type: "Address Proof", status: "pending", uploadDate: "2024-01-20" },
]

export function MerchantProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(merchantData)

  const handleSave = () => {
    // In a real app, this would make an API call
    console.log("[v0] Saving merchant profile:", formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData(merchantData)
    setIsEditing(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-chart-5" />
      case "pending":
        return <Clock className="h-4 w-4 text-chart-3" />
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-chart-4" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-chart-5/10 text-chart-5 border-chart-5/20">Verified</Badge>
      case "pending":
        return <Badge className="bg-chart-3/10 text-chart-3 border-chart-3/20">Pending</Badge>
      case "rejected":
        return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">Rejected</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-sans">Merchant Profile</h1>
          <p className="text-muted-foreground mt-2 font-serif">
            Manage your business information and verification status
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="kyc">KYC & Verification</TabsTrigger>
          <TabsTrigger value="business">Business Details</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Overview */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                    {formData.businessName.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-card-foreground font-sans">{formData.businessName}</CardTitle>
                    <CardDescription className="font-serif">Merchant ID: {formData.id}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(formData.kycStatus)}
                  <p className="text-sm text-muted-foreground mt-1">{formData.verificationLevel}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Basic Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground font-sans flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground font-sans flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.address.pincode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, pincode: e.target.value },
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-6">
          {/* KYC Status */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground font-sans flex items-center gap-2">
                <Shield className="h-5 w-5" />
                KYC Verification Status
              </CardTitle>
              <CardDescription className="font-serif">
                Your account verification level and document status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {getStatusIcon(formData.kycStatus)}
                  <div>
                    <p className="font-medium text-card-foreground">Verification Status</p>
                    <p className="text-sm text-muted-foreground">{formData.verificationLevel}</p>
                  </div>
                </div>
                {getStatusBadge(formData.kycStatus)}
              </div>
            </CardContent>
          </Card>

          {/* Document Status */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground font-sans flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {kycDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(doc.status)}
                      <div>
                        <p className="font-medium text-card-foreground">{doc.type}</p>
                        <p className="text-sm text-muted-foreground">Uploaded: {doc.uploadDate}</p>
                      </div>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                Upload New Document
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          {/* Business Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground font-sans flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select disabled={!isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder={formData.businessType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology Services</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="food">Food & Beverage</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input
                    id="establishedYear"
                    value={formData.establishedYear}
                    onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
