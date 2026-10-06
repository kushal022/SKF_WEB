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

/**
 * Formats custom furniture request WhatsApp message with specifications
 */
export function buildCustomRequestMessage(
  data: {
    product_type: string;
    dimensions?: string;
    material?: string;
    finish?: string;
    quantity?: number;
    city?: string;
  },
  siteName = 'SKF Furniture'
): string {
  const lines = [
    `Hello ${siteName},`,
    `I have submitted a Custom Furniture Requirement on your website:`,
    `• Product: ${data.product_type}`,
  ];
  if (data.dimensions) lines.push(`• Dimensions: ${data.dimensions}`);
  if (data.material) lines.push(`• Material: ${data.material}`);
  if (data.finish) lines.push(`• Finish: ${data.finish}`);
  if (data.quantity) lines.push(`• Quantity: ${data.quantity}`);
  if (data.city) lines.push(`• City/Location: ${data.city}`);
  lines.push(`Please review and connect with me for technical discussion.`);
  return lines.join('\n');
}

/**
 * Formats price estimator WhatsApp message
 */
export function buildEstimatorWhatsAppMessage(
  data: {
    product_type?: string;
    dimensions?: string;
    material?: string;
    finish?: string;
    quantity?: number;
    total_estimate?: number;
  },
  siteName = 'SKF Furniture'
): string {
  const lines = [
    `Hello ${siteName},`,
    `I generated an instant price estimate on your website:`,
  ];
  if (data.product_type) lines.push(`• Item: ${data.product_type}`);
  if (data.dimensions) lines.push(`• Dimensions: ${data.dimensions}`);
  if (data.material) lines.push(`• Grade: ${data.material}`);
  if (data.finish) lines.push(`• Finish: ${data.finish}`);
  if (data.quantity) lines.push(`• Quantity: ${data.quantity}`);
  if (data.total_estimate) lines.push(`• Estimated Total: ₹${data.total_estimate.toLocaleString('en-IN')}`);
  lines.push(`I would like to get an official commercial quotation.`);
  return lines.join('\n');
}

/**
 * Formats quotation share message
 */
export function buildQuotationShareMessage(
  quotation: {
    quotation_number: string;
    customer_name: string;
    total_amount: number;
    valid_until?: string | null;
  },
  siteName = 'SKF Furniture'
): string {
  return [
    `*Official Commercial Proposal from ${siteName}*`,
    `Quotation No: ${quotation.quotation_number}`,
    `Customer: ${quotation.customer_name}`,
    `Total Amount: ₹${quotation.total_amount.toLocaleString('en-IN')}`,
    quotation.valid_until ? `Valid Until: ${quotation.valid_until}` : '',
    `Please review this proposal online or reply here.`,
  ]
    .filter(Boolean)
    .join('\n');
}

