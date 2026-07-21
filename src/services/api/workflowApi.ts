import { teethTechApi } from '@/src/services/teethTechApi';

import {
    CreateWorkflowStepRequest, CreateWorkflowWorkTypesDTO, CreateWorkflowWorkTypesResponseDTO,
    GetAvailableWorkflowTransitionsArgs,
    GetWorkflowStepsArgs,
    OrderStatus,
    UpdateOrderStatusArgs,
    UpsertOrderStatusRequest,
    WorkflowStatus,
    WorkflowStep,
    WorkflowTransition,
} from '@/src/types/workflow.types';

export const workflowApi = teethTechApi.injectEndpoints({
    endpoints: (builder) => ({
        getAvailableWorkflowTransitions: builder.query<
            WorkflowTransition[],
            GetAvailableWorkflowTransitionsArgs
        >({
            query: ({ workType, currentStatusId }) => ({
                url: `/workflow/${encodeURIComponent(workType)}/available-transitions/${encodeURIComponent(currentStatusId)}`,
                method: 'GET',
            }),
        }),
        getWorkflowStatuses: builder.query<WorkflowStatus[], void>({
            query: () => ({
                url: '/workflow/statuses',
                method: 'GET',
            }),
            providesTags: ['Workflow'],
        }),
        getAdminWorkflowSteps: builder.query<WorkflowStep[], GetWorkflowStepsArgs>({
            query: ({ workTypeId }) => ({
                url: '/admin/workflow/steps',
                method: 'GET',
                params: { workTypeId },
            }),
            providesTags: ['Workflow'],
        }),
        createAdminWorkflowStep: builder.mutation<WorkflowStep, CreateWorkflowStepRequest>({
            query: (body) => ({
                url: '/admin/workflow/steps',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Workflow'],
        }),
        deleteAdminWorkflowStep: builder.mutation<void, string>({
            query: (id) => ({
                url: `/admin/workflow/steps/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Workflow'],
        }),
        getOrderStatuses: builder.query<OrderStatus[], void>({
            query: () => ({
                url: '/order-statuses',
                method: 'GET',
            }),
            providesTags: ['OrderStatuses'],
        }),
        createOrderStatus: builder.mutation<OrderStatus, UpsertOrderStatusRequest>({
            query: (body) => ({
                url: '/order-statuses',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['OrderStatuses'],
        }),
        updateOrderStatusConfig: builder.mutation<OrderStatus, UpdateOrderStatusArgs>({
            query: ({ id, body }) => ({
                url: `/order-statuses/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['OrderStatuses'],
        }),
        deleteOrderStatus: builder.mutation<void, string>({
            query: (id) => ({
                url: `/order-statuses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['OrderStatuses'],
        }),
        createWorkflowWorkTypes: builder.mutation<CreateWorkflowWorkTypesResponseDTO, CreateWorkflowWorkTypesDTO>({
            query: () =>({
                url: '/admin/workflow/work-types',
                method: 'POST'
            }),
            invalidatesTags: ['Workflow']
        })
    }),
});

export const {
    useGetAvailableWorkflowTransitionsQuery,
    useGetWorkflowStatusesQuery,
    useGetAdminWorkflowStepsQuery,
    useCreateAdminWorkflowStepMutation,
    useDeleteAdminWorkflowStepMutation,
    useGetOrderStatusesQuery,
    useCreateOrderStatusMutation,
    useUpdateOrderStatusConfigMutation,
    useDeleteOrderStatusMutation,
    useCreateWorkflowWorkTypesMutation
} = workflowApi;
