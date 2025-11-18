'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { campaignsAPI } from '@/lib/api'
import { formatDate, formatIndianNumber } from '@/lib/utils'
import type { Campaign } from '@/types'

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const response = await campaignsAPI.list()
      setCampaigns(response.data)
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setLoading(false)
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

  const getCampaignIcon = (type: string) => {
    const icons: Record<string, string> = {
      LINK: '🔗',
      WHATSAPP: '💬',
      GOOGLE_REVIEW: '⭐',
      FEEDBACK_FORM: '📝',
      VCARD: '👤',
    }
    return icons[type] || '📱'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-responsive py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage your QR campaigns</p>
            </div>
            <Button asChild>
              <Link href="/get-started">Create Campaign</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container-responsive py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Campaigns</p>
                <p className="text-3xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Scans</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatIndianNumber(campaigns.reduce((sum, c) => sum + (c._count?.scans || 0), 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
                <p className="text-3xl font-bold text-gray-900">
                  {campaigns.filter(c => c.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Scans Today</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Campaigns List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-display text-gray-900">
              Your Campaigns
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-gray-600">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="py-12">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No campaigns yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first QR campaign to get started!
                </p>
                <Button asChild>
                  <Link href="/get-started">Create Campaign</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6">
              {campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/dashboard/campaigns/${campaign.id}`}>
                  <Card padding="lg" hover>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-4xl">{getCampaignIcon(campaign.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {campaign.name}
                            </h3>
                            <Badge variant={campaign.isActive ? 'success' : 'default'}>
                              {campaign.isActive ? 'Active' : 'Paused'}
                            </Badge>
                            <Badge variant="info">
                              {getCampaignTypeLabel(campaign.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Created {formatDate(campaign.createdAt)}
                          </p>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>{formatIndianNumber(campaign._count?.scans || 0)} scans</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <span className="font-mono text-xs">/{campaign.slug}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
