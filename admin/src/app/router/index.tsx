import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../../features/auth/LoginPage';
import SessionsPage from '../../features/sessions/SessionsPage';
import FoundationDashboard from '../../features/foundation/FoundationDashboard';
import CategoryListPage from '../../features/categories/pages/CategoryListPage';
import ProductListPage from '../../features/products/pages/ProductListPage';
import ProductCreatePage from '../../features/products/pages/ProductCreatePage';
import ProductDetailPage from '../../features/products/pages/ProductDetailPage';
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

function ProductDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/admin/products/${id}`} replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Root Redirect to /admin */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Top-Level Route Aliases (from report-defined Admin routes) */}
        <Route path="/categories" element={<Navigate to="/admin/categories" replace />} />
        <Route path="/products" element={<Navigate to="/admin/products" replace />} />
        <Route path="/products/new" element={<Navigate to="/admin/products/new" replace />} />
        <Route path="/products/:id" element={<ProductDetailRedirect />} />

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

          {/* Categories Management */}
          <Route path="categories" element={<CategoryListPage />} />

          {/* Product Catalog Management */}
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/new" element={<ProductCreatePage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
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
