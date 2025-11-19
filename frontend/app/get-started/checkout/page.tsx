'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Header from '@/components/layout/Header'
import { formatINR } from '@/lib/utils'

const quantities = [
  { value: '100', label: '100 Cards', price: 999, pricePerCard: 10 },
  { value: '250', label: '250 Cards', price: 1999, pricePerCard: 8 },
  { value: '500', label: '500 Cards', price: 3499, pricePerCard: 7 },
  { value: '1000', label: '1000 Cards', price: 5999, pricePerCard: 6 },
]

const productTypes = [
  { value: 'CARD', label: 'Business Cards (Standard)', description: '3.5" x 2" premium cardstock' },
  { value: 'STICKER', label: 'Stickers', description: '3" x 3" weather-resistant vinyl' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [onboardingData, setOnboardingData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [orderData, setOrderData] = useState({
    quantity: '250',
    productType: 'CARD',
    shippingAddress: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  })

  useEffect(() => {
    const data = sessionStorage.getItem('onboarding')
    if (data) {
      setOnboardingData(JSON.parse(data))
    } else {
      router.push('/get-started')
    }
  }, [router])

  const selectedQuantity = quantities.find(q => q.value === orderData.quantity)
  const totalAmount = selectedQuantity?.price || 0

  const handlePlaceOrder = async () => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken')

    if (!token) {
      // Save order data and redirect to login
      sessionStorage.setItem('pendingOrder', JSON.stringify({
        ...onboardingData,
        orderData,
      }))
      router.push('/login?redirect=/get-started/checkout')
      return
    }

    setLoading(true)

    try {
      // Create campaign and order
      // In a real implementation, this would call the API

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Clear session storage
      sessionStorage.removeItem('onboarding')
      sessionStorage.removeItem('pendingOrder')

      // Redirect to success page
      router.push('/get-started/success')
    } catch (error) {
      console.error('Order failed:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-12 md:py-16">
        <div className="container-tight">
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
              Choose Quantity & Checkout 📦
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select quantity and enter delivery details. Free shipping across India!
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Details - Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Type */}
              <Card padding="lg">
                <h2 className="text-xl font-semibold mb-4">Product Type</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {productTypes.map((type) => (
                    <div
                      key={type.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        orderData.productType === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setOrderData({ ...orderData, productType: type.value })}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                          orderData.productType === type.value
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300'
                        }`}>
                          {orderData.productType === type.value && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{type.label}</p>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quantity Selection */}
              <Card padding="lg">
                <h2 className="text-xl font-semibold mb-4">Select Quantity</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {quantities.map((qty) => (
                    <div
                      key={qty.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        orderData.quantity === qty.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setOrderData({ ...orderData, quantity: qty.value })}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-lg">{qty.label}</p>
                        {qty.value === '250' && (
                          <span className="text-xs bg-secondary-400 text-white px-2 py-1 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{formatINR(qty.price)}</p>
                      <p className="text-sm text-gray-600">₹{qty.pricePerCard}/card</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Shipping Address */}
              <Card padding="lg">
                <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
                <div className="space-y-4">
                  <Textarea
                    label="Street Address"
                    value={orderData.shippingAddress}
                    onChange={(e) => setOrderData({ ...orderData, shippingAddress: e.target.value })}
                    placeholder="Building name, street, area"
                    fullWidth
                    required
                    rows={3}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="City"
                      value={orderData.city}
                      onChange={(e) => setOrderData({ ...orderData, city: e.target.value })}
                      placeholder="Mumbai"
                      fullWidth
                      required
                    />
                    <Input
                      label="State"
                      value={orderData.state}
                      onChange={(e) => setOrderData({ ...orderData, state: e.target.value })}
                      placeholder="Maharashtra"
                      fullWidth
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="PIN Code"
                      value={orderData.pincode}
                      onChange={(e) => setOrderData({ ...orderData, pincode: e.target.value })}
                      placeholder="400001"
                      fullWidth
                      required
                      maxLength={6}
                    />
                    <Input
                      label="Phone Number"
                      value={orderData.phone}
                      onChange={(e) => setOrderData({ ...orderData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      fullWidth
                      required
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Order Summary - Right */}
            <div className="lg:sticky lg:top-8 h-fit">
              <Card padding="lg">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Product</span>
                    <span className="font-medium">
                      {productTypes.find(p => p.value === orderData.productType)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity</span>
                    <span className="font-medium">{orderData.quantity} cards</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatINR(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-success-600">FREE</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary-600">{formatINR(totalAmount)}</span>
                </div>

                <Button
                  size="lg"
                  fullWidth
                  onClick={handlePlaceOrder}
                  loading={loading}
                  disabled={!orderData.shippingAddress || !orderData.city || !orderData.state || !orderData.pincode || !orderData.phone}
                >
                  Place Order & Pay
                </Button>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-success-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Premium quality print with HP Indigo</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-success-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Delivery in 3-5 business days</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-success-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Update QR destination anytime, free forever</span>
                  </div>
                </div>
              </Card>

              <div className="mt-4 p-4 bg-primary-50 rounded-lg">
                <p className="text-xs text-primary-700 text-center">
                  🔒 Secure payment with Razorpay. We accept UPI, Cards, Net Banking, and Wallets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
