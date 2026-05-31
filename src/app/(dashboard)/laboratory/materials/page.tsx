'use client';

import LaboratoryCrudPage from '@/src/components/laboratory/LaboratoryCrudPage';

import {
    useGetMaterialsQuery,
    useCreateMaterialMutation,
    useUpdateMaterialMutation,
    useDeleteMaterialMutation,
} from '@/src/services/api/laboratory/materialApi';

import type {
    CreateMaterialDto,
    Material,
    UpdateMaterialDto,
} from '@/src/types/laboratory-types/materials.types';

export default function LaboratoryMaterialsPage() {
    return (
        <LaboratoryCrudPage<Material, void, CreateMaterialDto, UpdateMaterialDto>
            pageTitle="Материалы"
            pageDescription="Управление материалами для лабораторных работ"
            formTitle="материал"
            formDescription="Укажите название и описание материала"
            listTitle="Список материалов"
            emptyTitle="Материалов пока нет"
            emptyDescription="Добавьте первый материал через форму слева"
            useGetQuery={useGetMaterialsQuery}
            useCreateMutation={useCreateMaterialMutation}
            useUpdateMutation={useUpdateMaterialMutation}
            useDeleteMutation={useDeleteMaterialMutation}
            fields={[
                {
                    name: 'name',
                    label: 'Название',
                    placeholder: 'Цирконий',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'description',
                    label: 'Описание',
                    placeholder: 'Описание материала',
                    type: 'textarea',
                },
            ]}
            initialFormState={{
                name: '',
                description: '',
            }}
            getEditForm={(item) => ({
                name: item.name,
                description: item.description || '',
            })}
            getCreateBody={(form) => ({
                name: String(form.name).trim(),
                description: String(form.description).trim(),
            })}
            getUpdateBody={(form) => ({
                name: String(form.name).trim(),
                description: String(form.description).trim(),
            })}
        />
    );
}
