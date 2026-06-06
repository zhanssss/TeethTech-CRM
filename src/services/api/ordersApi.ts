import { teethTechApi } from '@/src/services/teethTechApi';

import type {
    CreateOrderDto,
    OrderApiListItem,
    OrderKanbanColumn,
    UpdateTaskStatusArgs,
} from '@/src/types/order.types';

export const ordersApi = teethTechApi.injectEndpoints({
    endpoints: (builder) => ({
        getOrders: builder.query<OrderApiListItem[], void>({
            query: () => '/orders',
            providesTags: ['Orders'],
        }),

        createOrder: builder.mutation<OrderApiListItem, CreateOrderDto>({
            query: (body) => ({
                url: '/orders',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Orders', 'OrderKanban'],
        }),

        deleteOrder: builder.mutation<void, string>({
            query: (id) => ({
                url: `/orders/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Orders', 'OrderKanban'],
        }),

        getOrderKanban: builder.query<OrderKanbanColumn[], string>({
            query: (id) => `/orders/${id}/kanban`,
            providesTags: (_result, _error, id) => [
                'OrderKanban',
                { type: 'OrderKanban', id },
            ],
        }),

        updateTaskStatus: builder.mutation<void, UpdateTaskStatusArgs>({
            query: ({ taskId, body }) => ({
                url: `/tasks/${taskId}/status`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: ['OrderKanban', 'Tasks'],
        }),
    }),
});

export const {
    useGetOrdersQuery,
    useCreateOrderMutation,
    useDeleteOrderMutation,
    useGetOrderKanbanQuery,
    useUpdateTaskStatusMutation,
} = ordersApi;
