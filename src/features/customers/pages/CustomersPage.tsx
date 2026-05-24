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

  const filtered = useMemo(() => {
    if (!customers) return [];
    let list = [...customers];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const key = filters.sortBy;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('subtitle')}
          </p>
        </div>
        <button
          onClick={() => { setSelectedCustomer(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('add_customer')}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">{t('stats.total')}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                +{stats.new_this_month}
              </p>
              <p className="text-xs text-gray-400">{t('stats.new_month')}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600 fill-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total_loyalty_points.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">{t('stats.total_points')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <CustomerFiltersBar filters={filters} onChange={setFilters} />
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">{t('loading')}</div>
        ) : (
          <CustomersTable
            customers={filtered}
            onView={(c) => { setSelectedCustomer(c); setShowDetails(true); }}
            onEdit={(c) => { setSelectedCustomer(c); setShowForm(true); }}
            onDelete={(c) => { setSelectedCustomer(c); setShowDelete(true); }}
          />
        )}

        {/* Footer count */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          {t('count', { count: filtered.length })}
        </div>
      </div>

      {/* Modals */}
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