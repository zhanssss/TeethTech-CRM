import {teethTechApi} from "@/src/services/teethTechApi";

import type {
    Clinic,
    CreateClinicDto,
    ClinicDetailedInfo,
    UpdateClinicDto
} from '@/src/types/clinic.types'

export const clinicsApi = teethTechApi.injectEndpoints({
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
        }),
        deleteClinic: builder.mutation<void, string>({
            query: (id) => ({
                url: `/clinics/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ["Clinics"],
        })
    })
})

export const {
    useGetClinicsQuery,
    useGetClinicsByIdQuery,
    useCreateClinicMutation,
    useUpdateClinicMutation,
    useDeleteClinicMutation,
} = clinicsApi;
