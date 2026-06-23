import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

type AuthState = {
    auth?: {
        token?: string;
    };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081/api/v1";

export const teethTechApi = createApi({
    reducerPath: "teethTechApi",
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as AuthState).auth?.token;

            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }

            return headers;
        },
    }),
    tagTypes: ["Clinics", "Users", "Roles", "Colors", "Materials", "WorkTypes", "Analytics", "Orders", "OrderKanban", "Tasks", "TaskHistory", "TaskFiles"],
    endpoints: () => ({}),
});
