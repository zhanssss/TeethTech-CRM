import {teethTechApi} from '@/src/services/teethTechApi';

import type {
    Colors,
    CreateColors,
    UpdateColors
} from '@/src/types/laboratory-types/colors.types'

export const colorsApi = teethTechApi.injectEndpoints({
    endpoints: (builder) => ({
        getColors: builder.query<Colors[], void>({
            query: () => '/colors',
            providesTags: ["Colors"]
        }),
        createColor: builder.mutation<Colors, CreateColors>({
            query: (body) => ({
                url: '/colors',
                method: 'POST',
                body
            }),
            intal
        })
    })
})

