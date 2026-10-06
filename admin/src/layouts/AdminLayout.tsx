import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Inbox,
  FileText,
  Calculator,
  Sparkles,
  Images,
  Star,
  Building2,
  Globe,
  Palette,
  BarChart3,
  Shield,
  Menu,
  ChevronLeft,
  ChevronRight,
  Download,
  Wifi,
  WifiOff,
  LogOut,
  KeyRound,
  User,
  Bell,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAppDispatch, useAppSelector } from '../app/store';
import { useLogoutUserMutation, baseApi } from '../app/store/api';
import { logout } from '../features/auth/authSlice';
import { useToast } from '../components/ui';
import { Drawer, Button, OfflineBanner, Badge } from '../components/ui';
import NotificationBell from '../components/notifications/NotificationBell';
import { useNotificationSocket } from '../hooks/useNotificationSocket';
import { disconnectSocket } from '../services/socket';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export function AdminLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { user } = useAppSelector((state) => state.auth);

  // Initialize and maintain real-time notification socket lifecycle
  useNotificationSocket();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { canInstall, isOnline, promptInstall } = usePWAInstall();

  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutUserMutation();

  const navigation: NavItem[] = [
    {
      name: 'Foundation Overview',
      path: '/admin',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: 'Executive Analytics',
      path: '/admin/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      badge: 'Step 12',
    },
    {
      name: 'Active Sessions',
      path: '/admin/sessions',
      icon: <KeyRound className="w-5 h-5" />,
      badge: 'Active',
    },
    {
      name: 'Product Catalog',
      path: '/admin/products',
      icon: <Package className="w-5 h-5" />,
    },
    {
      name: 'Categories',
      path: '/admin/categories',
      icon: <Layers className="w-5 h-5" />,
    },
    {
      name: 'Enquiries & CRM',
      path: '/admin/enquiries',
      icon: <Inbox className="w-5 h-5" />,
    },
    {
      name: 'Quotations',
      path: '/admin/quotations',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      name: 'Pricing Estimator',
      path: '/admin/estimator',
      icon: <Calculator className="w-5 h-5" />,
    },
    {
      name: 'Custom Requests',
      path: '/admin/custom-requests',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      name: 'Gallery & Projects',
      path: '/admin/gallery',
      icon: <Images className="w-5 h-5" />,
    },
    {
      name: 'Customer Reviews',
      path: '/admin/reviews',
      icon: <Star className="w-5 h-5" />,
    },
    {
      name: 'Website Settings',
      path: '/admin/settings',
      icon: <Globe className="w-5 h-5" />,
    },
    {
      name: 'Theme & Appearance',
      path: '/admin/theme',
      icon: <Palette className="w-5 h-5" />,
      badge: 'Step 13',
    },
    {
      name: 'Business Settings',
      path: '/admin/settings/business',
      icon: <Building2 className="w-5 h-5" />,
    },
    {
      name: 'Notifications',
      path: '/admin/notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: 'Step 14',
    },
    {
      name: 'Security & Audit',
      path: '/admin/audit',
      icon: <Shield className="w-5 h-5" />,
      badge: 'Step 15',
    },
  ];

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
      showToast('info', 'Signed out successfully.', 'Session Closed');
    } catch {
      // Even if network request fails, clear local authentication state
      showToast('info', 'Signed out locally.', 'Session Closed');
    } finally {
      disconnectSocket();
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface-background)] text-[var(--text-primary)]">
      {/* Offline Banner Bar */}
      {!isOnline && (
        <OfflineBanner message="You are offline. Please reconnect to continue. Administrative mutations are restricted." />
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
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
                end={item.path === '/admin'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-[var(--brand-accent)] text-white font-semibold shadow-xs'
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
                  <span className="text-[11px]">{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-400 flex items-center gap-1 text-[11px] transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="mx-auto p-1 text-slate-400 hover:text-rose-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <Drawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          title="Admin Navigation"
          position="left"
        >
          <div className="flex flex-col gap-2 py-2">
            {/* User Profile in Mobile Drawer */}
            <div className="p-3 rounded-lg bg-[var(--surface-muted)] mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-xs text-[var(--text-primary)] block truncate">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] block truncate">
                  {user?.email || 'admin@skffurniture.com'}
                </span>
              </div>
            </div>

            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) => `
                  flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-[var(--brand-accent)] text-white font-semibold'
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

            <div className="mt-4 pt-4 border-t border-[var(--border-border)] space-y-2">
              {canInstall && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={promptInstall}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="w-full text-xs"
                >
                  Install Admin PWA
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="w-full text-xs"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </Drawer>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Operational Bar */}
          <header className="h-16 bg-[var(--surface-surface)] border-b border-[var(--border-border)] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
            <div className="flex items-center gap-3">
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
                <Badge variant="primary" size="sm" className="hidden sm:inline-flex capitalize">
                  {user?.role || 'admin'}
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

              {/* Notification Bell */}
              <NotificationBell />

              {/* Admin Profile Area */}
              <div className="flex items-center gap-3 pl-3 border-l border-[var(--border-border)]">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-semibold text-[var(--text-primary)] block leading-tight">
                    {user?.name || 'Administrator'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] block truncate max-w-[150px]">
                    {user?.email || 'admin@skffurniture.com'}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                  leftIcon={<LogOut className="w-4 h-4 text-rose-500" />}
                  className="text-xs text-[var(--status-error)] hover:bg-rose-50 hover:text-rose-600 hidden sm:inline-flex"
                  aria-label="Logout from session"
                >
                  Logout
                </Button>
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
