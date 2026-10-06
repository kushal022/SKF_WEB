import { useState } from 'react';
import {
  Globe,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Share2,
  Search,
  Save,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
  MessageCircle,
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
  Badge,
  ImageUpload,
} from '../../../components/ui';
import type { WebsiteSettings, UpdateWebsiteSettingsPayload } from '../../../types/settings';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

interface DayScheduleState {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const DEFAULT_DAY_SCHEDULES: Record<string, DayScheduleState> = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '19:30' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '19:30' },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '19:30' },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '19:30' },
  friday: { isOpen: true, openTime: '09:00', closeTime: '19:30' },
  saturday: { isOpen: true, openTime: '09:00', closeTime: '19:30' },
  sunday: { isOpen: false, openTime: '10:00', closeTime: '17:00' },
};

function parseInitialSchedules(rawHours: any): Record<string, DayScheduleState> {
  const result: Record<string, DayScheduleState> = { ...DEFAULT_DAY_SCHEDULES };
  if (rawHours && typeof rawHours === 'object') {
    DAYS_OF_WEEK.forEach(({ key }) => {
      if (rawHours[key] && typeof rawHours[key] === 'object') {
        result[key] = {
          isOpen: Boolean(rawHours[key].isOpen),
          openTime: rawHours[key].openTime || '09:00',
          closeTime: rawHours[key].closeTime || '19:30',
        };
      }
    });
  }
  return result;
}

interface WebsiteSettingsFormProps {
  initialSettings: WebsiteSettings;
  onSave: (payload: UpdateWebsiteSettingsPayload) => Promise<void>;
  onReset: () => void;
  isSaving: boolean;
}

function WebsiteSettingsForm({
  initialSettings,
  onSave,
  onReset,
  isSaving,
}: WebsiteSettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'identity' | 'contact' | 'address' | 'social' | 'seo'>('identity');

  // Form State - Tab 1: Brand & Identity
  const [siteName, setSiteName] = useState(initialSettings.site_name || 'SKF Stainless Steel Furniture');
  const [tagline, setTagline] = useState(initialSettings.tagline || '');
  const [logoUrl, setLogoUrl] = useState(initialSettings.logo_url || '');
  const [faviconUrl, setFaviconUrl] = useState(initialSettings.favicon_url || '');

  // Social / Web links
  const social = (initialSettings.social_links as Record<string, string>) || {};
  const [websiteUrl, setWebsiteUrl] = useState(social.website || '');
  const [instagram, setInstagram] = useState(social.instagram || '');
  const [facebook, setFacebook] = useState(social.facebook || '');
  const [youtube, setYoutube] = useState(social.youtube || '');
  const [linkedin, setLinkedin] = useState(social.linkedin || '');
  const [twitter, setTwitter] = useState(social.twitter || '');
  const [googleBusiness, setGoogleBusiness] = useState(social.google_business || '');
  const [alternatePhone, setAlternatePhone] = useState(social.alternate_phone || '');
  const [supportEmail, setSupportEmail] = useState(social.support_email || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(social.google_maps_url || '');

  // Form State - Tab 2: Contact
  const [phone, setPhone] = useState(initialSettings.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsapp_number || '');
  const [email, setEmail] = useState(initialSettings.email || '');

  // Form State - Tab 3: Address & Hours
  const [address, setAddress] = useState(initialSettings.address || '');
  const [daySchedules, setDaySchedules] = useState<Record<string, DayScheduleState>>(() =>
    parseInitialSchedules(initialSettings.business_hours)
  );

  // Form State - Tab 5: SEO Defaults
  const seo = (initialSettings.seo_defaults as Record<string, string>) || {};
  const [metaTitle, setMetaTitle] = useState(
    seo.meta_title || seo.title || 'SKF Stainless Steel Furniture | Architectural Fabrication'
  );
  const [metaDescription, setMetaDescription] = useState(
    seo.meta_description ||
      seo.description ||
      'Premium architectural stainless steel furniture, bespoke modular kitchens, and custom luxury fabrication in India.'
  );
  const [keywords, setKeywords] = useState(
    seo.keywords || 'stainless steel furniture, 304 stainless steel table, luxury dining table, custom steel fabrication'
  );
  const [ogTitle, setOgTitle] = useState(seo.og_title || seo.title || '');
  const [ogDescription, setOgDescription] = useState(seo.og_description || seo.description || '');
  const [ogImage, setOgImage] = useState(seo.og_image || initialSettings.logo_url || '');
  const [canonicalUrl, setCanonicalUrl] = useState(seo.canonical_url || '');

  const [formError, setFormError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    setHasChanges(true);
  };

  const handleDayScheduleChange = (dayKey: string, field: keyof DayScheduleState, val: any) => {
    setDaySchedules((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: val,
      },
    }));
    setHasChanges(true);
  };

  const generateFormattedSchedule = () => {
    const openDays = DAYS_OF_WEEK.filter((d) => daySchedules[d.key]?.isOpen);
    if (openDays.length === 0) return 'Temporarily Closed';
    const first = openDays[0];
    const last = openDays[openDays.length - 1];
    const sample = daySchedules[first.key];
    const sundayOpen = daySchedules['sunday']?.isOpen;

    return `${first.label.slice(0, 3)} – ${last.label.slice(0, 3)}: ${sample?.openTime || '09:00'} – ${
      sample?.closeTime || '19:30'
    }${!sundayOpen ? ' (Sunday Closed)' : ''}`;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!siteName.trim()) {
      setFormError('Site Name / Business Name is required.');
      return;
    }

    try {
      setFormError(null);

      // Structure business hours
      const businessHoursPayload: Record<string, any> = {
        schedule: generateFormattedSchedule(),
        ...daySchedules,
      };

      // Structure social links
      const socialLinksPayload: Record<string, string> = {
        instagram: instagram.trim(),
        facebook: facebook.trim(),
        youtube: youtube.trim(),
        linkedin: linkedin.trim(),
        twitter: twitter.trim(),
        google_business: googleBusiness.trim(),
        website: websiteUrl.trim(),
        alternate_phone: alternatePhone.trim(),
        support_email: supportEmail.trim(),
        google_maps_url: googleMapsUrl.trim(),
      };

      // Structure SEO defaults
      const seoDefaultsPayload: Record<string, string> = {
        title: metaTitle.trim(),
        meta_title: metaTitle.trim(),
        description: metaDescription.trim(),
        meta_description: metaDescription.trim(),
        keywords: keywords.trim(),
        og_title: ogTitle.trim() || metaTitle.trim(),
        og_description: ogDescription.trim() || metaDescription.trim(),
        og_image: ogImage.trim(),
        canonical_url: canonicalUrl.trim(),
      };

      const payload: UpdateWebsiteSettingsPayload = {
        site_name: siteName.trim(),
        tagline: tagline.trim() || null,
        logo_url: logoUrl.trim() || null,
        favicon_url: faviconUrl.trim() || null,
        phone: phone.trim() || null,
        whatsapp_number: whatsappNumber.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        business_hours: businessHoursPayload,
        social_links: socialLinksPayload,
        seo_defaults: seoDefaultsPayload,
      };

      await onSave(payload);
      setHasChanges(false);
    } catch (err: any) {
      const errorMsg =
        err?.data?.message || err?.message || 'Failed to update website settings. Please verify inputs.';
      setFormError(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>Settings</span>
            <span>/</span>
            <span className="text-[var(--brand-accent)]">Website Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-1">
            <Globe className="w-6 h-6 text-[var(--brand-accent)]" />
            Website & Global Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage global brand identity, contact channels, operating schedule, social profiles, and SEO defaults.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasChanges && (
            <Badge variant="warning" className="animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={isSaving}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSubmit()}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Settings
          </Button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'identity'
              ? 'bg-[var(--brand-primary)] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Brand Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'contact'
              ? 'bg-[var(--brand-primary)] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Contact Channels</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('address')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'address'
              ? 'bg-[var(--brand-primary)] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Address & Operating Hours</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'social'
              ? 'bg-[var(--brand-primary)] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Social & Profiles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'seo'
              ? 'bg-[var(--brand-primary)] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>SEO & Metadata Defaults</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <form onSubmit={(e) => handleSubmit(e)}>
        {/* ======================================================== */}
        {/* TAB 1: Brand & Business Identity                         */}
        {/* ======================================================== */}
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[var(--brand-accent)]" />
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Business / Site Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={siteName}
                      onChange={(e) => handleFieldChange(setSiteName, e.target.value)}
                      placeholder="SKF Stainless Steel Furniture"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      The official public identity displayed across browser titles, header brandings, and receipts.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Tagline / Slogan
                    </label>
                    <Input
                      value={tagline}
                      onChange={(e) => handleFieldChange(setTagline, e.target.value)}
                      placeholder="Premium Grade 304 & 316 Stainless Steel Craftsmanship"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Secondary phrase appearing in hero banners and meta descriptions.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Official Website URL
                    </label>
                    <Input
                      value={websiteUrl}
                      onChange={(e) => handleFieldChange(setWebsiteUrl, e.target.value)}
                      placeholder="https://skffurniture.com"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[var(--brand-accent)]" />
                    Visual Assets & Logos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <ImageUpload
                    label="Website Logo"
                    value={logoUrl}
                    onChange={(url) => handleFieldChange(setLogoUrl, url)}
                    onRemove={() => handleFieldChange(setLogoUrl, '')}
                    folder="branding"
                    helperText="Upload transparent PNG, SVG, or WEBP logo (minimum 300x80px)"
                  />

                  <ImageUpload
                    label="Website Favicon"
                    value={faviconUrl}
                    onChange={(url) => handleFieldChange(setFaviconUrl, url)}
                    onRemove={() => handleFieldChange(setFaviconUrl, '')}
                    folder="branding"
                    aspectRatio="square"
                    helperText="Upload square icon (16x16, 32x32, or 64x64 PNG, ICO, or WEBP)"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Live Visual Asset Preview Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Visual Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Preview */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Header Logo Preview
                    </span>
                    <div className="h-24 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-4 overflow-hidden shadow-inner">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          className="max-h-16 max-w-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '';
                          }}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-[var(--brand-accent)] text-white font-bold flex items-center justify-center text-sm">
                            SKF
                          </div>
                          <span className="text-white font-bold text-sm tracking-tight">{siteName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Favicon Preview */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Browser Tab Preview
                    </span>
                    <div className="rounded-lg bg-slate-100 dark:bg-slate-900 p-2.5 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <div className="w-4 h-4 rounded-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {faviconUrl ? (
                          <img src={faviconUrl} alt="Favicon" className="w-3.5 h-3.5 object-contain" />
                        ) : (
                          <Globe className="w-3 h-3 text-[var(--brand-accent)]" />
                        )}
                      </div>
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">
                        {siteName} — Official Store
                      </span>
                    </div>
                  </div>

                  {/* Quick summary badge */}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                    <div className="flex justify-between">
                      <span>Public ID:</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {initialSettings.public_id?.slice(0, 13) || 'system-setting'}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Synchronized:</span>
                      <span className="text-[11px]">
                        {initialSettings.updated_at ? new Date(initialSettings.updated_at).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: Contact Information                               */}
        {/* ======================================================== */}
        {activeTab === 'contact' && (
          <div className="max-w-3xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[var(--brand-accent)]" />
                  Telephony & Direct Messengers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Primary Phone Number
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => handleFieldChange(setPhone, e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Main showroom / direct sales line.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Alternate / Landline Phone
                    </label>
                    <Input
                      value={alternatePhone}
                      onChange={(e) => handleFieldChange(setAlternatePhone, e.target.value)}
                      placeholder="+91 79 2589 1234"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Office / Factory landline.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    WhatsApp Business Number
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={whatsappNumber}
                      onChange={(e) => handleFieldChange(setWhatsappNumber, e.target.value)}
                      placeholder="+919876543210"
                      className="flex-1"
                    />
                    {whatsappNumber && (
                      <a
                        href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Test Link
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used for instant WhatsApp CTA buttons in headers, quotation shares, and product inquiries.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[var(--brand-accent)]" />
                  Email Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Sales & Quotations Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => handleFieldChange(setEmail, e.target.value)}
                      placeholder="sales@skffurniture.com"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Receives new catalog inquiries and commercial requests.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Customer Support Email
                    </label>
                    <Input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => handleFieldChange(setSupportEmail, e.target.value)}
                      placeholder="support@skffurniture.com"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">For after-sales assistance and warranty claims.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: Address & Business Operating Hours                */}
        {/* ======================================================== */}
        {activeTab === 'address' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[var(--brand-accent)]" />
                  Facility & Showroom Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Physical Manufacturing & Showroom Address
                  </label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => handleFieldChange(setAddress, e.target.value)}
                    placeholder="Plot No. 42, GIDC Industrial Estate, Phase 2, Vatva, Ahmedabad, Gujarat 382445, India"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Displayed in website footers, quotation invoices, and contact pages.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Google Maps Share / Directions URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={googleMapsUrl}
                      onChange={(e) => handleFieldChange(setGoogleMapsUrl, e.target.value)}
                      placeholder="https://maps.google.com/?q=SKF+Stainless+Steel"
                      className="flex-1"
                    />
                    {googleMapsUrl && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Preview
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[var(--brand-accent)]" />
                  Weekly Operating Hours
                </CardTitle>
                <div className="text-xs text-slate-500 font-mono">
                  Computed: {generateFormattedSchedule()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  {DAYS_OF_WEEK.map(({ key, label }) => {
                    const day = daySchedules[key] || { isOpen: true, openTime: '09:00', closeTime: '19:30' };
                    return (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 bg-white dark:bg-slate-900/60"
                      >
                        <div className="flex items-center gap-3 w-36">
                          <input
                            type="checkbox"
                            id={`day-${key}`}
                            checked={day.isOpen}
                            onChange={(e) => handleDayScheduleChange(key, 'isOpen', e.target.checked)}
                            className="w-4 h-4 rounded text-[var(--brand-accent)] focus:ring-[var(--brand-accent)] border-slate-300 dark:border-slate-700"
                          />
                          <label
                            htmlFor={`day-${key}`}
                            className={`text-sm font-medium cursor-pointer ${
                              day.isOpen
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-400 line-through'
                            }`}
                          >
                            {label}
                          </label>
                        </div>

                        {day.isOpen ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">From</span>
                            <input
                              type="time"
                              value={day.openTime}
                              onChange={(e) => handleDayScheduleChange(key, 'openTime', e.target.value)}
                              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                            />
                            <span className="text-slate-500">To</span>
                            <input
                              type="time"
                              value={day.closeTime}
                              onChange={(e) => handleDayScheduleChange(key, 'closeTime', e.target.value)}
                              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-wider text-rose-500 py-1">
                            Closed
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: Social Links & Profiles                           */}
        {/* ======================================================== */}
        {activeTab === 'social' && (
          <div className="max-w-3xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[var(--brand-accent)]" />
                  Social Media Links & Public Profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Instagram Profile
                  </label>
                  <Input
                    value={instagram}
                    onChange={(e) => handleFieldChange(setInstagram, e.target.value)}
                    placeholder="https://instagram.com/skffurniture"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Facebook Page
                  </label>
                  <Input
                    value={facebook}
                    onChange={(e) => handleFieldChange(setFacebook, e.target.value)}
                    placeholder="https://facebook.com/skffurniture"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    YouTube Channel / Showcase
                  </label>
                  <Input
                    value={youtube}
                    onChange={(e) => handleFieldChange(setYoutube, e.target.value)}
                    placeholder="https://youtube.com/@skffurniture"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    LinkedIn Business Profile
                  </label>
                  <Input
                    value={linkedin}
                    onChange={(e) => handleFieldChange(setLinkedin, e.target.value)}
                    placeholder="https://linkedin.com/company/skffurniture"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    X (formerly Twitter)
                  </label>
                  <Input
                    value={twitter}
                    onChange={(e) => handleFieldChange(setTwitter, e.target.value)}
                    placeholder="https://x.com/skffurniture"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Google Business Profile (Maps & Reviews Link)
                  </label>
                  <Input
                    value={googleBusiness}
                    onChange={(e) => handleFieldChange(setGoogleBusiness, e.target.value)}
                    placeholder="https://g.page/r/skffurniture"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SEO & Default Metadata                            */}
        {/* ======================================================== */}
        {activeTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="w-5 h-5 text-[var(--brand-accent)]" />
                    Global Search Engine Optimization (SEO)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Default Meta Title
                      </label>
                      <span
                        className={`text-[11px] font-mono ${
                          metaTitle.length > 60 ? 'text-amber-500' : 'text-slate-400'
                        }`}
                      >
                        {metaTitle.length}/60 chars
                      </span>
                    </div>
                    <Input
                      value={metaTitle}
                      onChange={(e) => handleFieldChange(setMetaTitle, e.target.value)}
                      placeholder="SKF Stainless Steel Furniture | Architectural Fabrication"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Serves as fallback title for pages without a specific page title.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Default Meta Description
                      </label>
                      <span
                        className={`text-[11px] font-mono ${
                          metaDescription.length > 160 ? 'text-amber-500' : 'text-slate-400'
                        }`}
                      >
                        {metaDescription.length}/160 chars
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={metaDescription}
                      onChange={(e) => handleFieldChange(setMetaDescription, e.target.value)}
                      placeholder="Premium architectural stainless steel furniture, bespoke modular kitchens, and custom luxury fabrication in India."
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Default Meta Keywords (comma separated)
                    </label>
                    <Input
                      value={keywords}
                      onChange={(e) => handleFieldChange(setKeywords, e.target.value)}
                      placeholder="stainless steel furniture, 304 stainless steel table, luxury dining table"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Canonical URL
                    </label>
                    <Input
                      value={canonicalUrl}
                      onChange={(e) => handleFieldChange(setCanonicalUrl, e.target.value)}
                      placeholder="https://skffurniture.com"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-[var(--brand-accent)]" />
                    Open Graph & Social Share Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      OG Title
                    </label>
                    <Input
                      value={ogTitle}
                      onChange={(e) => handleFieldChange(setOgTitle, e.target.value)}
                      placeholder="Same as Meta Title if blank"
                    />
                  </div>

                  <div>
                    <ImageUpload
                      label="OG / Social Share Image"
                      value={ogImage}
                      onChange={(url) => handleFieldChange(setOgImage, url)}
                      onRemove={() => handleFieldChange(setOgImage, '')}
                      folder="seo"
                      aspectRatio="wide"
                      helperText="Upload social banner (recommended: 1200x630px JPG, PNG, or WEBP)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      OG Description
                    </label>
                    <textarea
                      rows={2}
                      value={ogDescription}
                      onChange={(e) => handleFieldChange(setOgDescription, e.target.value)}
                      placeholder="Custom preview snippet for WhatsApp, LinkedIn, and Facebook cards."
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Search Engine & Social Card Simulator */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Google Search Result Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 font-sans">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold">
                        S
                      </div>
                      <span className="truncate">{websiteUrl || 'https://skffurniture.com'}</span>
                    </div>
                    <h4 className="text-sm text-blue-700 dark:text-blue-400 hover:underline cursor-pointer font-medium leading-snug line-clamp-1">
                      {metaTitle || 'SKF Stainless Steel Furniture'}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {metaDescription ||
                        'Discover handcrafted luxury 304 and 316 stainless steel dining tables, commercial fixtures, and bespoke architectural metal fabrication.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Social Share Card Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
                    <div className="h-32 bg-slate-800 flex items-center justify-center overflow-hidden">
                      {ogImage ? (
                        <img src={ogImage} alt="OG Card" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-400 text-xs">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-60" />
                          <span>No OG Image set</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {websiteUrl
                          ? new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`).hostname
                          : 'skffurniture.com'}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {ogTitle || metaTitle || siteName}
                      </h5>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {ogDescription || metaDescription}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export function WebsiteSettingsPage() {
  const { data: settingsData, isLoading, isError, refetch } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();
  const { showToast } = useToast();

  const settings = settingsData?.data?.settings;

  const handleSave = async (payload: UpdateWebsiteSettingsPayload) => {
    try {
      await updateSettings(payload).unwrap();
      showToast('success', 'Website settings updated and synchronized successfully.', 'Settings Saved');
    } catch (err: any) {
      const errorMsg =
        err?.data?.message || err?.message || 'Failed to update website settings. Please verify inputs.';
      showToast('error', errorMsg, 'Save Failed');
      throw err;
    }
  };

  const handleReset = () => {
    refetch();
    showToast('info', 'Form values reset to current active settings.', 'Reset');
  };

  if (isLoading) {
    return <LoadingState message="Loading website and brand configuration..." />;
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Failed to Load Settings</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">
              Unable to reach the backend website settings service.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <WebsiteSettingsForm
        key={settings?.updated_at || 'initial'}
        initialSettings={
          settings || {
            site_name: 'SKF Stainless Steel Furniture',
            tagline: 'Premium Grade 304/316 Architectural & Modular Furniture',
          }
        }
        onSave={handleSave}
        onReset={handleReset}
        isSaving={isSaving}
      />
    </div>
  );
}

export default WebsiteSettingsPage;
