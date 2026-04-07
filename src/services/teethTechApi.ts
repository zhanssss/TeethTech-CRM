// src/lib/services/teethTechApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const teethTechApi = createApi({
    reducerPath: 'teethTechApi',
    // Здесь будет URL твоего Spring Boot бэкенда
    baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:8080/api' }),
    tagTypes: ['Order'],
    endpoints: (builder) => ({
        getOrders: builder.query({
            query: () => '/orders',
            providesTags: ['Order'],
        }),
    }),
});

export const { useGetOrdersQuery } = teethTechApi;