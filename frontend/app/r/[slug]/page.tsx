import { redirect } from 'next/navigation'

interface RedirectPageProps {
  params: {
    slug: string
  }
}

export default async function RedirectPage({ params }: RedirectPageProps) {
  const { slug } = params

  // In production, this would be handled by the backend API
  // Frontend would just display a loading state and let the backend redirect
  // For now, we'll show a simple page

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-primary-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold font-display text-gray-900 mb-2">
          Redirecting...
        </h1>
        <p className="text-gray-600 mb-6">
          Please wait while we redirect you to your destination.
        </p>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">
            QR Code: <span className="font-mono font-medium text-gray-900">{slug}</span>
          </p>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Powered by{' '}
          <a href="/" className="text-primary-600 hover:underline">
            QRConnect
          </a>
        </p>
      </div>
    </div>
  )
}

// Note: In production, the redirect logic would be:
// 1. User scans QR code → hits /r/[slug] route
// 2. Backend API (NestJS) handles the redirect
// 3. Records analytics (device, location, time)
// 4. Redirects to target URL based on campaign type
//
// This Next.js page is just a fallback/loading state
// The actual redirect would be handled server-side for speed
