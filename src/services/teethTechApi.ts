import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import type {
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

import {logout} from '@/src/features/auth/authSlice';
import {enqueueNotification} from '@/src/features/notifications/notificationsSlice';
import {
    getApiErrorMessage,
    getApiSuccessMessage,
    shouldNotifyApiError,
} from '@/src/services/apiNotifications';

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
    const method = (
        typeof args === 'string' ? 'GET' : args.method ?? 'GET'
    ).toUpperCase();

    if (result.error?.status === 401) {
        api.dispatch(logout());
    }

    if (result.error && shouldNotifyApiError(api.endpoint)) {
        api.dispatch(
            enqueueNotification({
                tone: 'error',
                message: getApiErrorMessage(result.error, api.endpoint),
            })
        );
    } else if (!result.error && api.type === 'mutation') {
        const message = getApiSuccessMessage(api.endpoint, method);

        if (message) {
            api.dispatch(
                enqueueNotification({
                    tone: 'success',
                    message,
                })
            );
        }
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
        "ProcurementOrders",
        "ProcurementSuppliers",
        "FinanceReport",
        "SalaryConfig",
        "SalaryStatements",
        "Invoices",
        "InvoicePayments",
        "PendingInvoicing",
        "BillingSummary",
        "Workflow",
        "OrderStatuses",
    ],
    endpoints: () => ({}),
});
