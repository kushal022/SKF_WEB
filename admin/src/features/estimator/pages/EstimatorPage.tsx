import { useState, useMemo } from 'react';
import {
  Sliders,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useGetAdminEstimatorRulesQuery,
  useDeleteAdminEstimatorRuleMutation,
  useUpdateAdminEstimatorRuleMutation,
} from '../../../app/store/api';
import type { EstimatorRule, EstimatorQueryParams } from '../../../types/estimator';
import {
  Button,
  Input,
  Select,
  Card,
  Badge,
  LoadingState,
  EmptyState,
  ErrorState,
  useToast,
} from '../../../components/ui';
import EstimatorRuleModal from '../components/EstimatorRuleModal';
import EstimatorCalculator from '../components/EstimatorCalculator';
import { formatCurrency } from '../../../utils/currency';

export function EstimatorPage() {
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<EstimatorRule | null>(null);

  const queryParams = useMemo(() => {
    const params: EstimatorQueryParams = {
      page,
      limit,
    };
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    if (activeFilter === 'active') {
      params.is_active = true;
    } else if (activeFilter === 'inactive') {
      params.is_active = false;
    }
    return params;
  }, [searchTerm, activeFilter, page, limit]);

  const {
    data: rulesRes,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminEstimatorRulesQuery(queryParams);

  const [deleteRule] = useDeleteAdminEstimatorRuleMutation();
  const [updateRule] = useUpdateAdminEstimatorRuleMutation();

  const rules: EstimatorRule[] = rulesRes?.data?.items || [];
  const pagination = rulesRes?.data?.pagination || {
    total: rules.length,
    totalPages: Math.ceil(rules.length / limit) || 1,
    page,
    limit,
  };

  const handleToggleActive = async (rule: EstimatorRule) => {
    try {
      await updateRule({
        publicId: rule.public_id,
        data: { is_active: !rule.is_active },
      }).unwrap();

      showToast(
        'success',
        `Rule "${rule.name}" is now ${!rule.is_active ? 'active' : 'inactive'}.`,
        'Status Updated'
      );
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to update rule status.', 'Error');
    }
  };

  const handleDeleteRule = async (rule: EstimatorRule) => {
    if (!window.confirm(`Delete pricing rule "${rule.name}"?`)) {
      return;
    }

    try {
      await deleteRule(rule.public_id).unwrap();
      showToast('info', `Pricing rule "${rule.name}" deleted.`, 'Rule Deleted');
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to delete rule.', 'Error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Pricing Estimator Rules
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-semibold">
              {pagination.total} Rules
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Configure custom furniture pricing formulas, material modifiers, and dimension multipliers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setRuleToEdit(null);
              setIsRuleModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Rule
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 shadow-xs border border-[var(--border-border)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              id="rule-search"
              placeholder="Search by rule name, product category, material..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div>
            <Select
              id="rule-active-filter"
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active Rules Only' },
                { value: 'inactive', label: 'Inactive Rules Only' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Rules Table Content */}
      {isLoading ? (
        <Card className="p-12 border border-[var(--border-border)]">
          <LoadingState message="Loading estimator rules..." />
        </Card>
      ) : isError ? (
        <Card className="p-8 border border-[var(--border-border)]">
          <ErrorState
            title="Failed to load rules"
            message={(error as any)?.data?.message || 'Could not connect to estimator service.'}
            onRetry={() => refetch()}
          />
        </Card>
      ) : rules.length === 0 ? (
        <Card className="p-12 border border-[var(--border-border)]">
          <EmptyState
            title="No estimator rules configured"
            description="Create your first rule to enable automated custom stainless steel pricing calculations."
            actionText="Create Rule"
            onAction={() => {
              setRuleToEdit(null);
              setIsRuleModalOpen(true);
            }}
            icon={<Sliders className="w-8 h-8" />}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] shadow-xs">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-border)] bg-[var(--surface-muted)] text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Category & Material</th>
                  <th className="py-3 px-4 text-right">Base Rate</th>
                  <th className="py-3 px-4 text-right">Multiplier</th>
                  <th className="py-3 px-4 text-center">Priority</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-border)] text-[var(--text-primary)]">
                {rules.map((rule) => (
                  <tr
                    key={rule.public_id}
                    className="hover:bg-[var(--surface-muted)]/50 transition-colors"
                  >
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {rule.name}
                      </div>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        ID: {rule.public_id.slice(0, 8)}...
                      </span>
                    </td>

                    {/* Category & Material */}
                    <td className="py-3 px-4 text-xs">
                      <div className="font-medium text-[var(--text-primary)]">
                        {rule.product_type || 'All Categories'}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {rule.material || 'Standard Grade'}
                        {rule.finish ? ` • ${rule.finish}` : ''}
                      </div>
                    </td>

                    {/* Base Rate */}
                    <td className="py-3 px-4 text-right font-mono font-medium text-xs">
                      {formatCurrency(rule.base_rate || 0)}
                    </td>

                    {/* Dimension Multiplier */}
                    <td className="py-3 px-4 text-right font-mono text-xs text-[var(--text-secondary)]">
                      {rule.dimension_multiplier !== null
                        ? `₹${rule.dimension_multiplier}/m²`
                        : '—'}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 text-center font-mono text-xs font-semibold">
                      {rule.priority}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(rule)}
                        className="cursor-pointer"
                        title={rule.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {rule.is_active ? (
                          <Badge variant="success" size="sm">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Inactive
                          </Badge>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRuleToEdit(rule);
                            setIsRuleModalOpen(true);
                          }}
                          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors"
                          title="Edit Rule"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule)}
                          className="p-1.5 rounded-md text-[var(--status-error)] hover:bg-red-500/10 transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] shadow-xs">
            <div className="text-xs text-[var(--text-secondary)]">
              Showing{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {rules.length > 0 ? (page - 1) * limit + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {Math.min(page * limit, pagination.total)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {pagination.total}
              </span>{' '}
              rules
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-[var(--surface-surface)] border border-[var(--border-border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-medium px-2 text-[var(--text-primary)]">
                  {page} / {pagination.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Estimator Test Bench */}
      <div className="pt-6 border-t border-[var(--border-border)]">
        <EstimatorCalculator />
      </div>

      {/* Rule Creator / Editor Modal */}
      {isRuleModalOpen && (
        <EstimatorRuleModal
          key={ruleToEdit ? ruleToEdit.public_id : 'new-rule'}
          isOpen={isRuleModalOpen}
          onClose={() => {
            setIsRuleModalOpen(false);
            setRuleToEdit(null);
          }}
          ruleToEdit={ruleToEdit}
        />
      )}
    </div>
  );
}

export default EstimatorPage;
