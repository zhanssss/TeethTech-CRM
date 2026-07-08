import { teethTechApi } from '@/src/services/teethTechApi';
import type {
    CreateInventoryCheckRequest,
    InventoryCheck,
    InventoryCheckItem,
    InventoryCheckItemsPage,
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

type InventoryCheckItemsQueryParams = {
    id: string;
    page?: number;
    size?: number;
    sort?: string | string[];
};

type NomenclatureQueryParams = {
    activeOnly?: boolean;
    page?: number;
    size?: number;
    sort?: string | string[];
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

function getNumberField(source: Record<string, unknown>, key: string, fallback: number) {
    const value = source[key];
    return typeof value === 'number' ? value : fallback;
}

function getBooleanField(source: Record<string, unknown>, key: string, fallback: boolean) {
    const value = source[key];
    return typeof value === 'boolean' ? value : fallback;
}

function getOptionalNumberField(source: Record<string, unknown>, key: string) {
    const value = source[key];
    return typeof value === 'number' ? value : undefined;
}

function normalizeInventoryCheckItemsResponse(response: unknown): InventoryCheckItemsPage {
    const content = getArrayFromResponse<InventoryCheckItem>(response, ['content', 'items']);

    if (!response || typeof response !== 'object' || Array.isArray(response)) {
        return {
            content,
            number: 0,
            size: content.length,
            numberOfElements: content.length,
            first: true,
            last: true,
        };
    }

    const responseRecord = response as Record<string, unknown>;

    return {
        content,
        number: getNumberField(responseRecord, 'number', getNumberField(responseRecord, 'page', 0)),
        size: getNumberField(responseRecord, 'size', content.length),
        numberOfElements: getNumberField(responseRecord, 'numberOfElements', content.length),
        first: getBooleanField(responseRecord, 'first', true),
        last: getBooleanField(responseRecord, 'last', true),
        totalPages: getOptionalNumberField(responseRecord, 'totalPages'),
        totalElements: getOptionalNumberField(responseRecord, 'totalElements'),
    };
}

export const warehouseApi = teethTechApi.injectEndpoints({
    endpoints: (builder) => ({
        getNomenclature: builder.query<NomenclatureItem[], NomenclatureQueryParams | void>({
            query: (params) => ({
                url: '/nomenclature',
                params: params
                    ? Object.fromEntries(
                        Object.entries(params).filter(([, value]) => value !== undefined)
                    )
                    : undefined,
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

        getInventoryCheckItems: builder.query<InventoryCheckItemsPage, InventoryCheckItemsQueryParams>({
            query: ({ id, ...params }) => ({
                url: `/inventory-checks/${id}/items`,
                params: Object.fromEntries(
                    Object.entries(params).filter(([, value]) => value !== undefined)
                ),
            }),
            transformResponse: normalizeInventoryCheckItemsResponse,
            providesTags: (_result, _error, { id }) => [
                { type: 'InventoryChecks', id: `${id}:ITEMS` },
            ],
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
                { type: 'InventoryChecks', id: `${id}:ITEMS` },
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
                { type: 'InventoryChecks', id: `${id}:ITEMS` },
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
                { type: 'InventoryChecks', id: `${id}:ITEMS` },
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
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'InventoryChecks', id: `${id}:ITEMS` },
            ],
            async onQueryStarted({ id, itemId }, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled;
                    dispatch(
                        warehouseApi.util.updateQueryData('getInventoryCheck', id, (draft) => {
                            const item = draft.items.find((current) =>
                                current.id === itemId
                                || current.nomenclatureId === itemId
                                || current.nomenclatureId === data.nomenclatureId
                            );

                            if (item) {
                                Object.assign(item, data);
                            } else {
                                draft.items.push(data);
                            }
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
    useGetInventoryCheckItemsQuery,
    useCreateInventoryCheckMutation,
    useStartInventoryCheckMutation,
    useCancelInventoryCheckMutation,
    useCompleteInventoryCheckMutation,
    useUpdateInventoryItemMutation,
} = warehouseApi;
