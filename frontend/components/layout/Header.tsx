'use client'

import Link from 'next/link'
import { useState } from 'react'
import Button from '@/components/ui/Button'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <nav className="container-responsive">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <span className="text-xl md:text-2xl font-bold font-display text-gray-900">
              QRConnect
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/#how-it-works"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="/#pricing"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/#templates"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Login
            </Link>
            <Button size="md" asChild>
              <Link href="/get-started">Get QR Cards</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-slide-down">
            <div className="flex flex-col gap-4">
              <Link
                href="/#how-it-works"
                className="text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </Link>
              <Link
                href="/#pricing"
                className="text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/#templates"
                className="text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Templates
              </Link>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Button size="md" fullWidth asChild>
                <Link href="/get-started">Get QR Cards</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
