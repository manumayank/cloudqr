import type { Metadata } from 'next'
import './globals.css'

// Use system fonts as fallback to avoid Google Fonts loading issues in testing
const inter = {
  variable: '--font-inter',
}

const poppins = {
  variable: '--font-poppins',
}

export const metadata: Metadata = {
  title: 'QRConnect - Grow Your Business with Smart QR Codes',
  description: 'Order custom QR cards & stickers for your business. Get more reviews, WhatsApp subscribers, and repeat customers. Perfect for ecommerce sellers and restaurants in India.',
  keywords: 'QR code, business cards, reviews, WhatsApp marketing, ecommerce, restaurant, India',
  authors: [{ name: 'QRConnect' }],
  openGraph: {
    title: 'QRConnect - Grow Your Business with Smart QR Codes',
    description: 'Order custom QR cards & stickers for your business.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
