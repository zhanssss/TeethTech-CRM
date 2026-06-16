'use client';

import LaboratoryCrudPage from '@/src/components/laboratory/LaboratoryCrudPage';

import {
    useGetWorkTypesQuery,
    useCreateWorkTypeMutation,
    useUpdateWorkTypeMutation,
    useDeleteWorkTypeMutation,
} from '@/src/services/api/laboratory/workTypesApi';

import type {
    CreateWorkTypeDto,
    UpdateWorkTypesDto,
    WorkTypes,
} from '@/src/types/laboratory-types/workTypes.types';

export default function LaboratoryWorkTypesPage() {
    return (
        <LaboratoryCrudPage<WorkTypes, void, CreateWorkTypeDto, UpdateWorkTypesDto>
            pageTitle="Типы работ"
            pageDescription="Управление типами лабораторных работ"
            formTitle="тип работы"
            formDescription="Укажите название и описание типа работы"
            listTitle="Список типов работ"
            emptyTitle="Типов работ пока нет"
            emptyDescription="Добавьте первый тип работы через форму слева"
            useGetQuery={useGetWorkTypesQuery}
            useCreateMutation={useCreateWorkTypeMutation}
            useUpdateMutation={useUpdateWorkTypeMutation}
            useDeleteMutation={useDeleteWorkTypeMutation}
            fields={[
                {
                    name: 'name',
                    label: 'Название',
                    placeholder: 'Коронка',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'description',
                    label: 'Описание',
                    placeholder: 'Описание типа работы',
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
