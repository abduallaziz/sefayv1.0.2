'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Users, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Customer, CustomerFilters, CreateCustomerDto } from '../types/customer.types';
import { CustomerFiltersBar } from '../components/CustomerFilters';
import { CustomersTable } from '../components/CustomersTable';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { CustomerDetailsModal } from '../components/CustomerDetailsModal';
import { DeleteCustomerModal } from '../components/DeleteCustomerModal';
import {
  useCustomers,
  useCustomerStats,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../hooks/useCustomers';

export function CustomersPage() {
  const t = useTranslations('customers');

  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: customers, isLoading } = useCustomers();
  const { data: stats } = useCustomerStats();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const totalLoyaltyPoints = useMemo(
    () => customers?.reduce((sum, c) => sum + (c.loyalty_points ?? 0), 0) ?? 0,
    [customers],
  );

  const filtered = useMemo(() => {
    if (!customers) return [];
    let list = [...customers];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      const key = filters.sortBy as keyof Customer;
      const aVal = a[key] ?? 0;
      const bVal = b[key] ?? 0;
      if (filters.sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
    return list;
  }, [customers, filters]);

  const handleSubmit = async (data: CreateCustomerDto) => {
    if (selectedCustomer) {
      await updateMutation.mutateAsync({ id: selectedCustomer.id, dto: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setShowForm(false);
    setSelectedCustomer(null);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    await deleteMutation.mutateAsync(selectedCustomer.id);
    setShowDelete(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-posCloud-text-primary dark:text-posCloudDark-text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('subtitle')}</p>
        </div>
        <Button onClick={() => { setSelectedCustomer(null); setShowForm(true); }} className="shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('add_customer')}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-posCloud-primary-light dark:bg-posCloud-primary/15 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-posCloud-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary tabular-nums">{stats?.total ?? '—'}</p>
            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary truncate">{t('stats.total')}</p>
          </div>
        </div>
        <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-posCloud-success-light dark:bg-posCloud-success/15 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-posCloud-success" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary tabular-nums">+{stats?.new_this_month ?? 0}</p>
            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary truncate">{t('stats.new_month')}</p>
          </div>
        </div>
        <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-posCloud-warning-light dark:bg-posCloud-warning/15 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-posCloud-warning" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-posCloud-text-primary dark:text-posCloudDark-text-primary tabular-nums">{totalLoyaltyPoints.toLocaleString('en-US')}</p>
            <p className="text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary truncate">{t('stats.total_points')}</p>
          </div>
        </div>
      </div>

      <div className="bg-posCloud-surface dark:bg-posCloudDark-surface border border-posCloud-border dark:border-posCloudDark-border rounded-xl">
        <div className="p-4 border-b border-posCloud-border dark:border-posCloudDark-border">
          <CustomerFiltersBar filters={filters} onChange={setFilters} />
        </div>
        {isLoading ? (
          <div className="text-center py-16 text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">{t('loading')}</div>
        ) : (
          <CustomersTable
            customers={filtered}
            onView={(c) => { setSelectedCustomer(c); setShowDetails(true); }}
            onEdit={(c) => { setSelectedCustomer(c); setShowForm(true); }}
            onDelete={(c) => { setSelectedCustomer(c); setShowDelete(true); }}
          />
        )}
        <div className="px-4 py-3 border-t border-posCloud-border dark:border-posCloudDark-border text-xs text-posCloud-text-tertiary dark:text-posCloudDark-text-tertiary">
          {t('count', { count: filtered.length })}
        </div>
      </div>

      {showForm && (
        <CustomerFormModal
          customer={selectedCustomer}
          onClose={() => { setShowForm(false); setSelectedCustomer(null); }}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
      {showDetails && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => { setShowDetails(false); setSelectedCustomer(null); }}
          onEdit={() => { setShowDetails(false); setShowForm(true); }}
        />
      )}
      {showDelete && selectedCustomer && (
        <DeleteCustomerModal
          customer={selectedCustomer}
          onClose={() => { setShowDelete(false); setSelectedCustomer(null); }}
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}