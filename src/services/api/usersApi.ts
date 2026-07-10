import {teethTechApi} from "@/src/services/teethTechApi"

import type {
    User
} from "@/src/types/user.types"

type ChangeUserPasswordArgs = {
    id: string;
    newPassword: string;
};

export const usersApi = teethTechApi.injectEndpoints({
    endpoints: builder =>({
        getUsers: builder.query<User[], void>({
            query: ()=> '/users',
            providesTags: ['Users']
        }),
        changeUserPassword: builder.mutation<void, ChangeUserPasswordArgs>({
            query: ({id, newPassword}) => ({
                url: `/users/${id}/change-password`,
                method: 'POST',
                body: {
                    newPassword,
                },
            }),
        })
    })
})

export const {
    useGetUsersQuery,
    useChangeUserPasswordMutation,
} = usersApi;
