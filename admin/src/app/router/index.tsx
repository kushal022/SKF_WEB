import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../../features/auth/LoginPage';
import SessionsPage from '../../features/sessions/SessionsPage';
import FoundationDashboard from '../../features/foundation/FoundationDashboard';
import { EmptyState } from '../../components/ui';

function StepPlaceholder({ stepTitle, description }: { stepTitle: string; description: string }) {
  return (
    <div className="py-12">
      <EmptyState
        title={stepTitle}
        description={description}
        actionText="Back to Overview"
        onAction={() => {
          window.location.href = '/admin';
        }}
      />
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root Redirect to /admin */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FoundationDashboard />} />
          <Route path="dashboard" element={<FoundationDashboard />} />
          <Route path="sessions" element={<SessionsPage />} />

          {/* Planned Business Modules (Step Placeholders) */}
          <Route
            path="products"
            element={
              <StepPlaceholder
                stepTitle="Product Catalog Foundation Ready"
                description="Products CRUD, variant management, and specifications will be implemented in future modules."
              />
            }
          />
          <Route
            path="categories"
            element={
              <StepPlaceholder
                stepTitle="Category Architecture Ready"
                description="Hierarchical category management will be implemented in future modules."
              />
            }
          />
          <Route
            path="quotations"
            element={
              <StepPlaceholder
                stepTitle="Quotations & B2B Pipeline Ready"
                description="Quotations, Estimator and B2B pricing pipelines will be implemented in future modules."
              />
            }
          />
          <Route
            path="theme-settings"
            element={
              <StepPlaceholder
                stepTitle="Theme & Site Settings Ready"
                description="Theme presets and live dynamic theme customizer will be implemented in future modules."
              />
            }
          />
          <Route
            path="audit"
            element={
              <StepPlaceholder
                stepTitle="Security & Audit Logs Ready"
                description="Security event monitoring and operational audit tracking will be implemented in future modules."
              />
            }
          />
          <Route
            path="*"
            element={
              <StepPlaceholder
                stepTitle="Resource Not Found"
                description="The administrative resource requested does not exist."
              />
            }
          />
        </Route>

        {/* Global Fallback: Redirect to /admin */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
