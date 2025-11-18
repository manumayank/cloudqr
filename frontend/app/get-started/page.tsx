'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Header from '@/components/layout/Header'
import type { Persona, UseCase } from '@/types'

const personas = [
  {
    id: 'ECOMMERCE' as Persona,
    title: 'I Sell on Amazon/Flipkart',
    description: 'Perfect for ecommerce sellers who want more reviews and repeat customers',
    icon: '🛒',
    useCases: ['REVIEWS', 'WHATSAPP', 'FEEDBACK', 'CUSTOM_LINK'] as UseCase[],
  },
  {
    id: 'RESTAURANT' as Persona,
    title: 'I Run a Restaurant',
    description: 'Great for restaurants on Zomato/Swiggy who want better ratings and direct orders',
    icon: '🍽️',
    useCases: ['REVIEWS', 'FEEDBACK', 'WHATSAPP', 'CUSTOM_LINK'] as UseCase[],
  },
]

const useCaseOptions = {
  REVIEWS: {
    id: 'REVIEWS' as UseCase,
    title: 'Get More Reviews',
    description: 'Direct customers to Google Reviews, Amazon, or Zomato to boost your ratings',
    icon: '⭐',
    campaignType: 'GOOGLE_REVIEW' as const,
  },
  FEEDBACK: {
    id: 'FEEDBACK' as UseCase,
    title: 'Collect Feedback',
    description: 'Create custom forms to gather ratings, contact info, and valuable insights',
    icon: '📝',
    campaignType: 'FEEDBACK_FORM' as const,
  },
  WHATSAPP: {
    id: 'WHATSAPP' as UseCase,
    title: 'Grow WhatsApp List',
    description: 'One scan to join your WhatsApp. Send offers, updates, and build loyalty',
    icon: '💬',
    campaignType: 'WHATSAPP' as const,
  },
  CUSTOM_LINK: {
    id: 'CUSTOM_LINK' as UseCase,
    title: 'Custom Link',
    description: 'Link to your website, special offer, or any URL you want',
    icon: '🔗',
    campaignType: 'LINK' as const,
  },
}

export default function GetStartedPage() {
  const router = useRouter()
  const [step, setStep] = useState<'persona' | 'usecase'>('persona')
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null)

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona)
    setStep('usecase')
  }

  const handleUseCaseSelect = (useCase: UseCase) => {
    setSelectedUseCase(useCase)
    // Store in sessionStorage for next step
    sessionStorage.setItem('onboarding', JSON.stringify({
      persona: selectedPersona,
      useCase,
      campaignType: useCaseOptions[useCase].campaignType,
    }))
    // Navigate to template selection
    router.push('/get-started/templates')
  }

  const availableUseCases = selectedPersona
    ? personas.find(p => p.id === selectedPersona)?.useCases || []
    : []

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="container-tight">
          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'persona' ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-600'
                }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Who are you?</span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300" />
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'usecase' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">What's your goal?</span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300" />
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-gray-400">Design</span>
              </div>
            </div>
          </div>

          {/* Step 1: Persona Selection */}
          {step === 'persona' && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-bold font-display text-gray-900 mb-3">
                  Let's get started! 👋
                </h1>
                <p className="text-lg text-gray-600">
                  Tell us about your business so we can customize your experience.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {personas.map((persona) => (
                  <Card
                    key={persona.id}
                    padding="lg"
                    hover
                    className={`cursor-pointer transition-all ${
                      selectedPersona === persona.id ? 'border-2 border-primary-500 shadow-medium' : ''
                    }`}
                    onClick={() => handlePersonaSelect(persona.id)}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-4">{persona.icon}</div>
                      <h3 className="text-xl font-semibold mb-2">{persona.title}</h3>
                      <p className="text-gray-600 text-sm">{persona.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Use Case Selection */}
          {step === 'usecase' && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <button
                  onClick={() => {
                    setStep('persona')
                    setSelectedPersona(null)
                  }}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <h1 className="text-3xl md:text-4xl font-bold font-display text-gray-900 mb-3">
                  What would you like to achieve? 🎯
                </h1>
                <p className="text-lg text-gray-600">
                  Choose your main goal. You can create more campaigns later!
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {availableUseCases.map((useCaseId) => {
                  const useCase = useCaseOptions[useCaseId]
                  return (
                    <Card
                      key={useCase.id}
                      padding="lg"
                      hover
                      className={`cursor-pointer transition-all ${
                        selectedUseCase === useCase.id ? 'border-2 border-primary-500 shadow-medium' : ''
                      }`}
                      onClick={() => handleUseCaseSelect(useCase.id)}
                    >
                      <div className="text-center">
                        <div className="text-5xl mb-4">{useCase.icon}</div>
                        <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                        <p className="text-gray-600 text-sm">{useCase.description}</p>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
