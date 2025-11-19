'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays } from 'date-fns'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { formatIndianNumber } from '@/lib/utils'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const params = useParams()
  const campaignId = params.id as string

  const [timeRange, setTimeRange] = useState('30')
  const [loading, setLoading] = useState(true)

  // Mock data - in real app, fetch from API
  const scansOverTime = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM dd'),
    scans: Math.floor(Math.random() * 50) + 10,
  }))

  const deviceData = [
    { name: 'Mobile', value: 450, percentage: 75 },
    { name: 'Desktop', value: 120, percentage: 20 },
    { name: 'Tablet', value: 30, percentage: 5 },
  ]

  const locationData = [
    { city: 'Mumbai', scans: 180 },
    { city: 'Delhi', scans: 150 },
    { city: 'Bangalore', scans: 120 },
    { city: 'Chennai', scans: 80 },
    { city: 'Kolkata', scans: 70 },
  ]

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    scans: Math.floor(Math.random() * 30),
  }))

  const browserData = [
    { name: 'Chrome', value: 320 },
    { name: 'Safari', value: 180 },
    { name: 'Firefox', value: 60 },
    { name: 'Edge', value: 40 },
  ]

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const totalScans = scansOverTime.reduce((sum, day) => sum + day.scans, 0)
  const avgScansPerDay = Math.round(totalScans / scansOverTime.length)
  const peakDay = scansOverTime.reduce((max, day) => (day.scans > max.scans ? day : max))

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
                Detailed Analytics
              </h1>
              <p className="text-gray-600">Comprehensive insights into your campaign performance</p>
            </div>

            <div className="flex gap-3">
              <Select
                options={[
                  { value: '7', label: 'Last 7 days' },
                  { value: '30', label: 'Last 30 days' },
                  { value: '90', label: 'Last 90 days' },
                ]}
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              />
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-responsive py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card padding="lg">
            <p className="text-sm text-gray-600 mb-1">Total Scans</p>
            <p className="text-3xl font-bold text-gray-900">{formatIndianNumber(totalScans)}</p>
            <p className="text-xs text-gray-500 mt-2">Last {timeRange} days</p>
          </Card>

          <Card padding="lg">
            <p className="text-sm text-gray-600 mb-1">Avg. Per Day</p>
            <p className="text-3xl font-bold text-gray-900">{avgScansPerDay}</p>
            <p className="text-xs text-success-600 mt-2">+12% vs prev period</p>
          </Card>

          <Card padding="lg">
            <p className="text-sm text-gray-600 mb-1">Peak Day</p>
            <p className="text-3xl font-bold text-gray-900">{peakDay.scans}</p>
            <p className="text-xs text-gray-500 mt-2">{peakDay.date}</p>
          </Card>

          <Card padding="lg">
            <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-gray-900">24%</p>
            <p className="text-xs text-gray-500 mt-2">Scans to actions</p>
          </Card>
        </div>

        {/* Scans Over Time */}
        <Card padding="lg" className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Scans Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scansOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="scans"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Device Breakdown */}
          <Card padding="lg">
            <h2 className="text-xl font-semibold mb-6">Device Breakdown</h2>
            <div className="flex items-center justify-center mb-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {deviceData.map((device, index) => (
                <div key={device.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{device.name}</span>
                  </div>
                  <span className="text-sm font-medium">{device.value} ({device.percentage}%)</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Browser Distribution */}
          <Card padding="lg">
            <h2 className="text-xl font-semibold mb-6">Browser Distribution</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={browserData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Location Data */}
        <Card padding="lg" className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Top Locations</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={locationData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis dataKey="city" type="category" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="scans" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Hourly Distribution */}
        <Card padding="lg">
          <h2 className="text-xl font-semibold mb-6">Scans by Hour of Day</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#6b7280" style={{ fontSize: '10px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="scans" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4 text-center">
            💡 Peak hours: 10 AM - 12 PM and 6 PM - 8 PM
          </p>
        </Card>
      </main>
    </div>
  )
}
