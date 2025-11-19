'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { campaignsAPI, analyticsAPI } from '@/lib/api'
import { formatDate, formatIndianNumber, getRelativeTime } from '@/lib/utils'
import type { Campaign, AnalyticsSummary } from '@/types'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editData, setEditData] = useState({
    targetUrl: '',
    whatsappNumber: '',
    googlePlaceId: '',
  })

  useEffect(() => {
    loadCampaignData()
  }, [campaignId])

  const loadCampaignData = async () => {
    try {
      const [campaignRes, analyticsRes] = await Promise.all([
        campaignsAPI.get(campaignId),
        analyticsAPI.summary(campaignId),
      ])

      setCampaign(campaignRes.data)
      setAnalytics(analyticsRes.data)

      setEditData({
        targetUrl: campaignRes.data.targetUrl || '',
        whatsappNumber: campaignRes.data.whatsappNumber || '',
        googlePlaceId: campaignRes.data.googlePlaceId || '',
      })
    } catch (error) {
      console.error('Failed to load campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDestination = async () => {
    if (!campaign) return

    try {
      await campaignsAPI.update(campaignId, editData)
      setEditModalOpen(false)
      loadCampaignData()
    } catch (error) {
      console.error('Failed to update campaign:', error)
      alert('Failed to update destination. Please try again.')
    }
  }

  const toggleCampaignStatus = async () => {
    if (!campaign) return

    try {
      await campaignsAPI.update(campaignId, { isActive: !campaign.isActive })
      loadCampaignData()
    } catch (error) {
      console.error('Failed to toggle status:', error)
    }
  }

  const getCampaignTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      LINK: 'Custom Link',
      WHATSAPP: 'WhatsApp',
      GOOGLE_REVIEW: 'Google Reviews',
      FEEDBACK_FORM: 'Feedback Form',
      VCARD: 'Contact Card',
    }
    return labels[type] || type
  }

  const getQRUrl = () => {
    return `${process.env.NEXT_PUBLIC_APP_URL}/r/${campaign?.slug}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card padding="lg" className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</h2>
          <p className="text-gray-600 mb-6">This campaign doesn't exist or you don't have access to it.</p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-responsive py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3"
              >
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900">
                  {campaign.name}
                </h1>
                <Badge variant={campaign.isActive ? 'success' : 'default'}>
                  {campaign.isActive ? 'Active' : 'Paused'}
                </Badge>
                <Badge variant="info">{getCampaignTypeLabel(campaign.type)}</Badge>
              </div>
              <p className="text-gray-600">Created {formatDate(campaign.createdAt)}</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant={campaign.isActive ? 'outline' : 'primary'}
                onClick={toggleCampaignStatus}
              >
                {campaign.isActive ? 'Pause' : 'Activate'}
              </Button>
              <Button onClick={() => setEditModalOpen(true)}>
                Edit Destination
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-responsive py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card padding="lg">
                <p className="text-sm text-gray-600 mb-1">Total Scans</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatIndianNumber(analytics?.totalScans || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {analytics?.scansToday || 0} today
                </p>
              </Card>

              <Card padding="lg">
                <p className="text-sm text-gray-600 mb-1">This Week</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatIndianNumber(analytics?.scansThisWeek || 0)}
                </p>
                <p className="text-xs text-success-600 mt-2">
                  {analytics?.scansThisWeek && analytics.scansToday
                    ? `+${((analytics.scansToday / analytics.scansThisWeek) * 100).toFixed(0)}% today`
                    : 'No data'}
                </p>
              </Card>

              <Card padding="lg">
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatIndianNumber(analytics?.scansThisMonth || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Avg. {Math.round((analytics?.scansThisMonth || 0) / 30)}/day
                </p>
              </Card>
            </div>

            {/* Analytics Charts - Placeholder */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Scans Over Time</h2>
                <Select
                  options={[
                    { value: '7', label: 'Last 7 days' },
                    { value: '30', label: 'Last 30 days' },
                    { value: '90', label: 'Last 90 days' },
                  ]}
                />
              </div>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Chart will be displayed here</p>
              </div>
            </Card>

            {/* Device & Location Stats */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card padding="lg">
                <h3 className="font-semibold mb-4">Top Devices</h3>
                <div className="space-y-3">
                  {analytics?.topDeviceTypes && analytics.topDeviceTypes.length > 0 ? (
                    analytics.topDeviceTypes.map((device, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {device.deviceType === 'mobile' ? '📱' : device.deviceType === 'desktop' ? '💻' : '📟'}
                          </span>
                          <span className="text-gray-900 capitalize">{device.deviceType}</span>
                        </div>
                        <span className="font-medium">{device.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No scan data yet</p>
                  )}
                </div>
              </Card>

              <Card padding="lg">
                <h3 className="font-semibold mb-4">Top Locations</h3>
                <div className="space-y-3">
                  {analytics?.topLocations && analytics.topLocations.length > 0 ? (
                    analytics.topLocations.map((location, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📍</span>
                          <span className="text-gray-900">{location.city || 'Unknown'}</span>
                        </div>
                        <span className="font-medium">{location.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No location data yet</p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            <Card padding="lg">
              <h3 className="font-semibold mb-4">QR Code</h3>
              <div className="aspect-square bg-white border-4 border-gray-200 rounded-lg mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full p-2">
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="10" height="10" fill="black" />
                  <rect x="20" y="10" width="10" height="10" fill="black" />
                  <rect x="30" y="10" width="10" height="10" fill="black" />
                  <rect x="40" y="10" width="10" height="10" fill="black" />
                  <rect x="50" y="10" width="10" height="10" fill="black" />
                  <rect x="60" y="10" width="10" height="10" fill="black" />
                  <rect x="70" y="10" width="10" height="10" fill="black" />
                  <rect x="80" y="10" width="10" height="10" fill="black" />
                  <rect x="10" y="20" width="10" height="10" fill="black" />
                  <rect x="80" y="20" width="10" height="10" fill="black" />
                  <rect x="10" y="80" width="10" height="10" fill="black" />
                  <rect x="20" y="80" width="10" height="10" fill="black" />
                </svg>
              </div>
              <Button variant="outline" size="sm" fullWidth>
                Download QR Code
              </Button>
            </Card>

            {/* Destination Info */}
            <Card padding="lg">
              <h3 className="font-semibold mb-4">Destination</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Short URL</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-50 px-2 py-1 rounded flex-1 truncate">
                      {getQRUrl()}
                    </code>
                    <button
                      className="text-primary-600 hover:text-primary-700"
                      onClick={() => navigator.clipboard.writeText(getQRUrl())}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {campaign.type === 'LINK' && campaign.targetUrl && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Redirects to</p>
                    <a
                      href={campaign.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline break-all"
                    >
                      {campaign.targetUrl}
                    </a>
                  </div>
                )}

                {campaign.type === 'WHATSAPP' && campaign.whatsappNumber && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">WhatsApp Number</p>
                    <p className="text-sm font-medium">{campaign.whatsappNumber}</p>
                  </div>
                )}

                {campaign.type === 'GOOGLE_REVIEW' && campaign.googlePlaceId && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Google Place ID</p>
                    <p className="text-sm font-mono text-gray-600">{campaign.googlePlaceId}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card padding="lg">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" fullWidth asChild>
                  <Link href={`/dashboard/campaigns/${campaignId}/analytics`}>
                    View Detailed Analytics
                  </Link>
                </Button>
                {campaign.type === 'FEEDBACK_FORM' && (
                  <Button variant="outline" size="sm" fullWidth asChild>
                    <Link href={`/dashboard/campaigns/${campaignId}/feedback`}>
                      View Feedback
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" fullWidth>
                  Export Data
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Destination Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Destination"
        size="md"
      >
        <div className="space-y-4">
          {campaign.type === 'LINK' && (
            <Input
              label="Target URL"
              value={editData.targetUrl}
              onChange={(e) => setEditData({ ...editData, targetUrl: e.target.value })}
              placeholder="https://example.com"
              fullWidth
              helperText="Where should the QR code redirect to?"
            />
          )}

          {campaign.type === 'WHATSAPP' && (
            <Input
              label="WhatsApp Number"
              value={editData.whatsappNumber}
              onChange={(e) => setEditData({ ...editData, whatsappNumber: e.target.value })}
              placeholder="+91 98765 43210"
              fullWidth
              helperText="Include country code (e.g., +91 for India)"
            />
          )}

          {campaign.type === 'GOOGLE_REVIEW' && (
            <Input
              label="Google Place ID"
              value={editData.googlePlaceId}
              onChange={(e) => setEditData({ ...editData, googlePlaceId: e.target.value })}
              placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
              fullWidth
              helperText="Find your Place ID on Google Maps"
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSaveDestination} fullWidth>
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setEditModalOpen(false)} fullWidth>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
