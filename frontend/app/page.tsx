import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-16 md:py-24">
          <div className="container-responsive">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text Content */}
              <div className="space-y-6 md:space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                  </span>
                  Trusted by 1000+ businesses across India
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-gray-900 leading-tight">
                  Get More Reviews & Customers with{' '}
                  <span className="text-primary-600">Smart QR Cards</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  Perfect for Amazon/Flipkart sellers and restaurant owners. Order custom QR cards, collect reviews, grow your WhatsApp list, and get repeat customers — all from one simple platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild>
                    <Link href="/get-started">
                      Get QR Cards Now
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
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#how-it-works">See How It Works</Link>
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>High Quality Print</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Change QR Anytime</span>
                  </div>
                </div>
              </div>

              {/* Right: Visual/Demo */}
              <div className="relative">
                <div className="relative z-10 bg-white rounded-2xl shadow-strong p-8">
                  <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center">
                    <svg className="w-48 h-48 text-gray-800" viewBox="0 0 100 100">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="10" height="10" fill="black" />
                      <rect x="20" y="10" width="10" height="10" fill="black" />
                      <rect x="30" y="10" width="10" height="10" fill="black" />
                      <rect x="40" y="10" width="10" height="10" fill="black" />
                      <rect x="50" y="10" width="10" height="10" fill="black" />
                      <rect x="60" y="10" width="10" height="10" fill="black" />
                      <rect x="70" y="10" width="10" height="10" fill="black" />
                      {/* Simplified QR code pattern */}
                      <rect x="10" y="20" width="10" height="10" fill="black" />
                      <rect x="70" y="20" width="10" height="10" fill="black" />
                      <rect x="10" y="70" width="10" height="10" fill="black" />
                    </svg>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-sm font-medium text-gray-600">Scan to see magic ✨</p>
                    <p className="text-xs text-gray-500 mt-1">Dynamic QR - Update destination anytime</p>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary-200 rounded-full opacity-50 blur-2xl"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary-200 rounded-full opacity-50 blur-2xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-24 bg-white">
          <div className="container-responsive">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900 mb-4">
                Simple Process, Big Results
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get your custom QR cards in 3 easy steps. No technical knowledge needed.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <Card padding="lg" className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Choose & Design</h3>
                <p className="text-gray-600">
                  Pick your use case (reviews, WhatsApp, feedback), select a card template, upload your logo, and customize the design.
                </p>
              </Card>

              {/* Step 2 */}
              <Card padding="lg" className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">Order & Pay</h3>
                <p className="text-gray-600">
                  Choose quantity (100/250/500/1000), enter delivery address, and pay securely online. Cards printed on premium quality material.
                </p>
              </Card>

              {/* Step 3 */}
              <Card padding="lg" className="text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Distribute & Track</h3>
                <p className="text-gray-600">
                  Receive cards at your doorstep. Share with customers. Track scans, view analytics, and update QR destination anytime from your dashboard.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container-responsive">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900 mb-4">
                Perfect For Your Business
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Whether you sell online or run a restaurant, QRConnect helps you connect with customers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card padding="lg" hover className="text-center">
                <div className="text-4xl mb-4">⭐</div>
                <h3 className="text-lg font-semibold mb-2">Get More Reviews</h3>
                <p className="text-sm text-gray-600">
                  Direct link to Google, Amazon, or Zomato reviews. Boost your ratings effortlessly.
                </p>
              </Card>

              <Card padding="lg" hover className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">Grow WhatsApp List</h3>
                <p className="text-sm text-gray-600">
                  One scan joins your WhatsApp channel. Send offers, updates, and build loyalty.
                </p>
              </Card>

              <Card padding="lg" hover className="text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-semibold mb-2">Collect Feedback</h3>
                <p className="text-sm text-gray-600">
                  Custom forms to gather ratings, contact info, and valuable customer insights.
                </p>
              </Card>

              <Card padding="lg" hover className="text-center">
                <div className="text-4xl mb-4">🎁</div>
                <h3 className="text-lg font-semibold mb-2">Share Offers</h3>
                <p className="text-sm text-gray-600">
                  Link to special deals, coupons, or your website. Update the link anytime.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-white">
          <div className="container-responsive">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                High-quality cards with free shipping. No hidden fees.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <Card padding="lg" hover className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">₹999</div>
                <div className="text-gray-600 mb-4">100 Cards</div>
                <div className="text-sm text-gray-500">₹10/card</div>
              </Card>

              <Card padding="lg" hover className="text-center border-2 border-primary-500">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs px-3 py-1 rounded-full">
                  Popular
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">₹1,999</div>
                <div className="text-gray-600 mb-4">250 Cards</div>
                <div className="text-sm text-gray-500">₹8/card</div>
              </Card>

              <Card padding="lg" hover className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">₹3,499</div>
                <div className="text-gray-600 mb-4">500 Cards</div>
                <div className="text-sm text-gray-500">₹7/card</div>
              </Card>

              <Card padding="lg" hover className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">₹5,999</div>
                <div className="text-gray-600 mb-4">1000 Cards</div>
                <div className="text-sm text-gray-500">₹6/card</div>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-gray-600 mb-6">
                All plans include: Premium print quality • Free shipping • Dashboard access • Unlimited QR updates • Analytics
              </p>
              <Button size="lg" asChild>
                <Link href="/get-started">Order Your Cards Now</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="container-responsive text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-6">
              Ready to Grow Your Business?
            </h2>
            <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join 1000+ businesses using QRConnect to get more reviews, customers, and sales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/get-started">
                  Get Started Now
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
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary-600"
                asChild
              >
                <Link href="/contact">Talk to Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
