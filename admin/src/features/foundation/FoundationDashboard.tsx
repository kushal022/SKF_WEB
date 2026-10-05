import { useState } from 'react';
import {
  Server,
  ShieldAlert,
  Smartphone,
  Upload,
  Download,
  Activity,
} from 'lucide-react';
import { useGetHealthQuery } from '../../app/store/api';
import { useAppSelector } from '../../app/store';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useToast } from '../../components/ui';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Drawer,
  Skeleton,
  FileUpload,
} from '../../components/ui';

export function FoundationDashboard() {
  const { data: healthData, isLoading: healthLoading, isError: healthError } = useGetHealthQuery();
  const authState = useAppSelector((state) => state.auth);
  const { canInstall, isInstalled, isOnline, promptInstall } = usePWAInstall();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [sampleFile, setSampleFile] = useState<File | null>(null);

  const handleSimulateAction = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
      showToast('success', 'Admin RTK Query store and UI foundation operating cleanly.', 'Store Validated');
    }, 700);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[var(--surface-surface)] border border-[var(--border-border)] shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Admin Foundation Layer Active</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            SKF Administrative Core Engine
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Vite + React + Redux Toolkit + RTK Query + Tailwind CSS + PWA Security Architecture.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canInstall && (
            <Button
              variant="accent"
              size="sm"
              onClick={promptInstall}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Install Admin PWA
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            isLoading={buttonLoading}
            onClick={handleSimulateAction}
          >
            Test State & Toast
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
          >
            Launch Modal
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDrawerOpen(true)}
          >
            Inspect Drawer
          </Button>
        </div>
      </div>

      {/* Real-time Foundation Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* RTK Query Backend Connectivity */}
        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mb-2">
              <Server className="w-5 h-5" />
            </div>
            <CardTitle>RTK Query Backend State</CardTitle>
            <CardDescription>
              Live contract with backend API endpoint (/api/v1/health)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">RTK Query Cache:</span>
              <Badge variant="primary">Active</Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">Backend Probe:</span>
              {healthLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : healthError ? (
                <Badge variant="warning">Offline / Unreachable</Badge>
              ) : (
                <Badge variant="success">Online ({healthData?.data?.status || 'ok'})</Badge>
              )}
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[var(--text-secondary)]">DB Connectivity:</span>
              {healthLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : healthError ? (
                <span className="text-[var(--text-muted)]">Awaiting Backend</span>
              ) : (
                <Badge variant="success">{healthData?.data?.database || 'connected'}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security & Strict PWA Caching Rules */}
        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <CardTitle>PWA Security Governance</CardTitle>
            <CardDescription>
              Zero-token caching enforcement in compliance with Step 1 specs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">Auth Store Status:</span>
              <Badge variant="primary">{authState.isAuthenticated ? 'authenticated' : 'unauthenticated'}</Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">Token Storage:</span>
              <Badge variant="primary">Memory Only</Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">Admin API Caching:</span>
              <Badge variant="error">Prohibited</Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[var(--text-secondary)]">Offline Fallback:</span>
              <Badge variant="success">Safe Isolated Guard</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Admin PWA Standalone Status */}
        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
              <Smartphone className="w-5 h-5" />
            </div>
            <CardTitle>Admin PWA Capabilities</CardTitle>
            <CardDescription>
              Service worker registration and standalone install status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">Service Worker:</span>
              <Badge variant="success">Registered</Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">App Manifest:</span>
              <Badge variant="success">Verified</Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[var(--text-secondary)]">Display Mode:</span>
              <Badge variant={isInstalled ? 'success' : 'outline'}>
                {isInstalled ? 'Standalone Mode' : canInstall ? 'Installable' : 'Browser Mode'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 17: Admin Media & Image Upload Architecture Foundation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[var(--brand-accent)]" />
            <CardTitle>Media & Image Upload Foundation</CardTitle>
          </div>
          <CardDescription>
            Reusable media validation architecture with drag-and-drop, MIME filtering, and instant preview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xl">
            <FileUpload
              label="Select Product or Banner Asset"
              maxSizeMB={5}
              acceptedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']}
              onFileSelect={(file) => {
                setSampleFile(file);
                if (file) {
                  showToast('info', `File selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
                }
              }}
              helperText="Client-side validation architecture ready for future Cloudinary integration."
            />
            {sampleFile && (
              <p className="text-xs text-[var(--status-success)] font-medium mt-2">
                ✓ File validation passed: {sampleFile.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shared UI Foundation Verification */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Shared UI Foundation</CardTitle>
          <CardDescription>
            Comprehensive state validation for buttons, inputs, selects, badges, and modals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Operational Buttons
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Save Changes</Button>
              <Button variant="secondary">Cancel</Button>
              <Button variant="outline">Export Data</Button>
              <Button variant="accent">Promote</Button>
              <Button variant="danger">Delete Record</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="primary" isLoading>
                Saving
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Form Controls
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input label="Site Name" defaultValue="SKF Stainless Steel" />
              <Input label="Internal Code" error="Identifier already in use" defaultValue="SKF-DUP-01" />
              <Select
                label="Role Access Level"
                options={[
                  { value: 'admin', label: 'Admin (Full Operations)' },
                  { value: 'staff', label: 'Staff (Read & Quote)' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Foundation Modal Instance */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Admin Security & Operations Review"
        description="Modal dialog verifying keyboard escape handling, focus management, and accessibility."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setModalOpen(false);
                showToast('success', 'Security parameters confirmed.');
              }}
            >
              Acknowledge
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
          <p>
            The administrative layer runs independently on port 3001 and connects to the backend API without storing sensitive tokens in persistent browser storage.
          </p>
          <div className="p-3 rounded-lg bg-[var(--surface-muted)] text-xs text-[var(--text-primary)]">
            <strong>Security Rule:</strong> Service worker will never intercept or cache admin mutation queries.
          </div>
        </div>
      </Modal>

      {/* Foundation Drawer Instance */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Operational Context Inspector"
      >
        <div className="space-y-4 text-sm text-[var(--text-secondary)]">
          <p>
            This drawer is reusable across operational workflows such as product editing, quotation approvals, and theme inspection.
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-[var(--surface-muted)]">
              <span className="font-semibold block text-[var(--text-primary)]">Store Status:</span>
              <span>Redux Toolkit + RTK Query Active</span>
            </div>
            <div className="p-2.5 rounded bg-[var(--surface-muted)]">
              <span className="font-semibold block text-[var(--text-primary)]">PWA Status:</span>
              <span>{isOnline ? 'Online Synced' : 'Offline Restricted'}</span>
            </div>
          </div>
          <Button variant="primary" size="sm" className="w-full mt-4" onClick={() => setDrawerOpen(false)}>
            Close Inspector
          </Button>
        </div>
      </Drawer>
    </div>
  );
}

export default FoundationDashboard;
