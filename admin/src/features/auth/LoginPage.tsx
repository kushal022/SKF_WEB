import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { useLoginMutation } from '../../app/store/api';
import { setCredentials, setAuthError } from './authSlice';
import { Button, Input, Card, CardContent } from '../../components/ui';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, error: authError } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [loginApi, { isLoading }] = useLoginMutation();

  // Extract safe returnTo path
  const searchParams = new URLSearchParams(location.search);
  const rawReturnTo = searchParams.get('returnTo');
  // Safe redirect guard: must start with single '/' and not '//' to prevent open redirects
  const returnTo = rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
    ? rawReturnTo
    : '/';

  // If already authenticated as admin, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, navigate, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    dispatch(setAuthError(null));

    // Client validation
    if (!email.trim()) {
      setFormError('Please enter your administrator email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    try {
      const response = await loginApi({ email: email.trim(), password }).unwrap();

      if (response.success && response.data?.accessToken && response.data.user) {
        // Enforce admin role authorization
        if (response.data.user.role !== 'admin') {
          setFormError('Access restricted: This account does not possess administrative privileges.');
          return;
        }

        dispatch(
          setCredentials({
            user: response.data.user,
            accessToken: response.data.accessToken,
          })
        );

        navigate(returnTo, { replace: true });
      } else {
        setFormError('Invalid email or password.');
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string }; status?: number };
      if (apiErr.status === 429) {
        setFormError('Too many login attempts. Please wait a few minutes before trying again.');
      } else if (apiErr.data?.message) {
        setFormError(apiErr.data.message);
      } else {
        setFormError('Invalid email or password. Please verify your credentials.');
      }
    }
  };

  const displayError = formError || authError;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[var(--brand-primary)] text-white relative overflow-hidden select-none">
      {/* Subtle luxury ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[var(--brand-accent)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-950/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--brand-accent)]/15 border border-[var(--brand-accent)]/30 flex items-center justify-center text-[var(--brand-accent)] shadow-lg shadow-sky-950/50 mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SKF Admin Portal</h1>
          <p className="text-xs text-slate-400">
            Sign in to access the Stainless Steel Furniture management console.
          </p>
        </div>

        {/* Login Card */}
        <Card className="bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Error Banner */}
              {displayError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--status-error)]/10 border border-[var(--status-error)]/30 text-xs text-[var(--status-error)] font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{displayError}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="admin-email"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                >
                  Admin Email
                </label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@skffurniture.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  className="bg-slate-950/60 border-slate-700 text-white placeholder-slate-500 focus:border-[var(--brand-accent)]"
                />
              </div>

              {/* Password Field with Show/Hide */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="admin-password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    leftIcon={<Lock className="w-4 h-4" />}
                    className="bg-slate-950/60 border-slate-700 text-white placeholder-slate-500 focus:border-[var(--brand-accent)] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="accent"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
                rightIcon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
                className="w-full mt-2 font-semibold shadow-md shadow-sky-950/40"
              >
                {isLoading ? 'Signing in...' : 'Sign In to Console'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice Footer */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Restricted Operational Access • Grade 304/316 Management</p>
          <p>Zero-token browser storage & HttpOnly refresh protection</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
