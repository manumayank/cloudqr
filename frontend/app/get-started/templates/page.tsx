'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Header from '@/components/layout/Header'

const templates = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'ECOMMERCE',
    previewUrl: '/templates/modern-minimal.jpg',
    description: 'Clean and professional design perfect for any business',
  },
  {
    id: 'vibrant-gradient',
    name: 'Vibrant Gradient',
    category: 'RESTAURANT',
    previewUrl: '/templates/vibrant-gradient.jpg',
    description: 'Eye-catching colors that grab attention',
  },
  {
    id: 'classic-elegance',
    name: 'Classic Elegance',
    category: 'ECOMMERCE',
    previewUrl: '/templates/classic-elegance.jpg',
    description: 'Timeless design with sophisticated look',
  },
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    category: 'RESTAURANT',
    previewUrl: '/templates/bold-impact.jpg',
    description: 'Strong visual presence with bold typography',
  },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [onboardingData, setOnboardingData] = useState<any>(null)

  useEffect(() => {
    // Load onboarding data from sessionStorage
    const data = sessionStorage.getItem('onboarding')
    if (data) {
      setOnboardingData(JSON.parse(data))
    } else {
      // Redirect back if no data
      router.push('/get-started')
    }
  }, [router])

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
  }

  const handleContinue = () => {
    if (!selectedTemplate) return

    // Save template selection
    const updatedData = {
      ...onboardingData,
      templateId: selectedTemplate,
    }
    sessionStorage.setItem('onboarding', JSON.stringify(updatedData))

    // Navigate to editor
    router.push('/get-started/editor')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="container-responsive">
          {/* Header */}
          <div className="text-center mb-10">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-gray-900 mb-3">
              Choose Your Card Design 🎨
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Pick a template that matches your brand. You'll customize it in the next step.
            </p>
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {templates.map((template) => (
              <Card
                key={template.id}
                padding="none"
                hover
                className={`cursor-pointer transition-all overflow-hidden ${
                  selectedTemplate === template.id ? 'border-2 border-primary-500 shadow-medium' : ''
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                {/* Template Preview */}
                <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="w-24 h-24 bg-white rounded-lg shadow-medium mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-16 h-16" viewBox="0 0 100 100">
                          <rect width="100" height="100" fill="black" />
                          <rect x="10" y="10" width="80" height="80" fill="white" />
                          <rect x="20" y="20" width="20" height="20" fill="black" />
                          <rect x="60" y="20" width="20" height="20" fill="black" />
                          <rect x="20" y="60" width="20" height="20" fill="black" />
                        </svg>
                      </div>
                      <div className="text-xs font-medium text-gray-700">{template.name}</div>
                    </div>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Continue Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedTemplate}
            >
              Continue to Design
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
