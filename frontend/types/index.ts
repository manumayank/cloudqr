// User & Business Types
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'BUSINESS_OWNER' | 'ADMIN'
  createdAt: string
  business?: Business
}

export interface Business {
  id: string
  name: string
  phone: string
  email: string
  logoUrl?: string
  brandColor?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  createdAt: string
}

// Campaign Types
export type CampaignType = 'LINK' | 'WHATSAPP' | 'GOOGLE_REVIEW' | 'FEEDBACK_FORM' | 'VCARD'

export interface Campaign {
  id: string
  businessId: string
  name: string
  type: CampaignType
  slug: string
  isActive: boolean
  targetUrl?: string
  whatsappNumber?: string
  googlePlaceId?: string
  formId?: string
  createdAt: string
  updatedAt: string
  _count?: {
    scans: number
  }
}

// Analytics Types
export interface ScanAnalytics {
  id: string
  campaignId: string
  scannedAt: string
  deviceType?: string
  browser?: string
  os?: string
  country?: string
  city?: string
  userAgent?: string
}

export interface AnalyticsSummary {
  totalScans: number
  scansToday: number
  scansThisWeek: number
  scansThisMonth: number
  topDeviceTypes: { deviceType: string; count: number }[]
  topLocations: { city: string; count: number }[]
  scansByDay: { date: string; count: number }[]
}

// Order Types
export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type ProductType = 'CARD' | 'STICKER'

export interface Order {
  id: string
  businessId: string
  campaignId: string
  orderNumber: string
  status: OrderStatus
  productType: ProductType
  quantity: number
  unitPrice: number
  totalAmount: number
  designData: any
  shippingAddress: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
}

// Form Types
export interface Form {
  id: string
  businessId: string
  name: string
  fields: FormField[]
  createdAt: string
}

export interface FormField {
  id: string
  type: 'TEXT' | 'EMAIL' | 'PHONE' | 'RATING' | 'TEXTAREA'
  label: string
  required: boolean
  order: number
}

export interface FormSubmission {
  id: string
  formId: string
  campaignId: string
  data: Record<string, any>
  submittedAt: string
}

// Template & Design Types
export interface Template {
  id: string
  name: string
  category: 'ECOMMERCE' | 'RESTAURANT' | 'RETAIL' | 'SERVICE'
  previewUrl: string
  designData: any
}

export interface DesignData {
  templateId: string
  logoUrl?: string
  brandColor?: string
  headline: string
  subtext: string
  qrSize: number
  qrPosition: 'center' | 'top' | 'bottom'
}

// Persona & Use Case Types
export type Persona = 'ECOMMERCE' | 'RESTAURANT'

export type UseCase = 'REVIEWS' | 'FEEDBACK' | 'WHATSAPP' | 'CUSTOM_LINK'

export interface PersonaOption {
  id: Persona
  title: string
  description: string
  icon: string
  useCases: UseCase[]
}

export interface UseCaseOption {
  id: UseCase
  title: string
  description: string
  icon: string
  campaignType: CampaignType
}
