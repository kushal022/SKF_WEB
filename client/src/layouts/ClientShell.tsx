'use client';

import React, { useState } from 'react';
import { Menu, Download, Sparkles, Phone, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Drawer, Button, OfflineBanner } from '../components/ui';

import Link from 'next/link';

export interface ClientShellProps {

  children: React.ReactNode;
}

export function ClientShell({ children }: ClientShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { canInstall, isOnline, promptInstall } = usePWAInstall();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-background)] text-[var(--text-primary)]">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <OfflineBanner message="You are currently browsing offline. Cached catalog pages remain accessible." />
      )}

      {/* Top Brand Banner */}
      <div className="bg-[var(--brand-primary)] text-[var(--text-inverse)] text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-white/10">
        <Sparkles className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
        <span>Precision Engineered 304 & 316 Stainless Steel Craftsmanship</span>
        {canInstall && (
          <button
            onClick={promptInstall}
            className="hidden sm:inline-flex items-center gap-1 ml-4 px-2 py-0.5 rounded bg-[var(--brand-accent)] text-white hover:opacity-90 font-medium text-[11px]"
          >
            <Download className="w-3 h-3" />
            Install App
          </button>
        )}
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--surface-surface)]/95 backdrop-blur-md border-b border-[var(--border-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center text-white font-black tracking-wider text-sm shadow-sm border border-slate-700">
              SKF
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[var(--text-primary)] block leading-tight">
                SKF Stainless Steel
              </span>
              <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase block">
                Architectural Furniture
              </span>
            </div>
          </div>

          {/* Desktop Navigation Foundation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-secondary)]">
            <span className="text-[var(--brand-primary)] font-semibold cursor-pointer">Home</span>
            <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">Catalog</span>
            <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">Custom Fabrication</span>
            <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">B2B Portal</span>
            <span className="hover:text-[var(--text-primary)] cursor-pointer transition-colors">About Us</span>
          </nav>

          {/* Action Area */}
          <div className="flex items-center gap-3">
            {canInstall && (
              <Button
                variant="outline"
                size="sm"
                onClick={promptInstall}
                leftIcon={<Download className="w-4 h-4" />}
                className="hidden sm:inline-flex"
              >
                Install App
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Phone className="w-3.5 h-3.5" />}
              className="hidden lg:inline-flex"
            >
              Get In Touch
            </Button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Navigation Menu"
        position="right"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg bg-[var(--surface-muted)] font-semibold text-[var(--text-primary)]"
            >
              Home
            </Link>
            <span className="px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]">
              Catalog
            </span>
            <span className="px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]">
              Custom Fabrication
            </span>
            <span className="px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]">
              B2B Portal
            </span>
            <span className="px-3 py-2.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]">
              About Us
            </span>
          </div>

          {canInstall && (
            <div className="mt-4 pt-4 border-t border-[var(--border-border)]">
              <Button
                variant="primary"
                size="md"
                onClick={promptInstall}
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full"
              >
                Install PWA App
              </Button>
            </div>
          )}
        </div>
      </Drawer>

      {/* Page Content Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Responsive Footer Foundation */}
      <footer className="bg-[var(--brand-primary)] text-white border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded bg-white text-slate-900 flex items-center justify-center font-bold text-xs">
                  SKF
                </div>
                <span className="font-bold text-base tracking-tight">SKF Stainless Steel Furniture</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Specialists in heavy-duty, luxury grade 304 and 316 stainless steel tables, dining collections, commercial counters, and bespoke fabrication.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Quick Links</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>Catalog Collection</li>
                <li>Custom Project Estimator</li>
                <li>Architect & B2B Enquiries</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Standards</h4>
              <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Grade 304/316 Certified</span>
              </div>
              <p className="text-[11px] text-slate-400">ISO 9001 Precision Standards</p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} SKF Stainless Steel Furniture. All rights reserved.</p>
            <p>PWA Ready • Offline Enabled</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ClientShell;
