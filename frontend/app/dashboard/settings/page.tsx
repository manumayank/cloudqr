'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Card from '@/components/ui/Card'
import { api } from '@/lib/api'
import type { Business } from '@/types'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string>('')

  const [businessData, setBusinessData] = useState<Partial<Business>>({
    name: '',
    phone: '',
    email: '',
    logoUrl: '',
    brandColor: '#6366f1',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  useEffect(() => {
    loadBusinessData()
  }, [])

  const loadBusinessData = async () => {
    setLoading(true)
    try {
      // In real implementation, fetch from API
      // const response = await api.get('/businesses/me')
      // setBusinessData(response.data)

      // Mock data for now
      setBusinessData({
        name: 'Sample Business',
        phone: '+91 98765 43210',
        email: 'business@example.com',
        brandColor: '#6366f1',
      })
    } catch (error) {
      console.error('Failed to load business data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
        setBusinessData({ ...businessData, logoUrl: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // await api.put('/businesses/me', businessData)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-responsive py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3"
              >
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900">
                Business Settings
              </h1>
              <p className="text-gray-600 mt-1">Manage your business profile and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container-tight py-8">
        <div className="space-y-6">
          {/* Business Profile */}
          <Card padding="lg">
            <h2 className="text-xl font-semibold mb-6">Business Profile</h2>

            <div className="space-y-5">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Business Logo
                </label>
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    {logoPreview || businessData.logoUrl ? (
                      <img
                        src={logoPreview || businessData.logoUrl}
                        alt="Business logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload Logo
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG or JPG, max 2MB. This logo will appear on all your QR cards.
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Name */}
              <Input
                label="Business Name"
                value={businessData.name}
                onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                placeholder="Your Business Name"
                fullWidth
                required
              />

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={businessData.email}
                  onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                  placeholder="business@example.com"
                  fullWidth
                  required
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={businessData.phone}
                  onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  fullWidth
                  required
                />
              </div>

              {/* Brand Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={businessData.brandColor}
                    onChange={(e) => setBusinessData({ ...businessData, brandColor: e.target.value })}
                    className="h-10 w-20 rounded-lg border-2 border-gray-300 cursor-pointer"
                  />
                  <Input
                    value={businessData.brandColor}
                    onChange={(e) => setBusinessData({ ...businessData, brandColor: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This color will be used as an accent on your QR cards
                </p>
              </div>
            </div>
          </Card>

          {/* Address */}
          <Card padding="lg">
            <h2 className="text-xl font-semibold mb-6">Business Address</h2>

            <div className="space-y-4">
              <Textarea
                label="Street Address"
                value={businessData.address}
                onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                placeholder="Building name, street, area"
                fullWidth
                rows={3}
              />

              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="City"
                  value={businessData.city}
                  onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
                  placeholder="Mumbai"
                  fullWidth
                />
                <Input
                  label="State"
                  value={businessData.state}
                  onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })}
                  placeholder="Maharashtra"
                  fullWidth
                />
                <Input
                  label="PIN Code"
                  value={businessData.pincode}
                  onChange={(e) => setBusinessData({ ...businessData, pincode: e.target.value })}
                  placeholder="400001"
                  fullWidth
                  maxLength={6}
                />
              </div>
            </div>
          </Card>

          {/* Account Settings */}
          <Card padding="lg">
            <h2 className="text-xl font-semibold mb-6">Account Settings</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive email alerts for new scans and feedback</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">WhatsApp Notifications</p>
                  <p className="text-sm text-gray-600">Get instant alerts on WhatsApp</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Weekly Summary Report</p>
                  <p className="text-sm text-gray-600">Get weekly analytics summary via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card padding="lg" className="border-error-200">
            <h2 className="text-xl font-semibold text-error-700 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Delete Account</p>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="danger" size="sm">
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              size="lg"
              onClick={handleSave}
              loading={saving}
            >
              Save Changes
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={loadBusinessData}
            >
              Cancel
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
