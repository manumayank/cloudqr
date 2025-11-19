'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Header from '@/components/layout/Header'

interface DesignData {
  templateId: string
  logoUrl: string
  brandColor: string
  headline: string
  subtext: string
  businessName: string
}

export default function EditorPage() {
  const router = useRouter()
  const [onboardingData, setOnboardingData] = useState<any>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [designData, setDesignData] = useState<DesignData>({
    templateId: '',
    logoUrl: '',
    brandColor: '#6366f1',
    headline: '',
    subtext: '',
    businessName: '',
  })

  useEffect(() => {
    const data = sessionStorage.getItem('onboarding')
    if (data) {
      const parsed = JSON.parse(data)
      setOnboardingData(parsed)
      setDesignData((prev) => ({
        ...prev,
        templateId: parsed.templateId || '',
        headline: getDefaultHeadline(parsed.useCase),
        subtext: getDefaultSubtext(parsed.useCase),
      }))
    } else {
      router.push('/get-started')
    }
  }, [router])

  const getDefaultHeadline = (useCase: string): string => {
    const headlines: Record<string, string> = {
      REVIEWS: 'Love Our Product? Leave a Review! ⭐',
      WHATSAPP: 'Join Our WhatsApp for Exclusive Offers! 💬',
      FEEDBACK: 'We Value Your Feedback! 📝',
      CUSTOM_LINK: 'Scan to Learn More! 🔗',
    }
    return headlines[useCase] || 'Scan Me!'
  }

  const getDefaultSubtext = (useCase: string): string => {
    const subtexts: Record<string, string> = {
      REVIEWS: 'Your review helps us serve you better',
      WHATSAPP: 'Get instant updates on new products & deals',
      FEEDBACK: 'Share your thoughts in 30 seconds',
      CUSTOM_LINK: 'Discover more about our business',
    }
    return subtexts[useCase] || 'Thank you!'
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
        setDesignData((prev) => ({ ...prev, logoUrl: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleContinue = () => {
    // Save design data
    const updatedData = {
      ...onboardingData,
      designData,
    }
    sessionStorage.setItem('onboarding', JSON.stringify(updatedData))

    // Navigate to quantity/checkout
    router.push('/get-started/checkout')
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
              Design Your QR Card ✨
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Customize your card with your logo, colors, and message. See live preview on the right.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Editor Panel - Left */}
            <div className="space-y-6">
              <Card padding="lg">
                <h2 className="text-xl font-semibold mb-6">Card Details</h2>

                <div className="space-y-5">
                  {/* Business Name */}
                  <Input
                    label="Business Name"
                    value={designData.businessName}
                    onChange={(e) => setDesignData({ ...designData, businessName: e.target.value })}
                    placeholder="Your Business Name"
                    fullWidth
                    required
                    helperText="This will appear on your QR card"
                  />

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Logo
                    </label>
                    <div className="flex items-start gap-4">
                      {logoPreview && (
                        <div className="w-20 h-20 rounded-lg border-2 border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload">
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
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          PNG or JPG, max 2MB. Square format works best.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Brand Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={designData.brandColor}
                        onChange={(e) => setDesignData({ ...designData, brandColor: e.target.value })}
                        className="h-10 w-20 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={designData.brandColor}
                        onChange={(e) => setDesignData({ ...designData, brandColor: e.target.value })}
                        placeholder="#6366f1"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This color will be used for accents on your card
                    </p>
                  </div>

                  {/* Headline */}
                  <Input
                    label="Headline"
                    value={designData.headline}
                    onChange={(e) => setDesignData({ ...designData, headline: e.target.value })}
                    placeholder="Love our product? Leave a review!"
                    fullWidth
                    required
                    helperText="Main message on your card (max 60 characters)"
                    maxLength={60}
                  />

                  {/* Subtext */}
                  <Textarea
                    label="Subtext (Optional)"
                    value={designData.subtext}
                    onChange={(e) => setDesignData({ ...designData, subtext: e.target.value })}
                    placeholder="Your feedback helps us improve"
                    fullWidth
                    rows={2}
                    helperText="Supporting text below headline (max 100 characters)"
                    maxLength={100}
                  />
                </div>
              </Card>

              {/* Continue Button */}
              <Button
                size="lg"
                fullWidth
                onClick={handleContinue}
                disabled={!designData.businessName || !designData.headline}
              >
                Continue to Quantity & Checkout
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

            {/* Live Preview - Right */}
            <div className="lg:sticky lg:top-8 h-fit">
              <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Live Preview</h2>
                  <span className="text-sm text-gray-500">Front Side</span>
                </div>

                {/* Card Preview */}
                <div className="aspect-[3/4] bg-white rounded-xl shadow-strong p-8 flex flex-col items-center justify-center border-2 border-gray-200">
                  {/* Logo */}
                  {logoPreview ? (
                    <div className="w-24 h-24 mb-6 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 mb-6 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  {/* Business Name */}
                  {designData.businessName && (
                    <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
                      {designData.businessName}
                    </h3>
                  )}

                  {/* QR Code */}
                  <div className="w-48 h-48 bg-white border-4 rounded-lg mb-6" style={{ borderColor: designData.brandColor }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect width="100" height="100" fill="white" />
                      {/* Simplified QR pattern */}
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
                      <rect x="10" y="30" width="10" height="10" fill="black" />
                      <rect x="80" y="30" width="10" height="10" fill="black" />
                      <rect x="10" y="80" width="10" height="10" fill="black" />
                      <rect x="20" y="80" width="10" height="10" fill="black" />
                      <rect x="30" y="80" width="10" height="10" fill="black" />
                    </svg>
                  </div>

                  {/* Headline */}
                  <p className="text-center font-semibold text-gray-900 mb-2 px-4" style={{ color: designData.brandColor }}>
                    {designData.headline || 'Your headline will appear here'}
                  </p>

                  {/* Subtext */}
                  {designData.subtext && (
                    <p className="text-center text-sm text-gray-600 px-4">
                      {designData.subtext}
                    </p>
                  )}
                </div>

                <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                  <p className="text-xs text-primary-700 text-center">
                    💡 Tip: Keep your message clear and simple. Customers scan QR codes quickly!
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
