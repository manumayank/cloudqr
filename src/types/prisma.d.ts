// Temporary type definitions until Prisma client is properly generated
// This file provides type stubs to allow the build to complete

declare module '@prisma/client' {
  export enum UserRole {
    ADMIN = 'ADMIN',
    BUSINESS_OWNER = 'BUSINESS_OWNER',
  }

  export enum BusinessCategory {
    ECOMMERCE = 'ECOMMERCE',
    RESTAURANT = 'RESTAURANT',
    OTHER = 'OTHER',
  }

  export enum CampaignStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
  }

  export enum CampaignUseCase {
    REVIEW = 'REVIEW',
    MENU = 'MENU',
    WHATSAPP = 'WHATSAPP',
    SOCIAL_MEDIA = 'SOCIAL_MEDIA',
    WEBSITE = 'WEBSITE',
    CUSTOM = 'CUSTOM',
  }

  export enum TargetMode {
    REDIRECT = 'REDIRECT',
    FORM = 'FORM',
  }

  export enum ProductType {
    BUSINESS_CARD = 'BUSINESS_CARD',
    STICKER_SMALL = 'STICKER_SMALL',
    STICKER_MEDIUM = 'STICKER_MEDIUM',
    STICKER_LARGE = 'STICKER_LARGE',
    CUSTOM = 'CUSTOM',
  }

  export enum DeviceType {
    MOBILE = 'MOBILE',
    DESKTOP = 'DESKTOP',
    TABLET = 'TABLET',
    UNKNOWN = 'UNKNOWN',
  }

  export namespace Prisma {
    export type FormWhereInput = any;
    export type FormSubmissionWhereInput = any;
  }

  export class PrismaClient {}
  export * from '@prisma/client';
}
