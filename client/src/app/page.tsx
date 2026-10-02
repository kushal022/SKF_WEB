'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Smartphone,
  ShieldCheck,
  Download,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Modal,
  Skeleton,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function FoundationPage() {
  const { showToast } = useToast();
  const { canInstall, isInstalled, isOnline, promptInstall } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleSimulateAction = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
      showToast('success', 'Foundation design system and token validation verified.', 'System Ready');
    }, 800);
  };

  return (
    <div className="space-y-10 py-4">
      {/* Hero Foundation Section */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-muted)] border border-[var(--border-border)] text-xs font-semibold text-[var(--text-secondary)]">
          <Sparkles className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
          <span>Step 1: Frontend Foundation + PWA System</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
          SKF Stainless Steel Furniture
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
          Production-ready frontend architecture built with Next.js App Router, Tailwind CSS semantic tokens, accessible UI components, and installable PWA foundation.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {canInstall && (
            <Button
              variant="accent"
              onClick={promptInstall}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Install Client PWA
            </Button>
          )}
          <Button
            variant="primary"
            isLoading={buttonLoading}
            onClick={handleSimulateAction}
          >
            Verify System State
          </Button>
          <Button
            variant="outline"
            onClick={() => setModalOpen(true)}
          >
            Open Foundation Modal
          </Button>
        </div>
      </section>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--brand-accent)] mb-2">
              <Smartphone className="w-5 h-5" />
            </div>
            <CardTitle>PWA & Offline System</CardTitle>
            <CardDescription>
              Service worker caching, manifest registration, and standalone install capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">PWA Status:</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">Network Status:</span>
              <Badge variant={isOnline ? 'info' : 'warning'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[var(--text-secondary)]">Installation:</span>
              <Badge variant={isInstalled ? 'success' : 'outline'}>
                {isInstalled ? 'Installed' : canInstall ? 'Prompt Ready' : 'Browser Mode'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--brand-accent)] mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <CardTitle>Semantic Token System</CardTitle>
            <CardDescription>
              Centralized brand, surface, text, border, status, and motion tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">Color Architecture:</span>
              <Badge variant="primary">Semantic Variables</Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">CSS Engine:</span>
              <Badge variant="secondary">Tailwind CSS v4</Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[var(--text-secondary)]">Dynamic Override:</span>
              <Badge variant="success">Backend Ready</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--brand-accent)] mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <CardTitle>Accessibility & Security</CardTitle>
            <CardDescription>
              WCAG contrast compliant, keyboard focus rings, and strict secret protection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">Keyboard Navigation:</span>
              <Badge variant="success">Verified</Badge>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[var(--border-border)]">
              <span className="text-[var(--text-secondary)]">ARIA Compliance:</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-[var(--text-secondary)]">Cache Privacy:</span>
              <Badge variant="primary">Restricted</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shared UI Foundation Verification Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Shared UI Foundation Components</CardTitle>
          <CardDescription>
            Interactive demonstration of atomic reusable components supporting all required states.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Button States */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Button States (Default, Hover, Focus, Disabled, Loading)
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="primary" isLoading>
                Loading
              </Button>
            </div>
          </div>

          {/* Input & Form States */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Input States (Default, Focus, Error, Disabled, Read-only)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Standard Input"
                placeholder="Enter inquiry..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                helperText="Active focus ring"
              />
              <Input
                label="Error Input"
                placeholder="Invalid entry"
                error="Required specification is missing"
              />
              <Input
                label="Disabled Input"
                value="Standard SS 304"
                disabled
              />
              <Select
                label="Steel Grade Select"
                options={[
                  { value: '304', label: 'AISI 304 Commercial' },
                  { value: '316', label: 'AISI 316 Marine Grade' },
                  { value: 'custom', label: 'Custom Architectural Alloy' },
                ]}
              />
            </div>
          </div>

          {/* Badges & Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Status Badges
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">Brand</Badge>
                <Badge variant="success">Completed</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="error">Critical</Badge>
                <Badge variant="info">Information</Badge>
                <Badge variant="outline">Neutral</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Shimmer Skeletons
              </h4>
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessible Modal Instance */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Foundation Modal Dialog"
        description="Accessible modal verifying focus trapping, ARIA roles, and ESC key listener."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setModalOpen(false);
                showToast('success', 'Modal interaction acknowledged.');
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
          <p>
            This modal conforms to WAI-ARIA dialog practices with visible focus management and backdrop dismiss.
          </p>
          <div className="p-3 rounded-lg bg-[var(--surface-muted)] text-xs text-[var(--text-primary)]">
            <strong>Architecture Check:</strong> All layers (Client, Admin, Backend) remain clean and separated.
          </div>
        </div>
      </Modal>
    </div>
  );
}
