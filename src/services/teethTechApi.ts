import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import type {Clinic, CreateClinicDto, ClinicDetailedInfo, UpdateClinicDto} from "@/src/types/clinic.types"

export const teethTechApi = createApi({
    reducerPath: "teethTechApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:8081/api/v1"
    }),
    tagTypes: ["Clinics"],
    endpoints: (builder) => ({
        getClinics: builder.query<Clinic[], void>({
            query: () => '/clinics',

            providesTags: ["Clinics"],
        }),
        getClinicsById: builder.query<ClinicDetailedInfo, string>({
            query: (id) => `/clinics/${id}`,
            providesTags: (_result, _error, id) => [
                {
                    type: "Clinics",
                    id
                }
            ]
        }),
        updateClinic: builder.mutation<
            ClinicDetailedInfo,
            {
                id: string;
                body: UpdateClinicDto;
            }>({
            query: ({id, body}) => ({
                url: `/clinics/${id}`,
                method: "PATCH",
                body,
            }),

            invalidatesTags: (_result,_error,{id}) => ["Clinics", {
                type: "Clinics",
                id
            }]
        }),
        createClinic: builder.mutation<Clinic, CreateClinicDto>({
            query: (body) => ({
                url: '/clinics',
                method: 'POST',
                body,
            }),
            invalidatesTags: ["Clinics"],
        })
    }),
});

export const {
    useGetClinicsQuery,
    useGetClinicsByIdQuery,
    useCreateClinicMutation,
    useUpdateClinicMutation
} = teethTechApi;
