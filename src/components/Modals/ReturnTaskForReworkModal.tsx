'use client';

import { FormEvent, useId, useMemo, useRef, useState } from 'react';

import Modal from '@/src/components/ui/Modal';
import {
    useGetTaskReworkOptionsQuery,
    useReturnTaskForReworkMutation,
} from '@/src/services/api/tasksReworkApi';
import { useGetStockOverviewQuery } from '@/src/services/api/warehouseApi';
import type { QualityIncidentType } from '@/src/types/task.types';

const INCIDENT_TYPES: Array<{ value: QualityIncidentType; label: string }> = [
    { value: 'REWORK', label: 'Переделка' },
    { value: 'DEFECT', label: 'Брак' },
];

const REASON_CODES = [
    { value: 'QUALITY_DEFECT', label: 'Дефект качества' },
    { value: 'WRONG_SIZE', label: 'Неверный размер' },
    { value: 'WRONG_COLOR', label: 'Неверный цвет' },
    { value: 'DAMAGED', label: 'Повреждение' },
    { value: 'TECHNOLOGY_VIOLATION', label: 'Нарушение технологии' },
    { value: 'OTHER', label: 'Другое' },
];

type ReturnTaskForReworkModalProps = {
    taskId: string;
    onClose: () => void;
    onSuccess: (statusName: string) => void;
};

type StockWriteOffDraft = {
    id: number;
    nomenclatureId: string;
    quantity: string;
};

export default function ReturnTaskForReworkModal({
    taskId,
    onClose,
    onSuccess,
}: ReturnTaskForReworkModalProps) {
    const titleId = useId();
    const [selectedStatusId, setSelectedStatusId] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [incidentType, setIncidentType] = useState<QualityIncidentType | ''>('');
    const [reasonCode, setReasonCode] = useState('');
    const [description, setDescription] = useState('');
    const [materialLossAmount, setMaterialLossAmount] = useState('');
    const [salaryDeductionAmount, setSalaryDeductionAmount] = useState('');
    const [stockWriteOffs, setStockWriteOffs] = useState<StockWriteOffDraft[]>([]);
    const [formError, setFormError] = useState('');
    const nextStockWriteOffId = useRef(1);
    const {
        data: reworkOptions = [],
        error: optionsError,
        isError: isOptionsError,
        isFetching: isOptionsFetching,
        isLoading: isOptionsLoading,
        refetch: refetchOptions,
    } = useGetTaskReworkOptionsQuery(taskId, {
        refetchOnMountOrArgChange: true,
    });
    const stockOverviewQuery = useGetStockOverviewQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });
    const [returnTaskForRework, { isLoading: isSubmitting }] = useReturnTaskForReworkMutation();
    const selectedOption = useMemo(
        () => reworkOptions.find((option) => option.statusId === selectedStatusId),
        [reworkOptions, selectedStatusId]
    );
    const employees = selectedOption?.eligibleAssignees ?? [];
    const stockItems = useMemo(
        () => stockOverviewQuery.data?.items ?? [],
        [stockOverviewQuery.data?.items]
    );
    const stockItemsById = useMemo(
        () => new Map(stockItems.map((item) => [item.nomenclatureId, item])),
        [stockItems]
    );
    const selectedNomenclatureIds = useMemo(
        () => new Set(stockWriteOffs.map((item) => item.nomenclatureId).filter(Boolean)),
        [stockWriteOffs]
    );
    const stockWriteOffValidationError = getStockWriteOffValidationError(stockWriteOffs);
    const isFormValid = Boolean(
        selectedStatusId
        && assignedTo
        && incidentType
        && reasonCode
        && description.trim()
        && !stockWriteOffValidationError
    );

    const handleStatusChange = (statusId: string) => {
        setSelectedStatusId(statusId);
        setAssignedTo('');
        setFormError('');
    };

    const handleAddStockWriteOff = () => {
        setStockWriteOffs((current) => [
            ...current,
            {
                id: nextStockWriteOffId.current++,
                nomenclatureId: '',
                quantity: '',
            },
        ]);
        setFormError('');
    };

    const handleNomenclatureChange = (id: number, nomenclatureId: string) => {
        if (
            nomenclatureId
            && stockWriteOffs.some((item) => item.id !== id && item.nomenclatureId === nomenclatureId)
        ) {
            setFormError('Эта номенклатура уже добавлена в дополнительные материалы.');
            return;
        }

        setStockWriteOffs((current) => current.map((item) => (
            item.id === id ? { ...item, nomenclatureId } : item
        )));
        setFormError('');
    };

    const handleQuantityChange = (id: number, quantity: string) => {
        setStockWriteOffs((current) => current.map((item) => (
            item.id === id ? { ...item, quantity } : item
        )));
        setFormError('');
    };

    const handleRemoveStockWriteOff = (id: number) => {
        setStockWriteOffs((current) => current.filter((item) => item.id !== id));
        setFormError('');
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');

        if (!isFormValid || !selectedOption || !incidentType) {
            setFormError(
                stockWriteOffValidationError
                || 'Заполните этап, ответственного, тип, причину и описание.'
            );
            return;
        }

        if (!employees.some((employee) => employee.userId === assignedTo)) {
            setAssignedTo('');
            setFormError('Выбранный сотрудник больше недоступен для этого этапа.');
            void refetchOptions();
            return;
        }

        try {
            await returnTaskForRework({
                taskId,
                body: {
                    targetStatusId: selectedStatusId,
                    assignedTo,
                    incidentType,
                    reasonCode,
                    description: description.trim(),
                    ...toOptionalAmount('materialLossAmount', materialLossAmount),
                    ...toOptionalAmount('salaryDeductionAmount', salaryDeductionAmount),
                    ...(stockWriteOffs.length > 0
                        ? {
                            stockWriteOffs: stockWriteOffs.map((item) => ({
                                nomenclatureId: item.nomenclatureId,
                                quantity: Number(item.quantity),
                            })),
                        }
                        : {}),
                },
            }).unwrap();

            onSuccess(selectedOption.statusName);
        } catch (error) {
            if (isReworkConflict(error)) {
                setAssignedTo('');
                await refetchOptions();
            }
        }
    };

    return (
        <Modal contentClassName="max-w-3xl p-0">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="flex min-h-0 flex-col"
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
                            Контроль качества
                        </p>
                        <h2 id={titleId} className="mt-1 text-xl font-black text-slate-900">
                            Вернуть задачу на переделку
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Выберите этап, исполнителя и зафиксируйте причину возврата.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Закрыть"
                        className="text-2xl font-bold leading-none text-slate-400 transition hover:text-slate-700 disabled:cursor-wait"
                    >
                        &times;
                    </button>
                </header>

                {isOptionsLoading ? (
                    <div className="space-y-3 p-5 sm:p-6" aria-busy="true">
                        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                        <p className="text-center text-sm font-semibold text-slate-500">
                            Загружаем доступные этапы и сотрудников…
                        </p>
                    </div>
                ) : null}

                {!isOptionsLoading && isOptionsError ? (
                    <div className="p-5 sm:p-6">
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
                            <p className="text-sm font-bold text-red-800">
                                {getApiErrorMessage(optionsError, 'Не удалось получить доступные этапы возврата.')}
                            </p>
                            <button
                                type="button"
                                onClick={() => void refetchOptions()}
                                disabled={isOptionsFetching}
                                className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
                            >
                                {isOptionsFetching ? 'Обновляем…' : 'Повторить'}
                            </button>
                        </div>
                    </div>
                ) : null}

                {!isOptionsLoading && !isOptionsError && reworkOptions.length === 0 ? (
                    <div className="p-5 sm:p-6">
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                            <p className="font-bold text-slate-700">Нет доступных этапов для возврата</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Текущий этап или состояние задачи не допускает переделку.
                            </p>
                        </div>
                    </div>
                ) : null}

                {!isOptionsLoading && !isOptionsError && reworkOptions.length > 0 ? (
                    <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto p-5 sm:p-6">
                        <div className="space-y-5">
                            <Field label="С какого этапа начать исправление?" required>
                                <select
                                    value={selectedStatusId}
                                    onChange={(event) => handleStatusChange(event.target.value)}
                                    className={inputClassName}
                                    required
                                >
                                    <option value="">Выберите этап</option>
                                    {reworkOptions.map((option) => (
                                        <option key={option.statusId} value={option.statusId}>
                                            {option.statusName}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Ответственный" required>
                                <select
                                    value={assignedTo}
                                    onChange={(event) => {
                                        setAssignedTo(event.target.value);
                                        setFormError('');
                                    }}
                                    className={inputClassName}
                                    disabled={!selectedStatusId || employees.length === 0}
                                    required
                                >
                                    <option value="">
                                        {!selectedStatusId ? 'Сначала выберите этап' : 'Выберите сотрудника'}
                                    </option>
                                    {employees.map((employee) => (
                                        <option key={employee.userId} value={employee.userId}>
                                            {employee.fullName}
                                            {employee.isCurrent ? ' — текущий исполнитель' : ''}
                                            {' — '}активных задач: {employee.activeTaskCount}
                                        </option>
                                    ))}
                                </select>
                                {selectedStatusId && employees.length === 0 ? (
                                    <p className="mt-2 text-xs font-bold text-amber-700">
                                        Для этого этапа нет доступных сотрудников
                                    </p>
                                ) : null}
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Тип инцидента" required>
                                    <select
                                        value={incidentType}
                                        onChange={(event) => setIncidentType(event.target.value as QualityIncidentType | '')}
                                        className={inputClassName}
                                        required
                                    >
                                        <option value="">Выберите тип</option>
                                        {INCIDENT_TYPES.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Причина" required>
                                    <select
                                        value={reasonCode}
                                        onChange={(event) => setReasonCode(event.target.value)}
                                        className={inputClassName}
                                        required
                                    >
                                        <option value="">Выберите причину</option>
                                        {REASON_CODES.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </Field>
                            </div>

                            <Field label="Описание проблемы" required>
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder="Опишите дефект и что необходимо исправить"
                                    className={`${inputClassName} min-h-28 resize-y`}
                                    required
                                />
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Материальные потери">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={materialLossAmount}
                                        onChange={(event) => setMaterialLossAmount(event.target.value)}
                                        placeholder="0"
                                        className={inputClassName}
                                    />
                                </Field>

                                <Field label="Удержание">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={salaryDeductionAmount}
                                        onChange={(event) => setSalaryDeductionAmount(event.target.value)}
                                        placeholder="0"
                                        className={inputClassName}
                                    />
                                </Field>
                            </div>

                            <section
                                aria-labelledby={`${titleId}-materials`}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <h3 id={`${titleId}-materials`} className="text-sm font-black text-slate-900">
                                            Дополнительные материалы
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Необязательно. Укажите материалы, которые нужно списать при переделке.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddStockWriteOff}
                                        disabled={
                                            isSubmitting
                                            || stockOverviewQuery.isLoading
                                            || stockOverviewQuery.isError
                                            || stockItems.length === 0
                                            || selectedNomenclatureIds.size >= stockItems.length
                                        }
                                        className="shrink-0 rounded-xl border border-amber-200 bg-white px-3.5 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                                    >
                                        + Добавить позицию
                                    </button>
                                </div>

                                {stockOverviewQuery.isLoading ? (
                                    <p className="mt-4 text-xs font-semibold text-slate-500" aria-live="polite">
                                        Загружаем складские остатки…
                                    </p>
                                ) : null}

                                {stockOverviewQuery.isError ? (
                                    <div className="mt-4 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs font-bold text-red-700">
                                            Не удалось загрузить номенклатуру. Задачу можно вернуть без материалов.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void stockOverviewQuery.refetch()}
                                            disabled={stockOverviewQuery.isFetching}
                                            className="shrink-0 text-xs font-black text-red-700 underline underline-offset-2 disabled:cursor-wait disabled:opacity-60"
                                        >
                                            {stockOverviewQuery.isFetching ? 'Обновляем…' : 'Повторить'}
                                        </button>
                                    </div>
                                ) : null}

                                {!stockOverviewQuery.isLoading
                                    && !stockOverviewQuery.isError
                                    && stockItems.length === 0 ? (
                                        <p className="mt-4 text-xs font-semibold text-slate-500">
                                            На складе пока нет доступных позиций.
                                        </p>
                                    ) : null}

                                {stockWriteOffs.length > 0 ? (
                                    <div className="mt-4 space-y-3">
                                        {stockWriteOffs.map((item, index) => {
                                            const stockItem = stockItemsById.get(item.nomenclatureId);
                                            const quantity = Number(item.quantity);
                                            const hasInvalidQuantity = Boolean(
                                                item.quantity && !isPositiveQuantity(item.quantity)
                                            );
                                            const exceedsCurrentStock = Boolean(
                                                stockItem
                                                && isPositiveQuantity(item.quantity)
                                                && quantity > stockItem.currentQuantity
                                            );

                                            return (
                                                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-xs font-black text-slate-700">
                                                            Позиция {index + 1}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveStockWriteOff(item.id)}
                                                            disabled={isSubmitting}
                                                            aria-label={`Удалить материал ${index + 1}`}
                                                            className="text-xs font-bold text-slate-400 transition hover:text-red-600 disabled:cursor-wait"
                                                        >
                                                            Удалить
                                                        </button>
                                                    </div>

                                                    <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(150px,.38fr)]">
                                                        <label className="block">
                                                            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                                                                Номенклатура <span className="text-red-500">*</span>
                                                            </span>
                                                            <select
                                                                value={item.nomenclatureId}
                                                                onChange={(event) => handleNomenclatureChange(item.id, event.target.value)}
                                                                className={inputClassName}
                                                                required
                                                            >
                                                                <option value="">Выберите позицию</option>
                                                                {stockItems.map((option) => (
                                                                    <option
                                                                        key={option.nomenclatureId}
                                                                        value={option.nomenclatureId}
                                                                        disabled={
                                                                            option.nomenclatureId !== item.nomenclatureId
                                                                            && selectedNomenclatureIds.has(option.nomenclatureId)
                                                                        }
                                                                    >
                                                                        {option.name} — {formatStockQuantity(option.currentQuantity, option.unit)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {stockItem ? (
                                                                <p className="mt-1.5 text-[11px] text-slate-500">
                                                                    Текущий остаток: {formatStockQuantity(stockItem.currentQuantity, stockItem.unit)}
                                                                </p>
                                                            ) : null}
                                                        </label>

                                                        <label className="block">
                                                            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">
                                                                Количество <span className="text-red-500">*</span>
                                                            </span>
                                                            <input
                                                                type="number"
                                                                min="0.000001"
                                                                step="any"
                                                                value={item.quantity}
                                                                onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                                                                placeholder="0"
                                                                className={inputClassName}
                                                                required
                                                            />
                                                            {stockItem ? (
                                                                <p className="mt-1.5 text-[11px] text-slate-500">
                                                                    Единица: {stockItem.unit}
                                                                </p>
                                                            ) : null}
                                                        </label>
                                                    </div>

                                                    {hasInvalidQuantity ? (
                                                        <p className="mt-2 text-xs font-bold text-red-600" role="alert">
                                                            Количество должно быть больше нуля.
                                                        </p>
                                                    ) : null}

                                                    {exceedsCurrentStock ? (
                                                        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800" role="status">
                                                            Количество превышает текущий остаток на складе.
                                                        </p>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-500">
                                        Материалы не добавлены
                                    </p>
                                )}
                            </section>

                            {formError ? (
                                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700" role="alert">
                                    {formError}
                                </p>
                            ) : null}
                        </div>

                        <footer className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={!isFormValid || employees.length === 0 || isSubmitting}
                                className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {isSubmitting ? 'Возвращаем…' : 'Вернуть на переделку'}
                            </button>
                        </footer>
                    </form>
                ) : null}
            </div>
        </Modal>
    );
}

const inputClassName = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';

function Field({
    label,
    required = false,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                {label}{required ? <span className="text-red-500"> *</span> : null}
            </span>
            {children}
        </label>
    );
}

function toOptionalAmount<Key extends 'materialLossAmount' | 'salaryDeductionAmount'>(
    key: Key,
    value: string
): Partial<Record<Key, number>> {
    if (!value.trim()) return {};

    const amount = Number(value);

    return Number.isFinite(amount) && amount >= 0 ? { [key]: amount } as Record<Key, number> : {};
}

function isPositiveQuantity(value: string) {
    if (!value.trim()) return false;

    const quantity = Number(value);

    return Number.isFinite(quantity) && quantity > 0;
}

function getStockWriteOffValidationError(items: StockWriteOffDraft[]) {
    if (items.some((item) => !item.nomenclatureId)) {
        return 'Выберите номенклатуру для каждой позиции дополнительных материалов.';
    }

    if (items.some((item) => !isPositiveQuantity(item.quantity))) {
        return 'Количество дополнительных материалов должно быть больше нуля.';
    }

    const nomenclatureIds = items.map((item) => item.nomenclatureId);

    if (new Set(nomenclatureIds).size !== nomenclatureIds.length) {
        return 'Одну номенклатуру нельзя добавить дважды.';
    }

    return '';
}

function formatStockQuantity(value: number, unit: string) {
    return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 3 })} ${unit}`;
}

function getErrorStatus(error: unknown) {
    if (!isRecord(error)) return undefined;

    return typeof error.status === 'number' ? error.status : undefined;
}

function getApiErrorMessage(error: unknown, fallback = 'Не удалось вернуть задачу на переделку.') {
    const status = getErrorStatus(error);
    const serverMessage = getServerMessage(error);

    if (status === 400) return serverMessage || 'Проверьте обязательные поля и введённые суммы.';
    if (status === 401) return 'Сессия истекла. Войдите в систему повторно.';
    if (status === 403) return 'У вас нет доступа к задаче или этой операции.';
    if (status === 404) return 'Задача, этап, сотрудник или инцидент не найден.';
    if (status === 409) return 'Данные задачи изменились. Этапы и сотрудники обновлены — проверьте выбор.';
    if (status === 500) return 'Внутренняя ошибка сервера. Попробуйте ещё раз позже.';

    return serverMessage || fallback;
}

function isReworkConflict(error: unknown) {
    const status = getErrorStatus(error);

    if (status === 409) return true;
    if (!isRecord(error) || !isRecord(error.data)) return false;

    const code = String(error.data.code ?? error.data.errorCode ?? '').toUpperCase();

    return ['REWORK', 'ASSIGNEE', 'STATUS', 'ROLE', 'CONFLICT'].some((part) => code.includes(part));
}

function getServerMessage(error: unknown) {
    if (!isRecord(error) || !isRecord(error.data)) return '';

    const message = error.data.message ?? error.data.detail ?? error.data.error;

    return typeof message === 'string' ? message : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}
