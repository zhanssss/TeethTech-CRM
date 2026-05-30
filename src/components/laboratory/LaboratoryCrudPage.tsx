'use client';

import React, { FormEvent, useState } from 'react';

type FormValue = string | boolean;
type FormState = Record<string, FormValue>;

type FieldConfig = {
    name: string;
    label: string;
    placeholder?: string;
    type: 'text' | 'textarea' | 'checkbox';
    required?: boolean;
};

type DictionaryItem = {
    id: string;
    name: string;
    code?: string;
    description?: string;
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

type Props<TItem extends DictionaryItem> = {
    pageTitle: string;
    pageDescription: string;

    formTitle: string;
    formDescription: string;

    listTitle: string;
    emptyTitle: string;
    emptyDescription: string;

    fields: FieldConfig[];
    initialFormState: FormState;

    useGetQuery: (arg?: any) => QueryResult<TItem>;
    queryArg?: any;

    useCreateMutation: () => [
        (body: any) => MutationResult,
        MutationState
    ];

    useUpdateMutation: () => [
        (args: { id: string; body: any }) => MutationResult,
        MutationState
    ];

    useDeleteMutation: () => [
        (id: string) => MutationResult,
        MutationState
    ];

    getEditForm: (item: TItem) => FormState;
    getCreateBody: (form: FormState) => any;
    getUpdateBody: (form: FormState) => any;
};

export default function LaboratoryCrudPage<TItem extends DictionaryItem>({
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
                                                                         }: Props<TItem>) {
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
    const [errorMessage, setErrorMessage] = useState('');

    const isSubmitting = isCreating || isUpdating;

    const handleChange = (fieldName: string, value: FormValue) => {
        setForm((prev) => ({
            ...prev,
            [fieldName]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage('');

        const hasEmptyRequiredField = fields.some((field) => {
            if (!field.required) return false;

            const value = form[field.name];

            return typeof value === 'string' && !value.trim();
        });

        if (hasEmptyRequiredField) {
            setErrorMessage('Заполните обязательные поля');
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
            setErrorMessage('Не удалось сохранить данные');
        }
    };

    const handleEdit = (item: TItem) => {
        setEditingId(item.id);
        setForm(getEditForm(item));
        setErrorMessage('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(initialFormState);
        setErrorMessage('');
    };

    const handleDelete = async (id: string) => {
        setErrorMessage('');

        try {
            await deleteItem(id).unwrap();

            if (editingId === id) {
                handleCancelEdit();
            }
        } catch {
            setErrorMessage('Не удалось удалить запись');
        }
    };

    return (
        <section className="min-h-full w-full bg-slate-50 p-6">
            <div className="mb-6 rounded-2xl bg-white px-6 py-5 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">
                    {pageTitle}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    {pageDescription}
                </p>
            </div>

            <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
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
                                            value={String(value || '')}
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
                                        value={String(value || '')}
                                        onChange={(event) =>
                                            handleChange(field.name, event.target.value)
                                        }
                                        placeholder={field.placeholder}
                                        className="h-11 rounded-xl bg-slate-100 px-4 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            );
                        })}

                        {errorMessage && (
                            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                                {errorMessage}
                            </p>
                        )}

                        <div className="flex gap-3 pt-2">
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

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
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
                        <div className="rounded-2xl bg-red-50 px-4 py-8 text-center text-sm text-red-600">
                            Не удалось загрузить данные
                        </div>
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
                        <div className="grid max-h-[620px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
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
                                        </div>

                                        <div className="flex shrink-0 gap-2">
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
    );
}