'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Users, TrendingUp, Star } from 'lucide-react';
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
          c.full_name.toLowerCase().includes(q) ||
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => { setSelectedCustomer(null); setShowForm(true); }}
          className="flex items-center gap-2 px-3 py-2 bg-[#0C447C] hover:bg-[#0a3a6b] text-white rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('add_customer')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0C447C]/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#0C447C] dark:text-[#5B9BD5]" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tabular-nums">{stats?.total ?? '—'}</p>
            <p className="text-xs text-slate-500 truncate">{t('stats.total')}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tabular-nums">+{stats?.new_this_month ?? 0}</p>
            <p className="text-xs text-slate-500 truncate">{t('stats.new_month')}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white tabular-nums">{totalLoyaltyPoints.toLocaleString('en-US')}</p>
            <p className="text-xs text-slate-500 truncate">{t('stats.total_points')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl">
        <div className="p-4 border-b border-slate-200 dark:border-gray-800">
          <CustomerFiltersBar filters={filters} onChange={setFilters} />
        </div>
        {isLoading ? (
          <div className="text-center py-16 text-slate-500">{t('loading')}</div>
        ) : (
          <CustomersTable
            customers={filtered}
            onView={(c) => { setSelectedCustomer(c); setShowDetails(true); }}
            onEdit={(c) => { setSelectedCustomer(c); setShowForm(true); }}
            onDelete={(c) => { setSelectedCustomer(c); setShowDelete(true); }}
          />
        )}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-gray-800 text-xs text-slate-500">
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