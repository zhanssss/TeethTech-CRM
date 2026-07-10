import { teethTechApi } from '@/src/services/teethTechApi';

import type {
    SalaryConfig,
    SalaryStatement,
    SalaryStatementRequest,
    UpsertSalaryConfigRequest,
} from '@/src/types/finance.types';

export const salariesApi = teethTechApi.injectEndpoints({
    endpoints: (builder) => ({
        upsertSalaryConfig: builder.mutation<SalaryConfig, UpsertSalaryConfigRequest>({
            query: (body) => ({
                url: '/salaries/config',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, { userId }) => [
                { type: 'SalaryConfig', id: userId },
            ],
        }),
        getSalaryConfig: builder.query<SalaryConfig, string>({
            query: (userId) => `/salaries/config/${userId}`,
            providesTags: (_result, _error, userId) => [
                { type: 'SalaryConfig', id: userId },
            ],
        }),
        createSalaryStatement: builder.mutation<SalaryStatement, SalaryStatementRequest>({
            query: (body) => ({
                url: '/salaries/statements',
                method: 'POST',
                body,
            }),
            invalidatesTags: (_result, _error, { employeeId }) => [
                { type: 'SalaryConfig', id: employeeId },
                'SalaryStatements',
                'FinanceReport',
            ],
        }),
        confirmSalaryStatement: builder.mutation<void, string>({
            query: (id) => ({
                url: `/salaries/statements/${id}/confirm`,
                method: 'POST',
            }),
            invalidatesTags: ['SalaryStatements', 'FinanceReport'],
        }),
    }),
});

export const {
    useUpsertSalaryConfigMutation,
    useGetSalaryConfigQuery,
    useCreateSalaryStatementMutation,
    useConfirmSalaryStatementMutation,
} = salariesApi;
