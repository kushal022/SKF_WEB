/**
 * WhatsApp Integration Utilities
 * Handles phone normalization and pre-filled message encoding for lead conversion.
 */

export interface WhatsAppUrlParams {
  phone?: string | null;
  message?: string;
}

export const DEFAULT_WHATSAPP_PHONE = '919876543210';

/**
 * Normalizes phone number into international format for WhatsApp wa.me links
 * e.g., "+91 98765 43210" -> "919876543210"
 */
export function normalizePhone(rawPhone?: string | null): string {
  if (!rawPhone) return DEFAULT_WHATSAPP_PHONE;
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits || DEFAULT_WHATSAPP_PHONE;
}

/**
 * Builds a standardized wa.me URL
 */
export function buildWhatsAppUrl({ phone, message = '' }: WhatsAppUrlParams): string {
  const cleanPhone = normalizePhone(phone);
  const encodedMessage = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

/**
 * Formats product-specific inquiry message
 */
export function buildProductEnquiryMessage(productName: string, productCode: string, siteName = 'SKF Furniture'): string {
  return [
    `Hello ${siteName},`,
    `I am interested in:`,
    `Product: ${productName}`,
    `Product Code: ${productCode}`,
    `Please share pricing, availability, and customization details.`,
  ].join('\n');
}

/**
 * Formats general catalog inquiry message
 */
export function buildGeneralEnquiryMessage(siteName = 'SKF Furniture'): string {
  return [
    `Hello ${siteName},`,
    `I would like to enquire about your stainless steel furniture catalog and pricing.`,
  ].join('\n');
}

/**
 * Formats custom fabrication inquiry message
 */
export function buildCustomEnquiryMessage(siteName = 'SKF Furniture'): string {
  return [
    `Hello ${siteName},`,
    `I am interested in a custom stainless steel furniture requirement.`,
    `Please connect me with your design and estimation team.`,
  ].join('\n');
}
