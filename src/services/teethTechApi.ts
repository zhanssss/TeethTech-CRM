import {createApi, fetchBaseQuery} from "@reduxjs/toolkit/query/react";
import type {Clinic, CreateClinicDto, ClinicDetailedInfo, UpdateClinicDto} from "@/src/types/clinic.types"

export const teethTechApi = createApi({
    reducerPath: "teethTechApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:8081/api/v1"
    }),
    tagTypes: ["Clinics", "Users", "Colors", "Materials", "WorkTypes"],
    endpoints: () => ({}),
});