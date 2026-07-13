import { teethTechApi } from '@/src/services/teethTechApi';

import type {
    SalaryConfig,
    SalaryEmployee,
    SalaryStatement,
    SalaryStatementRequest,
    SalaryStatementsHistoryRequest,
    SalaryStatementTask,
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
        getSalaryEmployees: builder.query<SalaryEmployee[], void>({
            query: () => ({
                url: '/salaries/employees',
                method: 'GET',
            }),
            providesTags: ['SalaryConfig'],
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
        deleteSalaryStatement: builder.mutation<void, string>({
            query: (id) => ({
                url: `/salaries/statements/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['SalaryStatements', 'FinanceReport'],
        }),
        confirmSalaryStatement: builder.mutation<void, string>({
            query: (id) => ({
                url: `/salaries/statements/${id}/confirm`,
                method: 'POST',
            }),
            invalidatesTags: ['SalaryStatements', 'FinanceReport'],
        }),
        getSalaryStatementTasks: builder.query<SalaryStatementTask[], string>({
            query: (id) => ({
                url: `/salaries/statements/${id}/tasks`,
                method: 'GET',
            }),
            providesTags: ['SalaryStatements'],
        }),
        getSalaryStatementsHistory: builder.query<SalaryStatement[], SalaryStatementsHistoryRequest>({
            query: ({ start, end }) => ({
                url: '/salaries/statements/history',
                method: 'GET',
                params: { start, end },
            }),
            providesTags: ['SalaryStatements'],
        }),
    }),
});

export const {
    useUpsertSalaryConfigMutation,
    useGetSalaryConfigQuery,
    useGetSalaryEmployeesQuery,
    useCreateSalaryStatementMutation,
    useDeleteSalaryStatementMutation,
    useConfirmSalaryStatementMutation,
    useGetSalaryStatementTasksQuery,
    useGetSalaryStatementsHistoryQuery,
} = salariesApi;
