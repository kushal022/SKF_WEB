import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Laptop,
  Smartphone,
  Clock,
  ShieldAlert,
  Trash2,
  LogOut,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import {
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useLogoutAllSessionsMutation,
  type SessionItem,
} from '../../app/store/api';
import { useAppDispatch } from '../../app/store';
import { logout } from '../auth/authSlice';
import { baseApi } from '../../app/store/api';
import { useToast } from '../../components/ui';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Modal,
  LoadingState,
  ErrorState,
} from '../../components/ui';

export function SessionsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const {
    data: sessionsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGetSessionsQuery();

  const [revokeSessionApi, { isLoading: isRevoking }] = useRevokeSessionMutation();
  const [logoutAllApi, { isLoading: isLoggingOutAll }] = useLogoutAllSessionsMutation();

  const [sessionToRevoke, setSessionToRevoke] = useState<SessionItem | null>(null);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);

  const sessions = sessionsData?.data?.sessions || [];
  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions.filter((s) => !s.is_current && s.is_active);

  const handleRevokeSession = async () => {
    if (!sessionToRevoke) return;

    try {
      await revokeSessionApi(sessionToRevoke.public_id).unwrap();
      showToast('success', 'Session revoked successfully.', 'Security Updated');

      if (sessionToRevoke.is_current) {
        // Current session revoked: log out immediately
        dispatch(logout());
        dispatch(baseApi.util.resetApiState());
        navigate('/login', { replace: true });
      }
    } catch {
      showToast('error', 'Failed to revoke session. Please try again.', 'Error');
    } finally {
      setSessionToRevoke(null);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutAllApi().unwrap();
      showToast('success', 'All sessions revoked across all devices.', 'Logged Out');
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
      navigate('/login', { replace: true });
    } catch {
      // Even if network fails, clear local state
      dispatch(logout());
      dispatch(baseApi.util.resetApiState());
      navigate('/login', { replace: true });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getDeviceIcon = (userAgent?: string | null) => {
    const ua = (userAgent || '').toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Laptop className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Active Security Sessions
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Monitor and manage active sign-in sessions for your administrator account.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowLogoutAllModal(true)}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Revoke All Sessions
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading authenticated sessions..." />
      ) : isError ? (
        <ErrorState
          title="Could not load sessions"
          message="Failed to communicate with authentication service."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-6">
          {/* Current Session Card */}
          {currentSession && (
            <Card className="border-[var(--brand-accent)]/30 bg-sky-950/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--brand-accent)]">
                      {getDeviceIcon(currentSession.user_agent)}
                    </span>
                    <CardTitle className="text-base">Current Active Session</CardTitle>
                  </div>
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>This Device</span>
                  </Badge>
                </div>
                <CardDescription>
                  Your current browser session on this device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-[var(--surface-surface)] border border-[var(--border-border)]">
                  <div>
                    <span className="text-[var(--text-muted)] block">IP Address</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {currentSession.ip_address || '127.0.0.1'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Signed In At</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {formatDate(currentSession.created_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Expires At</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {formatDate(currentSession.expires_at)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--text-secondary)] truncate">
                  <span className="font-medium">Client Info: </span>
                  {currentSession.user_agent || 'Modern Web Browser'}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Other Active Sessions ({otherSessions.length})</CardTitle>
              <CardDescription>
                Other devices currently signed into this administrative account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {otherSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                  No other active sessions detected. You are only signed in on this device.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-border)]">
                  {otherSessions.map((session) => (
                    <div
                      key={session.public_id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[var(--surface-muted)] text-[var(--text-secondary)] mt-0.5">
                          {getDeviceIcon(session.user_agent)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-primary)]">
                              {session.ip_address || 'Unknown Location'}
                            </span>
                            <Badge variant="outline" size="sm">Active</Badge>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] max-w-md truncate">
                            {session.user_agent || 'Browser Session'}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                              Started: {formatDate(session.created_at)}
                            </span>
                            <span>Expires: {formatDate(session.expires_at)}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSessionToRevoke(session)}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-[var(--status-error)]" />}
                        className="self-start sm:self-center"
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Modal: Single Session Revoke */}
      <Modal
        isOpen={Boolean(sessionToRevoke)}
        onClose={() => setSessionToRevoke(null)}
        title="Revoke Session"
        description="Are you sure you want to terminate this active sign-in session?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSessionToRevoke(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isRevoking}
              onClick={handleRevokeSession}
            >
              Confirm Revoke
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-xs text-[var(--text-secondary)]">
          <p>
            The selected device will immediately lose access and will be required to re-authenticate with valid credentials.
          </p>
          {sessionToRevoke && (
            <div className="p-2.5 rounded bg-[var(--surface-muted)] text-[var(--text-primary)] font-mono text-[11px]">
              IP: {sessionToRevoke.ip_address || '127.0.0.1'}
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal: Revoke All Sessions */}
      <Modal
        isOpen={showLogoutAllModal}
        onClose={() => setShowLogoutAllModal(false)}
        title="Revoke All Active Sessions"
        description="Sign out from all devices across the platform."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowLogoutAllModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isLoggingOutAll}
              onClick={handleLogoutAll}
            >
              Revoke All & Sign Out
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--status-error)]/10 text-[var(--status-error)]">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>This will immediately invalidate all refresh tokens and sessions on all devices, including this one.</span>
          </div>
          <p>
            You will be redirected to the administrator login page.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default SessionsPage;
