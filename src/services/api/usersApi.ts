import {teethTechApi} from "@/src/services/teethTechApi"

import type {
    User
} from "@/src/types/user.types"

export const usersApi = teethTechApi.injectEndpoints({
    endpoints: builder =>({
        getUsers: builder.query<User[], void>({
            query: ()=> '/users',
            providesTags: ['Users']
        })
    })
})

export const {
    useGetUsersQuery
} = usersApi;