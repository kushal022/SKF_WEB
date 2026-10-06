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
import EnquiryListPage from '../../features/enquiries/pages/EnquiryListPage';
import EnquiryDetailPage from '../../features/enquiries/pages/EnquiryDetailPage';
import QuotationListPage from '../../features/quotations/pages/QuotationListPage';
import QuotationCreatePage from '../../features/quotations/pages/QuotationCreatePage';
import QuotationDetailPage from '../../features/quotations/pages/QuotationDetailPage';
import EstimatorPage from '../../features/estimator/pages/EstimatorPage';
import CustomRequestListPage from '../../features/customRequests/pages/CustomRequestListPage';
import CustomRequestDetailPage from '../../features/customRequests/pages/CustomRequestDetailPage';
import GalleryListPage from '../../features/gallery/pages/GalleryListPage';
import GalleryDetailPage from '../../features/gallery/pages/GalleryDetailPage';
import ReviewListPage from '../../features/reviews/pages/ReviewListPage';
import PublicQuotationPage from '../../features/quotations/pages/PublicQuotationPage';
import WebsiteSettingsPage from '../../features/settings/pages/WebsiteSettingsPage';
import ThemePage from '../../features/theme/pages/ThemePage';
import AnalyticsPage from '../../features/analytics/pages/AnalyticsPage';
import NotificationCenterPage from '../../features/notifications/pages/NotificationCenterPage';
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

function EnquiryDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/admin/enquiries/${id}`} replace />;
}

function QuotationDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/admin/quotations/${id}`} replace />;
}

function CustomRequestDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/admin/custom-requests/${id}`} replace />;
}

function GalleryDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/admin/gallery/${id}`} replace />;
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
        <Route path="/enquiries" element={<Navigate to="/admin/enquiries" replace />} />
        <Route path="/enquiries/:id" element={<EnquiryDetailRedirect />} />
        <Route path="/quotations" element={<Navigate to="/admin/quotations" replace />} />
        <Route path="/quotations/new" element={<Navigate to="/admin/quotations/new" replace />} />
        <Route path="/quotations/:id" element={<QuotationDetailRedirect />} />
        {/* Customer Public Quotation Sharing Route */}
        <Route path="/quotation/:id" element={<PublicQuotationPage />} />
        <Route path="/estimator" element={<Navigate to="/admin/estimator" replace />} />
        <Route path="/custom-requests" element={<Navigate to="/admin/custom-requests" replace />} />
        <Route path="/custom-requests/:id" element={<CustomRequestDetailRedirect />} />
        <Route path="/gallery" element={<Navigate to="/admin/gallery" replace />} />
        <Route path="/gallery/:id" element={<GalleryDetailRedirect />} />
        <Route path="/reviews" element={<Navigate to="/admin/reviews" replace />} />
        <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/settings/website" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/settings/business" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/theme" element={<Navigate to="/admin/theme" replace />} />
        <Route path="/theme-settings" element={<Navigate to="/admin/theme" replace />} />
        <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
        <Route path="/notifications" element={<Navigate to="/admin/notifications" replace />} />

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

          {/* Enquiries & CRM Pipeline Management */}
          <Route path="enquiries" element={<EnquiryListPage />} />
          <Route path="enquiries/:id" element={<EnquiryDetailPage />} />

          {/* Quotations & Commercial Proposals */}
          <Route path="quotations" element={<QuotationListPage />} />
          <Route path="quotations/new" element={<QuotationCreatePage />} />
          <Route path="quotations/:id" element={<QuotationDetailPage />} />

          {/* Pricing Estimator Management */}
          <Route path="estimator" element={<EstimatorPage />} />

          {/* Custom Furniture Requests Management */}
          <Route path="custom-requests" element={<CustomRequestListPage />} />
          <Route path="custom-requests/:id" element={<CustomRequestDetailPage />} />

          {/* Gallery & Project Showcase */}
          <Route path="gallery" element={<GalleryListPage />} />
          <Route path="gallery/:id" element={<GalleryDetailPage />} />

          {/* Customer Reviews & Moderation */}
          <Route path="reviews" element={<ReviewListPage />} />

          {/* Settings Area (Website Settings) */}
          <Route path="settings" element={<WebsiteSettingsPage />} />
          <Route path="settings/website" element={<WebsiteSettingsPage />} />
          <Route path="settings/business" element={<Navigate to="/admin/settings" replace />} />

          {/* Theme & Appearance (Step 13) */}
          <Route path="theme" element={<ThemePage />} />
          <Route path="theme-settings" element={<ThemePage />} />

          {/* Basic Analytics & KPI Telemetry (Step 12) */}
          <Route path="analytics" element={<AnalyticsPage />} />

          {/* Notifications Center (Step 14) */}
          <Route path="notifications" element={<NotificationCenterPage />} />
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
