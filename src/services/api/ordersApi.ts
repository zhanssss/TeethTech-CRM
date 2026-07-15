import { teethTechApi } from '@/src/services/teethTechApi';

import {
    AddTaskDto,
    AssignTaskArgs,
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
    EmployeeKanbanResponse,
    GetOrderEmployeeKanbanArgs,
    GetTaskHistoryArgs,
    TaskAssignment,
    TaskHistoryResponse,
    UpdateTaskAssignmentArgs,
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
            discountPercent,
            assignmentMode,
            statusAssignees,
        }) => ({
            workTypeId,
            quantity,
            toothNumbers,
            colorId,
            materialId,
            pricePerUnit,
            discountPercent,
            assignmentMode,
            statusAssignees,
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

        assignTask: builder.mutation<void, AssignTaskArgs>({
            query: ({ taskId, userId }) => ({
                url: `/tasks/${taskId}/assign/${userId}`,
                method: 'PATCH',
            }),
            invalidatesTags: (_result, _error, { taskId, orderId }) => [
                'Tasks',
                { type: 'OrderKanban', id: orderId },
                { type: 'TaskHistory', id: taskId },
            ],
        }),

        getTaskAssignment: builder.query<TaskAssignment, string>({
            query: (taskId) => ({
                url: `/tasks/${taskId}/assignment`,
                method: 'GET',
            }),
            providesTags: (_result, _error, taskId) => [
                { type: 'TaskAssignment', id: taskId },
            ],
        }),

        updateTaskAssignment: builder.mutation<TaskAssignment, UpdateTaskAssignmentArgs>({
            query: ({ taskId, body }) => ({
                url: `/tasks/${taskId}/assignment`,
                method: 'PATCH',
                body,
            }),
            invalidatesTags: (_result, _error, { taskId }) => [
                'Tasks',
                'OrderKanban',
                { type: 'TaskAssignment', id: taskId },
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
        addTask: builder.mutation<string, AddTaskDto>({
            query: (body) => ({
                url: '/tasks',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, { orderId }) => [
                'Orders',
                'OrderKanban',
                'Tasks',
                { type: 'OrderKanban', id: orderId },
            ],
        }),
        getMyTasksKanban: builder.query<EmployeeKanbanResponse, void>({
            query: () => ({
                url: '/tasks/kanban/my',
                method: 'GET',
            }),
            providesTags: ['Tasks'],
        }),
        getOrderEmployeeKanban: builder.query<EmployeeKanbanResponse, GetOrderEmployeeKanbanArgs>({
            query: ({ orderId }) => ({
                url: `/tasks/order/${orderId}/kanban/employee`,
                method: 'GET',
            }),
            providesTags: (_result, _error, { orderId }) => [
                'Tasks',
                { type: 'OrderKanban', id: orderId },
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
    useAssignTaskMutation,
    useGetTaskAssignmentQuery,
    useUpdateTaskAssignmentMutation,
    useGetTaskHistoryQuery,
    useAddTaskMutation,
    useGetMyTasksKanbanQuery,
    useGetOrderEmployeeKanbanQuery,
} = ordersApi;
