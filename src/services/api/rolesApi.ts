import { teethTechApi } from '@/src/services/teethTechApi';

import type { Role } from '@/src/types/role.types';

export const rolesApi = teethTechApi.injectEndpoints({
    endpoints: (builder) => ({
        getRoles: builder.query<Role[], void>({
            query: () => '/roles',
            providesTags: ['Roles'],
        }),
    }),
});

export const { useGetRolesQuery } = rolesApi;
