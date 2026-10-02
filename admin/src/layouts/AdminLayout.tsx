import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  FileText,
  Palette,
  Shield,
  Menu,
  ChevronLeft,
  ChevronRight,
  Download,
  Wifi,
  WifiOff,
  UserCheck,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Drawer, Button, OfflineBanner, Badge } from '../components/ui';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { canInstall, isOnline, promptInstall } = usePWAInstall();

  const navigation: NavItem[] = [
    {
      name: 'Foundation Overview',
      path: '/',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: 'Product Catalog',
      path: '/products',
      icon: <Package className="w-5 h-5" />,
      badge: 'Step 2',
    },
    {
      name: 'Categories',
      path: '/categories',
      icon: <Layers className="w-5 h-5" />,
      badge: 'Step 2',
    },
    {
      name: 'Quotations & B2B',
      path: '/quotations',
      icon: <FileText className="w-5 h-5" />,
      badge: 'Step 3',
    },
    {
      name: 'Theme & Settings',
      path: '/theme-settings',
      icon: <Palette className="w-5 h-5" />,
      badge: 'Step 4',
    },
    {
      name: 'Security & Audit',
      path: '/audit',
      icon: <Shield className="w-5 h-5" />,
      badge: 'Step 5',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-background)] text-[var(--text-primary)]">
      {/* Offline Banner Bar */}
      {!isOnline && (
        <OfflineBanner message="You are offline. Please reconnect to continue. Administrative mutations are restricted." />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Desktop-first operational experience) */}
        <aside
          className={`
            hidden md:flex flex-col bg-[var(--brand-primary)] text-white border-r border-slate-800 transition-all duration-200 z-30
            ${collapsed ? 'w-20' : 'w-64'}
          `}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-[var(--brand-accent)] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                SKF
              </div>
              {!collapsed && (
                <div className="truncate">
                  <span className="font-bold text-sm tracking-tight block">SKF Admin</span>
                  <span className="text-[10px] text-slate-400 block tracking-wider uppercase">Portal Engine</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-[var(--brand-accent)] text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? item.name : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.name}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* PWA Install in Sidebar if eligible */}
          {canInstall && !collapsed && (
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <Button
                variant="accent"
                size="sm"
                onClick={promptInstall}
                leftIcon={<Download className="w-4 h-4" />}
                className="w-full text-xs"
              >
                Install Admin PWA
              </Button>
            </div>
          )}

          {/* Sidebar Footer info */}
          <div className="p-3 border-t border-slate-800 text-slate-400 text-xs flex items-center justify-between">
            {!collapsed ? (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="text-[11px]">{isOnline ? 'Operational' : 'Offline Mode'}</span>
                </div>
                <span className="text-[10px] text-slate-500">v1.0.0</span>
              </>
            ) : (
              <div
                className={`w-2.5 h-2.5 mx-auto rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}
                title={isOnline ? 'Online' : 'Offline'}
              />
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <Drawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          title="Admin Menu"
          position="left"
        >
          <div className="flex flex-col gap-2 py-2">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-[var(--brand-accent)] text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <Badge variant="outline" size="sm">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            ))}

            {canInstall && (
              <div className="mt-4 pt-4 border-t border-[var(--border-border)]">
                <Button
                  variant="primary"
                  size="md"
                  onClick={promptInstall}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="w-full"
                >
                  Install Admin PWA
                </Button>
              </div>
            )}
          </div>
        </Drawer>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Operational Bar */}
          <header className="h-16 bg-[var(--surface-surface)] border-b border-[var(--border-border)] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  SKF Operational Control
                </h1>
                <Badge variant="outline" size="sm" className="hidden sm:inline-flex">
                  Foundation Active
                </Badge>
              </div>
            </div>

            {/* Actions & Operational Indicators */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-muted)] text-xs text-[var(--text-secondary)] font-medium">
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-[var(--status-success)]" />
                    <span>API Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-[var(--status-warning)]" />
                    <span>Disconnected</span>
                  </>
                )}
              </div>

              {canInstall && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={promptInstall}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="hidden sm:inline-flex text-xs"
                >
                  Install PWA
                </Button>
              )}

              {/* Staff / Admin Profile Status Indicator */}
              <div className="flex items-center gap-2 pl-2 border-l border-[var(--border-border)]">
                <div className="w-8 h-8 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-semibold text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="hidden lg:block text-left">
                  <span className="text-xs font-semibold text-[var(--text-primary)] block leading-tight">
                    Secured Console
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block">
                    Zero-Token Cache Safe
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Operational Viewport Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
