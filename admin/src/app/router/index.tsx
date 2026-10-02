import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import FoundationDashboard from '../../features/foundation/FoundationDashboard';
import { EmptyState } from '../../components/ui';

function StepPlaceholder({ stepTitle, description }: { stepTitle: string; description: string }) {
  return (
    <div className="py-12">
      <EmptyState
        title={stepTitle}
        description={description}
        actionText="Back to Foundation"
        onAction={() => {
          window.location.href = '/';
        }}
      />
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<FoundationDashboard />} />
          <Route
            path="products"
            element={
              <StepPlaceholder
                stepTitle="Product Catalog Foundation Ready"
                description="Products CRUD and variant management will be implemented in Step 2."
              />
            }
          />
          <Route
            path="categories"
            element={
              <StepPlaceholder
                stepTitle="Category Architecture Ready"
                description="Hierarchical category management will be implemented in Step 2."
              />
            }
          />
          <Route
            path="quotations"
            element={
              <StepPlaceholder
                stepTitle="Quotations & B2B Pipeline Ready"
                description="Quotations, Estimator and B2B pricing pipelines will be implemented in Step 3."
              />
            }
          />
          <Route
            path="theme-settings"
            element={
              <StepPlaceholder
                stepTitle="Theme & Site Settings Ready"
                description="Theme presets and live dynamic theme customizer will be implemented in Step 4."
              />
            }
          />
          <Route
            path="audit"
            element={
              <StepPlaceholder
                stepTitle="Security & Audit Logs Ready"
                description="Security event monitoring and operational audit tracking will be implemented in Step 5."
              />
            }
          />
          <Route
            path="*"
            element={
              <StepPlaceholder
                stepTitle="Page Not Found"
                description="The administrative resource requested does not exist."
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
