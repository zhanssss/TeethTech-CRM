import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import type {
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import {logout} from '@/src/features/auth/authSlice';

const API_BASE_URL = "/api/backend";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "same-origin",
});

const baseQueryWithAuth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
        api.dispatch(logout());
    }

    return result;
};

export const teethTechApi = createApi({
    reducerPath: "teethTechApi",
    baseQuery: baseQueryWithAuth,
    tagTypes: [
        "Clinics",
        "Users",
        "Roles",
        "Colors",
        "Materials",
        "WorkTypes",
        "Analytics",
        "Orders",
        "OrderKanban",
        "Tasks",
        "TaskHistory",
        "TaskReworkOptions",
        "QualityIncidents",
        "TaskFiles",
        "TaskAssignment",
        "Nomenclature",
        "Stock",
        "InventoryChecks",
        "FinanceReport",
        "SalaryConfig",
        "SalaryStatements",
        "Workflow",
        "OrderStatuses",
    ],
    endpoints: () => ({}),
});
