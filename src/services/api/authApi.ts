import {teethTechApi} from "@/src/services/teethTechApi";

import type {
    Login,
    LoginResponse,
    Register,
} from "@/src/types/auth.types"


export const authApi = teethTechApi.injectEndpoints({
    endpoints: builder => ({
        registerUser: builder.mutation<string, Register>({
            query: (body) => ({
               url: '/users',
               method: 'POST',
               body,
            }),
            invalidatesTags: ["Users"]
        }),
        loginUser: builder.mutation<LoginResponse, Login>({
            query: (body) => ({
                url: '/auth/login',
                method: 'POST',
                body
            })
        })
    })
})

export const {
    useRegisterUserMutation,
    useLoginUserMutation
} = authApi;