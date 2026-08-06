import { useEffect, useMemo } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  itemsApi,
  CreateItemDto,
  CreateVariantDto,
  UpdateVariantDto,
  CreateBarcodeDto,
  type ItemsQuery,
} from '../api/items.api';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.getAll(),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Table hook — server-side search, filtering and pagination.
 * `placeholderData` keeps the previous page on screen while the next loads,
 * so paging doesn't flash an empty table on a slow connection.
 *
 * Key starts with 'items' so the existing mutation invalidations
 * (`invalidateQueries({ queryKey: ['items'] })`) still reach it.
 */
export function usePagedItems(query: ItemsQuery) {
  return useQuery({
    queryKey: ['items', 'paged', query],
    queryFn: () => itemsApi.getPaged(query),
    placeholderData: keepPreviousData,
  });
}

const CATALOG_PAGE_SIZE = 100;

/**
 * Full active catalog, fetched page by page and accumulated in memory.
 *
 * Built for the POS grid: a till needs instant, offline-tolerant filtering,
 * so search/category stay client-side over the whole catalog rather than
 * becoming a network round-trip per keystroke. This exists purely to lift the
 * single-page ceiling that made item #51 unreachable at the till.
 *
 * `is_active` is deliberately not sent — the backend defaults to active-only,
 * and inactive products must never be sellable.
 */
export function useCatalogItems() {
  const query = useInfiniteQuery({
    queryKey: ['items', 'catalog'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      itemsApi.getPaged({ page: pageParam, perPage: CATALOG_PAGE_SIZE }),
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.perPage;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  // Pull the remaining pages as they arrive. The grid renders page 1 straight
  // away and fills in behind it, so the cashier is never blocked on a large
  // catalog finishing.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );

  return {
    items,
    isLoading: query.isLoading,
    isComplete: !query.hasNextPage && !query.isFetchingNextPage,
    total: query.data?.pages[0]?.total ?? 0,
  };
}

export function useItemStats() {
  return useQuery({
    queryKey: ['items', 'stats'],
    queryFn: () => itemsApi.getStats(),
    staleTime: 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => itemsApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useItemVariants(itemId: string | null) {
  return useQuery({
    queryKey: ['items', itemId, 'variants'],
    queryFn: () => itemsApi.getVariants(itemId!),
    enabled: !!itemId,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateItemDto) => itemsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateItemDto> & { is_active?: boolean };
    }) => itemsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => itemsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useCreateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: CreateVariantDto }) =>
      itemsApi.createVariant(itemId, data),
    onSuccess: (_res, { itemId }) => {
      qc.invalidateQueries({ queryKey: ['items', itemId, 'variants'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useUpdateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      variantId,
      data,
    }: {
      itemId: string;
      variantId: string;
      data: UpdateVariantDto;
    }) => itemsApi.updateVariant(itemId, variantId, data),
    onSuccess: (_res, { itemId }) => {
      qc.invalidateQueries({ queryKey: ['items', itemId, 'variants'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useDeleteVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, variantId }: { itemId: string; variantId: string }) =>
      itemsApi.deleteVariant(itemId, variantId),
    onSuccess: (_res, { itemId }) => {
      qc.invalidateQueries({ queryKey: ['items', itemId, 'variants'] });
      qc.invalidateQueries({ queryKey: ['items'] });
    },
  });
}

export function useItemBarcodes(itemId: string | null) {
  return useQuery({
    queryKey: ['items', itemId, 'barcodes'],
    queryFn: () => itemsApi.getBarcodes(itemId!),
    enabled: !!itemId,
  });
}

export function useCreateBarcode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBarcodeDto) => itemsApi.createBarcode(data),
    onSuccess: (_res, { item_id }) => {
      qc.invalidateQueries({ queryKey: ['items', item_id, 'barcodes'] });
    },
  });
}

export function useDeleteBarcode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; itemId: string }) => itemsApi.deleteBarcode(id),
    onSuccess: (_res, { itemId }) => {
      qc.invalidateQueries({ queryKey: ['items', itemId, 'barcodes'] });
    },
  });
}