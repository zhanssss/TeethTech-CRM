import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";

export const teethTechApi = createApi({
    reducerPath: "teethTechApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:8081/api/v1"
    }),
    tagTypes: ["Clinics", "Users", "Colors", "Materials", "WorkTypes", "Analytics"],
    endpoints: () => ({}),
});