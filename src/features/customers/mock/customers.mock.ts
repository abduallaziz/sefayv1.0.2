
import { Customer, CustomerOrder, CustomerStats } from '../types/customer.types';

export const mockCustomers: Customer[] = [
  {
    id: 'c1',
    tenant_id: 't1',
    name: 'أحمد محمد',
    phone: '0501234567',
    email: 'ahmed@email.com',
    loyalty_points: 450,
    created_at: '2024-01-15T10:00:00Z',
    deleted_at: null,
    total_orders: 12,
    total_spent: 1850,
  },
  {
    id: 'c2',
    tenant_id: 't1',
    name: 'سارة علي',
    phone: '0559876543',
    email: null,
    loyalty_points: 120,
    created_at: '2024-02-20T14:30:00Z',
    deleted_at: null,
    total_orders: 5,
    total_spent: 640,
  },
  {
    id: 'c3',
    tenant_id: 't1',
    name: 'محمد خالد',
    phone: '0531112233',
    email: 'mkhaled@email.com',
    loyalty_points: 890,
    created_at: '2023-11-05T09:15:00Z',
    deleted_at: null,
    total_orders: 28,
    total_spent: 4200,
  },
  {
    id: 'c4',
    tenant_id: 't1',
    name: 'فاطمة أحمد',
    phone: '0504445566',
    email: null,
    loyalty_points: 60,
    created_at: '2024-03-10T16:45:00Z',
    deleted_at: null,
    total_orders: 3,
    total_spent: 310,
  },
  {
    id: 'c5',
    tenant_id: 't1',
    name: 'عبدالله سعد',
    phone: '0567778899',
    email: 'asaad@email.com',
    loyalty_points: 220,
    created_at: '2024-01-28T11:20:00Z',
    deleted_at: null,
    total_orders: 9,
    total_spent: 980,
  },
];

export const mockCustomerOrders: CustomerOrder[] = [
  {
    id: 'o1',
    created_at: '2024-05-01T10:00:00Z',
    total: 185,
    status: 'completed',
    payment_method: 'cash',
    items_count: 3,
  },
  {
    id: 'o2',
    created_at: '2024-04-20T14:00:00Z',
    total: 220,
    status: 'completed',
    payment_method: 'card',
    items_count: 5,
  },
  {
    id: 'o3',
    created_at: '2024-04-05T09:30:00Z',
    total: 90,
    status: 'cancelled',
    payment_method: 'cash',
    items_count: 2,
  },
];

export const mockCustomerStats: CustomerStats = {
  total: 142,
  new_this_month: 18,
  total_loyalty_points: 24800,
};