'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { formatDateTime } from '@/lib/utils'
import type { FormSubmission } from '@/types'

export default function FeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')

  useEffect(() => {
    loadSubmissions()
  }, [campaignId])

  const loadSubmissions = async () => {
    try {
      // Mock data for now
      const mockSubmissions: FormSubmission[] = [
        {
          id: '1',
          formId: 'form1',
          campaignId,
          data: {
            name: 'Rajesh Kumar',
            email: 'rajesh@example.com',
            phone: '+91 98765 43210',
            rating: 5,
            feedback: 'Excellent product! Very satisfied with the quality.',
          },
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          formId: 'form1',
          campaignId,
          data: {
            name: 'Priya Sharma',
            email: 'priya@example.com',
            rating: 4,
            feedback: 'Good service, fast delivery.',
          },
          submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          formId: 'form1',
          campaignId,
          data: {
            name: 'Amit Patel',
            phone: '+91 88888 88888',
            rating: 5,
            feedback: 'Amazing! Will order again.',
          },
          submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ]

      setSubmissions(mockSubmissions)
    } catch (error) {
      console.error('Failed to load submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      submission.data.name?.toLowerCase().includes(searchLower) ||
      submission.data.email?.toLowerCase().includes(searchLower) ||
      submission.data.phone?.includes(searchTerm) ||
      submission.data.feedback?.toLowerCase().includes(searchLower)
    )
  })

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating)
  }

  const exportToCSV = () => {
    // Simple CSV export
    const headers = ['Date', 'Name', 'Email', 'Phone', 'Rating', 'Feedback']
    const rows = submissions.map((sub) => [
      formatDateTime(sub.submittedAt),
      sub.data.name || '',
      sub.data.email || '',
      sub.data.phone || '',
      sub.data.rating || '',
      sub.data.feedback || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback-${campaignId}-${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container-responsive py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href={`/dashboard/campaigns/${campaignId}`}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3"
              >
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Campaign
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-gray-900 mb-1">
                Feedback Submissions
              </h1>
              <p className="text-gray-600">
                {submissions.length} total submission{submissions.length !== 1 ? 's' : ''}
              </p>
            </div>

            <Button onClick={exportToCSV}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container-responsive py-8">
        {/* Filters */}
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, phone, or feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
              />
            </div>
            <Select
              options={[
                { value: 'date-desc', label: 'Newest First' },
                { value: 'date-asc', label: 'Oldest First' },
                { value: 'rating-desc', label: 'Highest Rating' },
                { value: 'rating-asc', label: 'Lowest Rating' },
              ]}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            />
          </div>
        </Card>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No matching submissions' : 'No submissions yet'}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Share your QR code with customers to start receiving feedback!'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission.id} padding="lg" hover>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {submission.data.name || 'Anonymous'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(submission.submittedAt)}
                    </p>
                  </div>
                  {submission.data.rating && (
                    <div className="text-2xl" title={`${submission.data.rating}/5 stars`}>
                      {getRatingStars(submission.data.rating)}
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  {submission.data.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a href={`mailto:${submission.data.email}`} className="hover:text-primary-600">
                        {submission.data.email}
                      </a>
                    </div>
                  )}
                  {submission.data.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a href={`tel:${submission.data.phone}`} className="hover:text-primary-600">
                        {submission.data.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Feedback Text */}
                {submission.data.feedback && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 italic">"{submission.data.feedback}"</p>
                  </div>
                )}

                {/* Additional Fields */}
                {Object.entries(submission.data).map(([key, value]) => {
                  if (['name', 'email', 'phone', 'rating', 'feedback'].includes(key)) {
                    return null
                  }
                  return (
                    <div key={key} className="mt-3 text-sm">
                      <span className="font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>{' '}
                      <span className="text-gray-600">{String(value)}</span>
                    </div>
                  )
                })}
              </Card>
            ))}
          </div>
        )}

        {/* Pagination - Placeholder */}
        {filteredSubmissions.length > 0 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
