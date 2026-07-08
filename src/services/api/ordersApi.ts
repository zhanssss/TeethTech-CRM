import { teethTechApi } from '@/src/services/teethTechApi';

import type {
    CreateOrderDto,
    CreateOrderRequest,
    CreateOrderResponse,
    GetOrderKanbanArgs,
    OrderApiListItem,
    OrderDetails,
    OrderGetApiResponse,
    OrderKanbanColumn,
    UpdateOrderArgs,
    UpdateTaskStatusArgs,
} from '@/src/types/order.types';

import type {
    GetOrdersParams
} from '@/src/types/params.types'

import type {
    GetTaskHistoryArgs,
    TaskHistoryResponse,
} from '@/src/types/task.types';

function buildCreateOrderBody(body: CreateOrderDto): CreateOrderRequest {
    return {
        ...body,
        tasks: body.tasks.map(({
            workTypeId,
            quantity,
            toothNumbers,
            orderId,
            colorId,
            materialId,
            pricePerUnit,
            discount,
            discountPercent,
        }) => ({
            workTypeId,
            quantity,
            toothNumbers,
            colorId,
            materialId,
            pricePerUnit,
            discount,
            discountPercent,
            ...(orderId ? { orderId } : {}),
        })),
    };
}

export const ordersApi = teethTechApi.injectEndpoints({
    endpoints: (builder) => ({
        getOrders: builder.query<OrderGetApiResponse, GetOrdersParams>({
            query: ({page, size, sort}) => ({
                url: '/orders',
                method: 'GET',
                params: {
                    page,
                    size,
                    ...(sort? {sort} :{}),
                }
            }),
            providesTags: ['Orders'],
        }),

        getOrder: builder.query<OrderDetails, string>({
            query: (id) => ({
                url: `/orders/${id}`,
                method: 'GET',
            }),
            providesTags: (_result, _error, id) => [
                'Orders',
                {
                    type: 'Orders',
                    id,
                },
            ],
        }),

        createOrder: builder.mutation<CreateOrderResponse, CreateOrderDto>({
            query: (body) => ({
                url: '/orders',
                method: 'POST',
                body: buildCreateOrderBody(body),
            }),
            invalidatesTags: ['Orders', 'OrderKanban'],
        }),

        updateOrder: builder.mutation<OrderApiListItem, UpdateOrderArgs>({
            query: ({ id, body }) => ({
                url: `/orders/${id}`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [
                'Orders',
                'OrderKanban',
                { type: 'OrderKanban', id },
            ],
        }),

        deleteOrder: builder.mutation<void, string>({
            query: (id) => ({
                url: `/orders/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Orders', 'OrderKanban'],
        }),

        getOrderKanban: builder.query<OrderKanbanColumn[], GetOrderKanbanArgs>({
            query: ({ id, userId }) => ({
                url: `/orders/${id}/kanban`,
                method: 'GET',
                params: { userId },
            }),
            providesTags: (_result, _error, { id }) => [
                'OrderKanban',
                { type: 'OrderKanban', id },
            ],
        }),

        updateOrderStatus: builder.mutation<void, string>({
            query: (id) => ({
                url: `/orders/${id}/status`,
                method: 'PATCH',
            }),
            invalidatesTags: (_result, _error, id) => [
                'Orders',
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
            invalidatesTags: (_result, _error, { taskId }) => [
                'OrderKanban',
                'Tasks',
                { type: 'TaskHistory', id: taskId },
            ],
        }),

        getTaskHistory: builder.query<TaskHistoryResponse, GetTaskHistoryArgs>({
            query: ({ taskId, page = 0, size = 20 }) => ({
                url: `/tasks/${taskId}/history`,
                method: 'GET',
                params: {
                    page,
                    size,
                },
            }),
            providesTags: (_result, _error, { taskId }) => [
                { type: 'TaskHistory', id: taskId },
            ],
        }),
    }),
});

export const {
    useGetOrdersQuery,
    useGetOrderQuery,
    useCreateOrderMutation,
    useUpdateOrderMutation,
    useDeleteOrderMutation,
    useGetOrderKanbanQuery,
    useUpdateOrderStatusMutation,
    useUpdateTaskStatusMutation,
    useGetTaskHistoryQuery,
} = ordersApi;
