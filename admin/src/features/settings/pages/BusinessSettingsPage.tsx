import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Share2,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Globe,
} from 'lucide-react';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from '../../../app/store/api';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  LoadingState,
  useToast,
  ImageUpload,
} from '../../../components/ui';
import type { WebsiteSettings, UpdateWebsiteSettingsPayload } from '../../../types/settings';

interface SettingsFormProps {
  initialSettings?: WebsiteSettings;
  onSave: (payload: UpdateWebsiteSettingsPayload) => Promise<void>;
  isSaving: boolean;
}

function BusinessSettingsForm({
  initialSettings,
  onSave,
  isSaving,
}: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'identity' | 'contact' | 'address' | 'social' | 'quotation'>('identity');

  // Form State
  const [siteName, setSiteName] = useState(initialSettings?.site_name || 'SKF Stainless Steel Furniture');
  const [tagline, setTagline] = useState(initialSettings?.tagline || '');
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logo_url || '');
  const [faviconUrl, setFaviconUrl] = useState(initialSettings?.favicon_url || '');

  // Contact
  const [phone, setPhone] = useState(initialSettings?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings?.whatsapp_number || '');
  const [email, setEmail] = useState(initialSettings?.email || '');

  // Address & Hours
  const [address, setAddress] = useState(initialSettings?.address || '');
  const [businessHours, setBusinessHours] = useState<string>(
    typeof initialSettings?.business_hours === 'string'
      ? initialSettings.business_hours
      : (initialSettings?.business_hours as Record<string, string>)?.schedule || 'Mon – Sat: 9:00 AM – 7:30 PM (Sunday Closed)'
  );

  // Social Links
  const existingSocial = (initialSettings?.social_links as Record<string, string>) || {};
  const [instagram, setInstagram] = useState(existingSocial.instagram || '');
  const [facebook, setFacebook] = useState(existingSocial.facebook || '');
  const [linkedin, setLinkedin] = useState(existingSocial.linkedin || '');
  const [youtube, setYoutube] = useState(existingSocial.youtube || '');

  // SEO & Terms
  const existingSeo = (initialSettings?.seo_defaults as Record<string, string>) || {};
  const [metaTitle, setMetaTitle] = useState(existingSeo.title || 'SKF Stainless Steel Furniture | Architectural Fabrication');
  const [metaDescription, setMetaDescription] = useState(
    existingSeo.description || 'Premium architectural stainless steel furniture, bespoke modular kitchens, and custom fabrication in India.'
  );

  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) {
      setFormError('Business name cannot be empty.');
      return;
    }

    try {
      setFormError(null);
      const payload: UpdateWebsiteSettingsPayload = {
        site_name: siteName.trim(),
        tagline: tagline.trim() || null,
        logo_url: logoUrl.trim() || null,
        favicon_url: faviconUrl.trim() || null,
        phone: phone.trim() || null,
        whatsapp_number: whatsappNumber.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        business_hours: {
          schedule: businessHours.trim(),
        },
        social_links: {
          instagram: instagram.trim(),
          facebook: facebook.trim(),
          linkedin: linkedin.trim(),
          youtube: youtube.trim(),
        },
        seo_defaults: {
          title: metaTitle.trim(),
          description: metaDescription.trim(),
        },
      };

      await onSave(payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update business settings.';
      setFormError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'identity'
              ? 'bg-[var(--brand-accent)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Business Identity
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'contact'
              ? 'bg-[var(--brand-accent)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          Contact Information
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('address')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'address'
              ? 'bg-[var(--brand-accent)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Address &amp; Hours
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'social'
              ? 'bg-[var(--brand-accent)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          Social &amp; Web
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quotation')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'quotation'
              ? 'bg-[var(--brand-accent)] text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Quotation Integration
        </button>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-[var(--status-error)]/10 border border-[var(--status-error)]/30 text-xs text-[var(--status-error)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Tab: Business Identity */}
      {activeTab === 'identity' && (
        <Card className="shadow-xs border border-[var(--border-border)]">
          <CardHeader className="pb-4 border-b border-[var(--border-border)]">
            <CardTitle className="text-base font-semibold">Business Identity &amp; Branding</CardTitle>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Defines the official company name, promotional tagline, and branding assets displayed across Quotation PDFs, public client approvals, and the client website.
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Official Business Name *
              </label>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g. SKF Stainless Steel Furniture"
                required
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Company Tagline &amp; Craftsmanship Descriptor
              </label>
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Architectural Stainless Steel Works • SS 304 / 316 Custom Fabrication"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-5">
              <ImageUpload
                label="Business Logo"
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
                onRemove={() => setLogoUrl('')}
                folder="branding"
                disabled={isSaving}
                helperText="Upload transparent PNG, SVG, or WEBP logo (minimum 300x80px)"
              />

              <ImageUpload
                label="Favicon"
                value={faviconUrl}
                onChange={(url) => setFaviconUrl(url)}
                onRemove={() => setFaviconUrl('')}
                folder="branding"
                aspectRatio="square"
                disabled={isSaving}
                helperText="Upload square favicon icon (16x16, 32x32, or 64x64 PNG or ICO)"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Contact */}
      {activeTab === 'contact' && (
        <Card className="shadow-xs border border-[var(--border-border)]">
          <CardHeader className="pb-4 border-b border-[var(--border-border)]">
            <CardTitle className="text-base font-semibold">Direct Communication Channels</CardTitle>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Contact numbers and email addresses used for customer communications, WhatsApp quotation sharing, and invoice footers.
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Primary Customer Service Phone
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91-9876543210"
                  leftIcon={<Phone className="w-4 h-4 text-[var(--text-secondary)]" />}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  WhatsApp Support / Direct Quote Number
                </label>
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +91-9876543210"
                  leftIcon={<Share2 className="w-4 h-4 text-emerald-600" />}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Official Commercial Sales Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@skffurniture.com"
                leftIcon={<Mail className="w-4 h-4 text-[var(--text-secondary)]" />}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Address & Hours */}
      {activeTab === 'address' && (
        <Card className="shadow-xs border border-[var(--border-border)]">
          <CardHeader className="pb-4 border-b border-[var(--border-border)]">
            <CardTitle className="text-base font-semibold">Workshop, Factory &amp; Hours</CardTitle>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Physical fabrication facility address shown on quotations, commercial invoices, and customer pickup documents.
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Registered Factory &amp; Facility Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="Plot No. 42, Steel Fabricators Industrial Estate, Mumbai & Pune Expressway, Maharashtra 410206"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] resize-y"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Operational Business Hours &amp; Customer Visit Timing
              </label>
              <Input
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="Mon – Sat: 9:00 AM – 7:30 PM (Sunday Closed)"
                leftIcon={<Clock className="w-4 h-4 text-[var(--text-secondary)]" />}
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Social & Web */}
      {activeTab === 'social' && (
        <Card className="shadow-xs border border-[var(--border-border)]">
          <CardHeader className="pb-4 border-b border-[var(--border-border)]">
            <CardTitle className="text-base font-semibold">Social Media &amp; Web Presence</CardTitle>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Profiles linked in digital quotation summaries, client footer, and promotional catalogs.
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Instagram Portfolio URL
                </label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/skf_furniture"
                  leftIcon={<Globe className="w-4 h-4 text-pink-600" />}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Facebook Page URL
                </label>
                <Input
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/skffurniture"
                  leftIcon={<Globe className="w-4 h-4 text-blue-600" />}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  LinkedIn Trade Profile
                </label>
                <Input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/company/skf-furniture"
                  leftIcon={<Share2 className="w-4 h-4 text-blue-700" />}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  YouTube Demonstration Channel
                </label>
                <Input
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="https://youtube.com/@skffurniture"
                  leftIcon={<Globe className="w-4 h-4 text-red-600" />}
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Quotation Integration */}
      {activeTab === 'quotation' && (
        <Card className="shadow-xs border border-[var(--border-border)]">
          <CardHeader className="pb-4 border-b border-[var(--border-border)]">
            <CardTitle className="text-base font-semibold">Quotation &amp; PDF Integration Defaults</CardTitle>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Review how these business settings automatically populate commercial quotations, PDF exports, and customer sharing portals.
            </p>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border-border)] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Live Integration Audit
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--surface-surface)] border border-[var(--border-border)]">
                  <span className="font-semibold text-[var(--text-secondary)] block">Header Branding</span>
                  <span className="text-[var(--text-primary)] font-medium mt-0.5 block">{siteName}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Shown on quotation header &amp; PDF title</span>
                </div>

                <div className="p-3 rounded-lg bg-[var(--surface-surface)] border border-[var(--border-border)]">
                  <span className="font-semibold text-[var(--text-secondary)] block">Contact &amp; WhatsApp CTA</span>
                  <span className="text-[var(--text-primary)] font-medium mt-0.5 block">{phone || 'Default: +91-9876543210'}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Pre-filled in WhatsApp summary link</span>
                </div>

                <div className="p-3 rounded-lg bg-[var(--surface-surface)] border border-[var(--border-border)]">
                  <span className="font-semibold text-[var(--text-secondary)] block">Tax &amp; Legal Identity</span>
                  <span className="text-[var(--text-primary)] font-medium mt-0.5 block">GSTIN: 27AABCS1429B1Z</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Printed on commercial A4 quotations</span>
                </div>

                <div className="p-3 rounded-lg bg-[var(--surface-surface)] border border-[var(--border-border)]">
                  <span className="font-semibold text-[var(--text-secondary)] block">Public Sharing Link</span>
                  <span className="text-[var(--text-primary)] font-medium mt-0.5 block">/quotation/:id</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Secure customer approval portal</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Default Commercial Quotation Title
              </label>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="SKF Stainless Steel Furniture | Architectural Fabrication"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                Default Commercial Description &amp; Scope Summary
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                placeholder="Premium architectural stainless steel furniture and custom fabrication specifications."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-border)] bg-[var(--surface-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] resize-y"
                disabled={isSaving}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button Bar */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs">
        <span className="text-xs text-[var(--text-muted)]">
          All changes take effect immediately across Quotation PDFs, public customer portals, and the website.
        </span>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Business Settings
        </Button>
      </div>
    </form>
  );
}

export function BusinessSettingsPage() {
  const { showToast } = useToast();
  const { data: res, isLoading, isError, error, refetch } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const settings = res?.data?.settings;

  const handleSave = async (payload: UpdateWebsiteSettingsPayload) => {
    try {
      await updateSettings(payload).unwrap();
      showToast('success', 'Business settings updated and synchronized across platform.', 'Saved');
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg = errObj?.data?.message || errObj?.message || 'Failed to save settings.';
      showToast('error', msg, 'Save Error');
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-[var(--brand-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Business Settings &amp; Platform Identity
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configure centralized business details, commercial contact lines, workshop address, and branding defaults used for Quotation PDFs and customer documents.
        </p>
      </div>

      {isLoading && <LoadingState message="Loading business configuration..." />}

      {isError && !isLoading && (
        <Card className="border-[var(--status-error)]/30 bg-[var(--status-error)]/5">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-10 h-10 text-[var(--status-error)] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Failed to Load Settings
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {(error as { data?: { message?: string } })?.data?.message || 'Unable to retrieve settings from server.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (
        <BusinessSettingsForm
          key={settings?.updated_at || 'initial'}
          initialSettings={settings}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

export default BusinessSettingsPage;
