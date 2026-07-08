import { teethTechApi } from '@/src/services/teethTechApi';

import type {
    GetAvailableWorkflowTransitionsArgs,
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
    }),
});

export const {
    useGetAvailableWorkflowTransitionsQuery,
} = workflowApi;
