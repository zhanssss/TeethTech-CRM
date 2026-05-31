'use client';

import LaboratoryCrudPage from '@/src/components/laboratory/LaboratoryCrudPage';

import {
    useGetColorsQuery,
    useCreateColorMutation,
    useUpdateColorMutation,
    useDeleteColorMutation,
} from '@/src/services/api/laboratory/colorsApi';

import type {
    Color,
    CreateColorDto,
    UpdateColorDto,
} from '@/src/types/laboratory-types/colors.types';

export default function LaboratoryColorsPage() {
    return (
        <LaboratoryCrudPage<Color, boolean | void, CreateColorDto, UpdateColorDto>
            pageTitle="Цвета"
            pageDescription="Управление цветами для лабораторных заказов"
            formTitle="цвет"
            formDescription="Укажите код, название и статус цвета"
            listTitle="Список цветов"
            emptyTitle="Цветов пока нет"
            emptyDescription="Добавьте первый цвет через форму слева"
            useGetQuery={useGetColorsQuery}
            queryArg={false}
            useCreateMutation={useCreateColorMutation}
            useUpdateMutation={useUpdateColorMutation}
            useDeleteMutation={useDeleteColorMutation}
            fields={[
                {
                    name: 'code',
                    label: 'Код цвета',
                    placeholder: 'A1',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'name',
                    label: 'Название',
                    placeholder: 'Белый',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'isActive',
                    label: 'Активный цвет',
                    type: 'checkbox',
                },
            ]}
            initialFormState={{
                code: '',
                name: '',
                isActive: true,
            }}
            getEditForm={(item) => ({
                code: item.code,
                name: item.name,
                isActive: item.isActive,
            })}
            getCreateBody={(form) => ({
                code: String(form.code).trim(),
                name: String(form.name).trim(),
                isActive: Boolean(form.isActive),
            })}
            getUpdateBody={(form) => ({
                code: String(form.code).trim(),
                name: String(form.name).trim(),
                isActive: Boolean(form.isActive),
            })}
        />
    );
}
