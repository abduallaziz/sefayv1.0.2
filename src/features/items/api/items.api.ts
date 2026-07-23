import { apiClient } from '@/lib/api';

export type ItemType =
  | 'product' | 'service' | 'custom'
  | 'raw_material' | 'semi_finished' | 'finished_goods' | 'asset' | 'consumable';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  operation_type: 'sell' | 'book' | 'repair' | 'rent';
  price: number;
  category_id: string | null;
  category_name: string | null;
  category_type: string | null;
  has_inventory: boolean;
  has_variants: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'product' | 'service' | 'expense';
  is_active: boolean;
  created_at: string;
}

export interface ItemVariant {
  id: string;
  name: string;
  price_adjustment: number;
  sku: string | null;
  stock_quantity: number;
  is_active: boolean;
}

export interface CreateItemDto {
  name: string;
  type: ItemType;
  operation_type: 'sell' | 'book' | 'repair' | 'rent';
  price: number;
  category_id?: string;
  has_inventory?: boolean;
  has_variants?: boolean;
}

export interface CreateVariantDto {
  name: string;
  price_adjustment: number;
  sku?: string;
  stock_quantity?: number;
}

export type BarcodeType = 'UPC' | 'EAN' | 'GS1' | 'QR';

export interface ItemBarcode {
  id: string;
  item_id: string;
  variant_id: string | null;
  barcode: string;
  barcode_type: BarcodeType;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBarcodeDto {
  item_id: string;
  variant_id?: string;
  barcode: string;
  barcode_type?: BarcodeType;
  is_primary?: boolean;
}

export interface BarcodeLookupResult {
  id: string;
  barcode: string;
  barcode_type: BarcodeType;
  is_primary: boolean;
  item_id: string;
  variant_id: string | null;
  items: {
    id: string;
    name: string;
    type: ItemType;
    price: number;
    has_inventory: boolean;
    has_variants: boolean;
    is_active: boolean;
  } | null;
  item_variants: {
    id: string;
    name: string;
    price_adjustment: number;
    sku: string | null;
    is_active: boolean;
  } | null;
}

export const itemsApi = {
  getAll: () => apiClient.get<Item[]>('/items'),
  getById: (id: string) => apiClient.get<Item>(`/items/${id}`),
  create: (dto: CreateItemDto) => apiClient.post<Item>('/items', dto),
  update: (id: string, dto: Partial<CreateItemDto> & { is_active?: boolean }) =>
    apiClient.patch<Item>(`/items/${id}`, dto),
  delete: (id: string) => apiClient.delete<void>(`/items/${id}`),

  getCategories: () => apiClient.get<Category[]>('/categories'),

  getVariants: (itemId: string) =>
    apiClient.get<ItemVariant[]>(`/items/${itemId}/variants`),
  createVariant: (itemId: string, dto: CreateVariantDto) =>
    apiClient.post<ItemVariant>(`/items/${itemId}/variants`, dto),
  deleteVariant: (itemId: string, variantId: string) =>
    apiClient.delete<void>(`/items/${itemId}/variants/${variantId}`),

  getBarcodes: (itemId: string) =>
    apiClient.get<ItemBarcode[]>(`/item-barcodes?item_id=${itemId}`),
  createBarcode: (dto: CreateBarcodeDto) =>
    apiClient.post<ItemBarcode>('/item-barcodes', dto),
  updateBarcode: (id: string, dto: Partial<CreateBarcodeDto>) =>
    apiClient.patch<ItemBarcode>(`/item-barcodes/${id}`, dto),
  deleteBarcode: (id: string) => apiClient.delete<void>(`/item-barcodes/${id}`),
  lookupBarcode: (barcode: string) =>
    apiClient.get<BarcodeLookupResult>(`/item-barcodes/lookup/${encodeURIComponent(barcode)}`),
};
