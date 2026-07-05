import { teethTechApi } from '@/src/services/teethTechApi';
import type {
    CreateInventoryCheckRequest,
    InventoryCheck,
    InventoryCheckItem,
    InventoryCheckStatus,
    NomenclatureItem,
    ReceiveStockRequest,
    StockMovement,
    StockOverview,
    UpdateInventoryItemRequest,
} from '@/src/types/warehouse.types';

type InventoryItemArgs = {
    id: string;
    itemId: string;
    body: UpdateInventoryItemRequest;
};

type CreateWarehouseMaterialRequest = {
    name: string;
    description: string;
    nomenclatureCode: string;
    unit: string;
};

function getArrayFromResponse<T>(response: unknown, keys: string[]): T[] {
    if (Array.isArray(response)) return response as T[];
    if (!response || typeof response !== 'object') return [];

    const responseRecord = response as Record<string, unknown>;

    for (const key of keys) {
        const value = responseRecord[key];
        if (Array.isArray(value)) return value as T[];
    }

    const data = responseRecord.data;
    if (data && typeof data === 'object') {
        return getArrayFromResponse<T>(data, keys);
    }

    const embedded = responseRecord._embedded;
    if (embedded && typeof embedded === 'object') {
        const embeddedRecord = embedded as Record<string, unknown>;
        const firstArray = Object.values(embeddedRecord).find(Array.isArray);
        if (Array.isArray(firstArray)) return firstArray as T[];
    }

    return [];
}

function normalizeNomenclatureResponse(response: unknown) {
    return getArrayFromResponse<NomenclatureItem>(response, [
        'content',
        'items',
        'nomenclature',
        'nomenclatures',
    ]);
}

export const warehouseApi = teethTechApi.injectEndpoints({
    endpoints: (builder) => ({
        getNomenclature: builder.query<NomenclatureItem[], { activeOnly?: boolean } | void>({
            query: (params) => ({
                url: '/nomenclature',
                params: params?.activeOnly === undefined
                    ? undefined
                    : { activeOnly: params.activeOnly },
            }),
            transformResponse: normalizeNomenclatureResponse,
            providesTags: (result) => [
                { type: 'Nomenclature', id: 'LIST' },
                ...(result ?? []).map(({ id }) => ({ type: 'Nomenclature' as const, id })),
            ],
        }),

        getNomenclatureItem: builder.query<NomenclatureItem, string>({
            query: (id) => `/nomenclature/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Nomenclature', id }],
        }),

        getStockBalance: builder.query<number, string>({
            query: (nomenclatureId) => `/stock/${nomenclatureId}/balance`,
            providesTags: (_result, _error, id) => [{ type: 'Stock', id }],
        }),

        receiveStock: builder.mutation<StockMovement, { nomenclatureId: string; body: ReceiveStockRequest }>({
            query: ({ nomenclatureId, body }) => ({
                url: `/stock/${nomenclatureId}/receive`,
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, { nomenclatureId }) => [
                { type: 'Stock', id: nomenclatureId },
                { type: 'Stock', id: 'OVERVIEW' },
                { type: 'Stock', id: 'MOVEMENTS' },
                { type: 'Nomenclature', id: nomenclatureId },
                { type: 'Nomenclature', id: 'LIST' },
            ],
        }),

        createWarehouseMaterial: builder.mutation<unknown, CreateWarehouseMaterialRequest>({
            query: (body) => ({
                url: '/materials',
                method: 'POST',
                body,
            }),
            invalidatesTags: [
                'Materials',
                { type: 'Nomenclature', id: 'LIST' },
                { type: 'Stock', id: 'OVERVIEW' },
            ],
        }),

        getRecentStockMovements: builder.query<StockMovement[], number | void>({
            query: (limit = 10) => ({
                url: '/stock/movements/recent',
                params: { limit },
            }),
            providesTags: [{ type: 'Stock', id: 'MOVEMENTS' }],
        }),

        getStockOverview: builder.query<StockOverview, void>({
            query: () => '/stock/overview',
            providesTags: [{ type: 'Stock', id: 'OVERVIEW' }],
        }),

        getInventoryChecks: builder.query<InventoryCheck[], InventoryCheckStatus | void>({
            query: (status) => ({
                url: '/inventory-checks',
                params: status ? { status } : undefined,
            }),
            providesTags: (result) => [
                { type: 'InventoryChecks', id: 'LIST' },
                ...(result ?? []).map(({ id }) => ({ type: 'InventoryChecks' as const, id })),
            ],
        }),

        getInventoryCheck: builder.query<InventoryCheck, string>({
            query: (id) => `/inventory-checks/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'InventoryChecks', id }],
        }),

        createInventoryCheck: builder.mutation<InventoryCheck, CreateInventoryCheckRequest>({
            query: (body) => ({
                url: '/inventory-checks',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'InventoryChecks', id: 'LIST' }],
        }),

        startInventoryCheck: builder.mutation<InventoryCheck, string>({
            query: (id) => ({
                url: `/inventory-checks/${id}/start`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'InventoryChecks', id },
                { type: 'InventoryChecks', id: 'LIST' },
            ],
        }),

        cancelInventoryCheck: builder.mutation<InventoryCheck, string>({
            query: (id) => ({
                url: `/inventory-checks/${id}/cancel`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'InventoryChecks', id },
                { type: 'InventoryChecks', id: 'LIST' },
            ],
        }),

        completeInventoryCheck: builder.mutation<InventoryCheck, string>({
            query: (id) => ({
                url: `/inventory-checks/${id}/complete`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, id) => [
                { type: 'InventoryChecks', id },
                { type: 'InventoryChecks', id: 'LIST' },
                { type: 'Stock', id: 'OVERVIEW' },
                { type: 'Stock', id: 'MOVEMENTS' },
                { type: 'Nomenclature', id: 'LIST' },
            ],
        }),

        updateInventoryItem: builder.mutation<InventoryCheckItem, InventoryItemArgs>({
            query: ({ id, itemId, body }) => ({
                url: `/inventory-checks/${id}/items/${itemId}`,
                method: 'PATCH',
                body,
            }),
            async onQueryStarted({ id, itemId }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        warehouseApi.util.updateQueryData('getInventoryCheck', id, (draft) => {
                            const item = draft.items.find((current) => current.id === itemId);
                            if (item) Object.assign(item, data);
                        })
                    );
                } catch {
                    // Ошибка отображается рядом с формой; кэш остаётся без изменений.
                }
            },
        }),
    }),
});

export const {
    useGetNomenclatureQuery,
    useGetNomenclatureItemQuery,
    useGetStockBalanceQuery,
    useReceiveStockMutation,
    useCreateWarehouseMaterialMutation,
    useGetRecentStockMovementsQuery,
    useGetStockOverviewQuery,
    useGetInventoryChecksQuery,
    useGetInventoryCheckQuery,
    useCreateInventoryCheckMutation,
    useStartInventoryCheckMutation,
    useCancelInventoryCheckMutation,
    useCompleteInventoryCheckMutation,
    useUpdateInventoryItemMutation,
} = warehouseApi;
