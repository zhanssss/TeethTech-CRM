'use client';

import React, { FormEvent, useState } from 'react';
import ErrorState from '@/src/components/ui/ErrorState';
import { useNotifications } from '@/src/features/notifications/useNotifications';

type FormValue = string | number | boolean;
type FormState = Record<string, FormValue>;

type FieldConfig = {
    name: string;
    label: string;
    placeholder?: string;
    type: 'text' | 'number' | 'textarea' | 'checkbox';
    required?: boolean;
    min?: number;
    max?: number;
    step?: number | string;
};

type DictionaryItem = {
    id: string;
    name: string;
    code?: string;
    description?: string;
    price?: number;
    isActive?: boolean;
};

type QueryResult<TItem> = {
    data?: TItem[];
    isLoading: boolean;
    isError: boolean;
};

type MutationResult = {
    unwrap: () => Promise<unknown>;
};

type MutationState = {
    isLoading: boolean;
};

type Props<
    TItem extends DictionaryItem,
    TQueryArg = void,
    TCreateBody = unknown,
    TUpdateBody = unknown
> = {
    pageTitle: string;
    pageDescription: string;

    formTitle: string;
    formDescription: string;

    listTitle: string;
    emptyTitle: string;
    emptyDescription: string;

    fields: FieldConfig[];
    initialFormState: FormState;

    useGetQuery: (arg?: TQueryArg) => QueryResult<TItem>;
    queryArg?: TQueryArg;

    useCreateMutation: () => readonly [
        (body: TCreateBody) => MutationResult,
        MutationState
    ];

    useUpdateMutation: () => readonly [
        (args: { id: string; body: TUpdateBody }) => MutationResult,
        MutationState
    ];

    useDeleteMutation: () => readonly [
        (id: string) => MutationResult,
        MutationState
    ];

    getEditForm: (item: TItem) => FormState;
    getCreateBody: (form: FormState) => TCreateBody;
    getUpdateBody: (form: FormState) => TUpdateBody;
};

export default function LaboratoryCrudPage<
    TItem extends DictionaryItem,
    TQueryArg = void,
    TCreateBody = unknown,
    TUpdateBody = unknown
>({
                                                                             pageTitle,
                                                                             pageDescription,
                                                                             formTitle,
                                                                             formDescription,
                                                                             listTitle,
                                                                             emptyTitle,
                                                                             emptyDescription,
                                                                             fields,
                                                                             initialFormState,
                                                                             useGetQuery,
                                                                             queryArg,
                                                                             useCreateMutation,
                                                                             useUpdateMutation,
                                                                             useDeleteMutation,
                                                                             getEditForm,
                                                                             getCreateBody,
                                                                             getUpdateBody,
                                                                         }: Props<TItem, TQueryArg, TCreateBody, TUpdateBody>) {
    const {
        data: items = [],
        isLoading,
        isError,
    } = useGetQuery(queryArg);

    const [createItem, { isLoading: isCreating }] = useCreateMutation();
    const [updateItem, { isLoading: isUpdating }] = useUpdateMutation();
    const [deleteItem, { isLoading: isDeleting }] = useDeleteMutation();

    const [form, setForm] = useState<FormState>(initialFormState);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { notifyError } = useNotifications();

    const isSubmitting = isCreating || isUpdating;

    const handleChange = (fieldName: string, value: FormValue) => {
        setForm((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const hasEmptyRequiredField = fields.some((field) => {
            if (!field.required) return false;

            const value = form[field.name];

            if (typeof value === 'string') return !value.trim();
            if (typeof value === 'number') return !Number.isFinite(value);

            return false;
        });

        if (hasEmptyRequiredField) {
            notifyError('Заполните обязательные поля');
            return;
        }

        try {
            if (editingId) {
                await updateItem({
                    id: editingId,
                    body: getUpdateBody(form),
                }).unwrap();
            } else {
                await createItem(getCreateBody(form)).unwrap();
            }

            setForm(initialFormState);
            setEditingId(null);
        } catch {
            // API errors are displayed by the global notification handler.
        }
    };

    const handleEdit = (item: TItem) => {
        setEditingId(item.id);
        setForm(getEditForm(item));
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(initialFormState);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteItem(id).unwrap();

            if (editingId === id) {
                handleCancelEdit();
            }
        } catch {
            // API errors are displayed by the global notification handler.
        }
    };

    return (
        <>
            <section className="min-h-full w-full bg-slate-50 p-0 sm:p-4 lg:p-6">
            <div className="mb-4 rounded-2xl bg-white px-4 py-4 shadow-sm sm:mb-6 sm:px-6 sm:py-5">
                <h1 className="text-2xl font-semibold text-slate-900">
                    {pageTitle}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    {pageDescription}
                </p>
            </div>

            <section className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(18rem,420px)_1fr]">
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingId ? `Редактировать: ${formTitle}` : formTitle}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {formDescription}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
                        {fields.map((field) => {
                            const value = form[field.name];

                            if (field.type === 'textarea') {
                                return (
                                    <div key={field.name} className="flex flex-col gap-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">
                                            {field.label}
                                        </label>

                                        <textarea
                                            value={String(value ?? '')}
                                            onChange={(event) =>
                                                handleChange(field.name, event.target.value)
                                            }
                                            placeholder={field.placeholder}
                                            rows={4}
                                            className="resize-none rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                );
                            }

                            if (field.type === 'checkbox') {
                                return (
                                    <label
                                        key={field.name}
                                        className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-100 px-4 py-3"
                                    >
                                        <span className="text-sm font-medium text-slate-700">
                                            {field.label}
                                        </span>

                                        <input
                                            type="checkbox"
                                            checked={Boolean(value)}
                                            onChange={(event) =>
                                                handleChange(field.name, event.target.checked)
                                            }
                                            className="h-4 w-4 cursor-pointer"
                                        />
                                    </label>
                                );
                            }

                            return (
                                <div key={field.name} className="flex flex-col gap-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">
                                        {field.label}
                                    </label>

                                    <input
                                        type={field.type === 'number' ? 'number' : 'text'}
                                        min={field.min}
                                        max={field.max}
                                        step={field.step}
                                        value={String(value ?? '')}
                                        onChange={(event) =>
                                            handleChange(
                                                field.name,
                                                field.type === 'number' && event.target.value !== ''
                                                    ? Number(event.target.value)
                                                    : event.target.value
                                            )
                                        }
                                        placeholder={field.placeholder}
                                        className="h-11 rounded-xl bg-slate-100 px-4 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            );
                        })}

                        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-11 flex-1 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                            >
                                {editingId ? 'Сохранить' : 'Добавить'}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="h-11 rounded-xl bg-slate-100 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                                >
                                    Отмена
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                {listTitle}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Всего: {items.length}
                            </p>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="rounded-2xl bg-slate-100 px-4 py-8 text-center text-sm text-slate-500">
                            Загрузка...
                        </div>
                    )}

                    {isError && (
                        <ErrorState compact>
                            Не удалось загрузить данные
                        </ErrorState>
                    )}

                    {!isLoading && !isError && items.length === 0 && (
                        <div className="rounded-2xl bg-slate-100 px-4 py-10 text-center">
                            <h3 className="text-sm font-medium text-slate-700">
                                {emptyTitle}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                {emptyDescription}
                            </p>
                        </div>
                    )}

                    {!isLoading && !isError && items.length > 0 && (
                        <div className="grid max-h-[70dvh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:max-h-[620px]">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="mb-2 flex items-center gap-2">
                                                {item.code && (
                                                    <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                                                        {item.code}
                                                    </span>
                                                )}

                                                {typeof item.isActive === 'boolean' && (
                                                    <span
                                                        className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                                                            item.isActive
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}
                                                    >
                                                        {item.isActive ? 'Активный' : 'Неактивный'}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-base font-semibold text-slate-900">
                                                {item.name}
                                            </h3>

                                            {item.description && (
                                                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                                    {item.description}
                                                </p>
                                            )}

                                            {typeof item.price === 'number' && Number.isFinite(item.price) && (
                                                <p className="mt-2 text-sm font-bold text-slate-700">
                                                    Цена: {item.price.toLocaleString('ru-RU')} ₸
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(item)}
                                                className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
                                            >
                                                Изменить
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item.id)}
                                                disabled={isDeleting}
                                                className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
            </section>
        </>
    );
}
