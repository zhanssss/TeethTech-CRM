'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';

import Modal from '@/src/components/ui/Modal';
import {
    useCancelInventoryCheckMutation,
    useCompleteInventoryCheckMutation,
    useCreateInventoryCheckMutation,
    useGetInventoryCheckItemsQuery,
    useGetInventoryCheckQuery,
    useGetInventoryChecksQuery,
    useGetInventoryStatusRulesQuery,
    useStartInventoryCheckMutation,
    useUpdateInventoryItemMutation,
} from '@/src/services/api/warehouseApi';
import type {
    InventoryCheck,
    InventoryCheckItem,
    InventoryCheckStatus,
    InventoryStatusRule,
} from '@/src/types/warehouse.types';
import {
    formatDateTime,
    formatQuantity,
    getApiErrorMessage,
    getInventoryStatusClasses,
    getInventoryStatusLabel,
    shortId,
} from './warehouseUtils';

const fallbackFilters: Array<{ value: '' | InventoryCheckStatus; label: string }> = [
    { value: '', label: 'Все статусы' },
    { value: 'DRAFT', label: 'Черновики' },
    { value: 'IN_PROGRESS', label: 'В работе' },
    { value: 'COMPLETED', label: 'Завершённые' },
    { value: 'CANCELLED', label: 'Отменённые' },
];

const INVENTORY_ITEMS_PAGE_SIZE = 1000;

type Confirmation = 'cancel' | 'complete' | null;

type InventoryDisplayItem = InventoryCheckItem;

function parseQuantityInput(value: string | undefined) {
    if (value === undefined || value.trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function isInitialInventory(check: InventoryCheck, rule?: InventoryStatusRule) {
    return rule?.initial
        ?? (check.statusCode === 'DRAFT' || (!check.startedAt && !check.completedAt));
}

function allowsInventoryCounting(check: InventoryCheck, rule?: InventoryStatusRule) {
    return rule?.allowsCounting
        ?? (check.statusCode === 'IN_PROGRESS' || (Boolean(check.startedAt) && !check.completedAt));
}

function isTerminalInventory(check: InventoryCheck, rule?: InventoryStatusRule) {
    return rule?.terminal
        ?? (check.statusCode === 'COMPLETED' || check.statusCode === 'CANCELLED' || Boolean(check.completedAt));
}

export default function InventoryPanel() {
    const [filter, setFilter] = useState<'' | InventoryCheckStatus>('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [comment, setComment] = useState('');
    const [createError, setCreateError] = useState('');
    const [actionError, setActionError] = useState('');
    const [confirmation, setConfirmation] = useState<Confirmation>(null);
    const [counts, setCounts] = useState<Record<string, string>>({});
    const [savingItemId, setSavingItemId] = useState<string | null>(null);
    const [savedItemId, setSavedItemId] = useState<string | null>(null);

    const listQuery = useGetInventoryChecksQuery(filter || undefined);
    const statusRulesQuery = useGetInventoryStatusRulesQuery();
    const detailQuery = useGetInventoryCheckQuery(selectedId ?? '', { skip: !selectedId });
    const itemsQuery = useGetInventoryCheckItemsQuery(
        { id: selectedId ?? '', page: 0, size: INVENTORY_ITEMS_PAGE_SIZE },
        { skip: !selectedId }
    );
    const check = detailQuery.data;
    const [createCheck, createState] = useCreateInventoryCheckMutation();
    const [startCheck, startState] = useStartInventoryCheckMutation();
    const [cancelCheck, cancelState] = useCancelInventoryCheckMutation();
    const [completeCheck, completeState] = useCompleteInventoryCheckMutation();
    const [updateItem] = useUpdateInventoryItemMutation();

    const checks = listQuery.data ?? [];
    const statusRules = statusRulesQuery.data;
    const statusRulesByCode = useMemo(
        () => new Map((statusRules ?? []).map((rule) => [rule.code, rule])),
        [statusRules]
    );
    const filters = useMemo<Array<{ value: '' | InventoryCheckStatus; label: string }>>(
        () => statusRules && statusRules.length > 0
            ? [
                { value: '', label: 'Все статусы' },
                ...statusRules.map((rule) => ({ value: rule.code, label: rule.name || rule.code })),
            ]
            : fallbackFilters,
        [statusRules]
    );
    const itemsPage = itemsQuery.data;
    const displayItems = useMemo<InventoryDisplayItem[]>(
        () => itemsPage?.content ?? [],
        [itemsPage?.content]
    );
    const activeCheck = checks.find(
        (item) => !isTerminalInventory(item, statusRulesByCode.get(item.statusCode))
    );
    const checkStatusRule = check ? statusRulesByCode.get(check.statusCode) : undefined;
    const checkIsInitial = check ? isInitialInventory(check, checkStatusRule) : false;
    const checkAllowsCounting = check ? allowsInventoryCounting(check, checkStatusRule) : false;
    const checkIsTerminal = check ? isTerminalInventory(check, checkStatusRule) : false;
    const checkLocksWarehouse = checkStatusRule?.locksWarehouse ?? checkAllowsCounting;
    const actionLoading = startState.isLoading || cancelState.isLoading || completeState.isLoading;
    const inventoryItemsFetching = itemsQuery.isFetching;
    const inventoryRowsLoading = inventoryItemsFetching && displayItems.length === 0;

    useEffect(() => {
        if (!check) return;
        setCounts((current) => Object.fromEntries(
            displayItems.map((item) => [
                item.id,
                item.actualQuantity === null || item.actualQuantity === undefined
                    ? current[item.id] ?? ''
                    : String(item.actualQuantity),
            ])
        ));
    }, [check, displayItems]);

    const progress = useMemo(() => {
        if (!check) return { counted: 0, total: 0, percent: 0 };
        const counted = displayItems.filter(
            (item) => item.actualQuantity !== null && item.actualQuantity !== undefined
        ).length;
        const total = displayItems.length;
        return { counted, total, percent: total === 0 ? 0 : Math.round((counted / total) * 100) };
    }, [check, displayItems]);
    const completeDisabled = actionLoading
        || inventoryItemsFetching
        || itemsPage?.last === false
        || progress.total === 0
        || progress.counted !== progress.total;
    const completeTitle = inventoryItemsFetching
        ? 'Дождитесь загрузки позиций'
        : itemsPage?.last === false
            ? 'Загружены не все позиции инвентаризации'
        : progress.total === 0
            ? 'Нет позиций для пересчёта'
            : progress.counted !== progress.total
                ? 'Сначала пересчитайте все позиции'
                : undefined;

    const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCreateError('');
        if (!comment.trim()) {
            setCreateError('Добавьте комментарий, чтобы инвентаризацию было легко найти в истории');
            return;
        }

        try {
            const created = await createCheck({ comment: comment.trim() }).unwrap();
            setCreateOpen(false);
            setComment('');
            setSelectedId(created.id);
        } catch {
            // API errors are displayed by the global notification handler.
        }
    };

    const runStart = async () => {
        if (!selectedId) return;
        setActionError('');
        try {
            await startCheck(selectedId).unwrap();
        } catch {
            // API errors are displayed by the global notification handler.
        }
    };

    const runConfirmedAction = async () => {
        if (!selectedId || !confirmation) return;
        setActionError('');
        try {
            if (confirmation === 'cancel') {
                await cancelCheck(selectedId).unwrap();
            } else {
                await completeCheck(selectedId).unwrap();
            }
            setConfirmation(null);
        } catch {
            setConfirmation(null);
        }
    };

    const saveCount = async (itemId: string) => {
        if (!selectedId) return;
        const value = parseQuantityInput(counts[itemId]);
        setActionError('');
        setSavedItemId(null);
        if (value === null || value < 0) {
            setActionError('Фактическое количество должно быть числом не меньше нуля');
            return;
        }

        setSavingItemId(itemId);
        try {
            const savedItem = await updateItem({ id: selectedId, itemId, body: { actualQuantity: value } }).unwrap();
            setSavedItemId(savedItem?.id || itemId);
        } catch {
            // API errors are displayed by the global notification handler.
        } finally {
            setSavingItemId(null);
        }
    };

    if (selectedId) {
        return (
            <div className="space-y-5">
                <button
                    type="button"
                    onClick={() => {
                        setSelectedId(null);
                        setActionError('');
                    }}
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"
                >
                    <span aria-hidden="true">←</span> К списку инвентаризаций
                </button>

                {detailQuery.isLoading && (
                    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center text-sm text-slate-500">
                        Загружаем инвентаризацию…
                    </div>
                )}

                {detailQuery.isError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {getApiErrorMessage(detailQuery.error, 'Инвентаризация не найдена')}
                    </div>
                )}

                {check && (
                    <>
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getInventoryStatusClasses(check.statusCode, checkStatusRule)}`}>
                                            {getInventoryStatusLabel(check.statusCode, checkStatusRule)}
                                        </span>
                                        <span className="font-mono text-xs font-bold text-slate-400">#{shortId(check.id)}</span>
                                    </div>
                                    <h2 className="mt-3 text-xl font-black text-slate-900">
                                        {check.comment || 'Инвентаризация без комментария'}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {check.startedAt ? `Начата ${formatDateTime(check.startedAt)}` : 'Ещё не начата'} · {displayItems.length} позиций
                                    </p>
                                    {checkIsTerminal && check.completedAt && (
                                        <p className="mt-1 text-xs text-slate-400">Закрыта {formatDateTime(check.completedAt)}</p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {checkIsInitial && !checkIsTerminal && (
                                        <button
                                            type="button"
                                            onClick={runStart}
                                            disabled={actionLoading}
                                            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
                                        >
                                            {startState.isLoading ? 'Запускаем…' : 'Начать пересчёт'}
                                        </button>
                                    )}
                                    {!checkIsTerminal && (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmation('cancel')}
                                            disabled={actionLoading}
                                            className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                                        >
                                            Отменить
                                        </button>
                                    )}
                                    {checkAllowsCounting && !checkIsTerminal && (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmation('complete')}
                                            disabled={completeDisabled}
                                            title={completeTitle}
                                            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                        >
                                            Завершить и применить
                                        </button>
                                    )}
                                </div>
                            </div>

                            {checkAllowsCounting && !checkIsTerminal && (
                                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                                        <span>Пересчитано {progress.counted} из {progress.total}</span>
                                        <span>{progress.percent}%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                            className="h-full rounded-full bg-blue-600 transition-all"
                                            style={{ width: `${progress.percent}%` }}
                                        />
                                    </div>
                                    {checkLocksWarehouse && (
                                        <p className="mt-2 text-xs text-slate-500">
                                            Обычные операции списания и возврата заблокированы до завершения или отмены.
                                        </p>
                                    )}
                                </div>
                            )}

                            {actionError && (
                                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {actionError}
                                </div>
                            )}
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-5 py-4">
                                <h3 className="font-bold text-slate-900">Позиции для пересчёта</h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    {checkAllowsCounting && !checkIsTerminal
                                        ? 'Введите фактическое количество: расхождение посчитается от системного остатка'
                                        : 'Зафиксированный снимок остатков на момент создания'}
                                </p>
                            </div>

                            {itemsQuery.isError && displayItems.length === 0 && (
                                <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {getApiErrorMessage(itemsQuery.error, 'Не удалось загрузить позиции инвентаризации')}
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] text-left">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="px-5 py-3 font-bold">Номенклатура</th>
                                            <th className="px-5 py-3 font-bold">По системе</th>
                                            <th className="px-5 py-3 font-bold">Фактически</th>
                                            <th className="px-5 py-3 font-bold">Расхождение</th>
                                            <th className="px-5 py-3 text-right font-bold">Сохранение</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {displayItems.map((item) => {
                                            const typedActualQuantity = checkAllowsCounting && !checkIsTerminal
                                                ? parseQuantityInput(counts[item.id])
                                                : item.actualQuantity;
                                            const hasActualQuantity = typedActualQuantity !== null && typedActualQuantity !== undefined;
                                            const savedCounted = item.actualQuantity !== null && item.actualQuantity !== undefined;
                                            const discrepancy = hasActualQuantity
                                                ? typedActualQuantity - item.expectedQuantity
                                                : item.discrepancy ?? 0;
                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/70">
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-bold text-slate-900">{item.nomenclatureName}</p>
                                                        <p className="mt-0.5 text-xs text-slate-400">Единица: {item.unit}</p>
                                                    </td>
                                                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                                        {formatQuantity(item.expectedQuantity, item.unit)}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {checkAllowsCounting && !checkIsTerminal ? (
                                                            <div className="relative w-36">
                                                                <input
                                                                    aria-label={`Фактическое количество: ${item.nomenclatureName}`}
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.001"
                                                                    value={counts[item.id] ?? ''}
                                                                    onChange={(event) => {
                                                                        setCounts((current) => ({ ...current, [item.id]: event.target.value }));
                                                                        setSavedItemId(null);
                                                                    }}
                                                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm font-bold outline-none focus:border-blue-500"
                                                                />
                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{item.unit}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm font-semibold text-slate-700">
                                                                {formatQuantity(item.actualQuantity, item.unit)}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={`px-5 py-4 text-sm font-black ${discrepancy > 0 ? 'text-emerald-600' : discrepancy < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {hasActualQuantity ? `${discrepancy > 0 ? '+' : ''}${formatQuantity(discrepancy, item.unit)}` : '—'}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        {checkAllowsCounting && !checkIsTerminal ? (
                                                            <div className="inline-flex items-center gap-2">
                                                                {savedItemId === item.id && (
                                                                    <span className="text-xs font-bold text-emerald-600">Сохранено</span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => saveCount(item.id)}
                                                                    disabled={savingItemId !== null || (counts[item.id] ?? '').trim() === ''}
                                                                    className="rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                                                >
                                                                    {savingItemId === item.id ? 'Сохраняем…' : 'Сохранить'}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className={`text-xs font-bold ${savedCounted ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                                {savedCounted ? 'Пересчитано' : 'Не пересчитано'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {inventoryRowsLoading && (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                                                    Загружаем позиции инвентаризации…
                                                </td>
                                            </tr>
                                        )}
                                        {!inventoryRowsLoading && displayItems.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">
                                                    Нет позиций для пересчёта
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

                {confirmation && check && (
                    <Modal contentClassName="max-w-lg p-5 sm:p-6">
                        <div role="alertdialog" aria-modal="true">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-full text-xl font-black ${confirmation === 'cancel' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                {confirmation === 'cancel' ? '!' : '✓'}
                            </div>
                            <h2 className="mt-4 text-lg font-bold text-slate-900">
                                {confirmation === 'cancel' ? 'Отменить инвентаризацию?' : 'Завершить инвентаризацию?'}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {confirmation === 'cancel'
                                    ? 'Склад будет разблокирован, введённые результаты не изменят остатки.'
                                    : 'Все расхождения будут применены как корректировки остатков. Это изменит текущие балансы склада.'}
                            </p>
                            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setConfirmation(null)}
                                    disabled={actionLoading}
                                    className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                                >
                                    Вернуться
                                </button>
                                <button
                                    type="button"
                                    onClick={runConfirmedAction}
                                    disabled={actionLoading}
                                    className={`rounded-xl px-5 py-3 text-sm font-bold text-white disabled:opacity-50 ${confirmation === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                >
                                    {actionLoading ? 'Выполняем…' : confirmation === 'cancel' ? 'Да, отменить' : 'Да, применить расхождения'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {activeCheck && (
                <button
                    type="button"
                    onClick={() => setSelectedId(activeCheck.id)}
                    className="flex w-full flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-left transition hover:bg-blue-100/70 sm:flex-row sm:items-center sm:justify-between"
                >
                    <span>
                        <span className="block text-sm font-bold text-blue-900">Есть активная инвентаризация</span>
                        <span className="mt-1 block text-xs text-blue-700">
                            {activeCheck.comment || `Инвентаризация #${shortId(activeCheck.id)}`}
                        </span>
                    </span>
                    <span className="shrink-0 text-xs font-black text-blue-700">Продолжить →</span>
                </button>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">Инвентаризации</h2>
                        <p className="mt-1 text-xs text-slate-500">История и текущие пересчёты складских остатков</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <select
                            value={filter}
                            onChange={(event) => setFilter(event.target.value as '' | InventoryCheckStatus)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                        >
                            {filters.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                        </select>
                        <button
                            type="button"
                            onClick={() => {
                                setCreateOpen(true);
                                setCreateError('');
                            }}
                            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                        >
                            + Новая инвентаризация
                        </button>
                    </div>
                </div>

                {listQuery.isError && (
                    <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {getApiErrorMessage(listQuery.error, 'Не удалось загрузить инвентаризации')}
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                            <tr>
                                <th className="px-5 py-3 font-bold">Инвентаризация</th>
                                <th className="px-5 py-3 font-bold">Начата</th>
                                <th className="px-5 py-3 font-bold">Позиций</th>
                                <th className="px-5 py-3 font-bold">Статус</th>
                                <th className="px-5 py-3 text-right font-bold">Действие</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {checks.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-bold text-slate-900">{item.comment || 'Без комментария'}</p>
                                        <p className="mt-0.5 font-mono text-[11px] text-slate-400">#{shortId(item.id)}</p>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600">
                                        {item.startedAt ? formatDateTime(item.startedAt) : 'Не начата'}
                                    </td>
                                    <td className="px-5 py-4 text-sm font-bold text-slate-700">{item.items.length}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getInventoryStatusClasses(item.statusCode, statusRulesByCode.get(item.statusCode))}`}>
                                            {getInventoryStatusLabel(item.statusCode, statusRulesByCode.get(item.statusCode))}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedId(item.id);
                                                setActionError('');
                                            }}
                                            className="rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                                        >
                                            Открыть
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {listQuery.isLoading && (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">Загружаем историю…</div>
                )}
                {!listQuery.isLoading && checks.length === 0 && (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">Инвентаризаций с таким статусом нет</div>
                )}
            </section>

            {createOpen && (
                <Modal contentClassName="max-w-lg p-5 sm:p-6">
                    <form onSubmit={handleCreate}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Новый документ</p>
                                <h2 className="mt-1 text-lg font-bold text-slate-900">Создать инвентаризацию</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCreateOpen(false)}
                                disabled={createState.isLoading}
                                aria-label="Закрыть"
                                className="text-2xl leading-none text-slate-400 hover:text-slate-700"
                            >
                                &times;
                            </button>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Будет создан снимок всех складских позиций. Одновременно может существовать только одна активная инвентаризация.
                        </p>
                        <label className="mt-5 block">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Комментарий</span>
                            <textarea
                                required
                                rows={3}
                                value={comment}
                                onChange={(event) => setComment(event.target.value)}
                                placeholder="Например: Плановая инвентаризация за июнь"
                                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
                            />
                        </label>
                        {createError && (
                            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{createError}</p>
                        )}
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setCreateOpen(false)}
                                disabled={createState.isLoading}
                                className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={createState.isLoading}
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-blue-300"
                            >
                                {createState.isLoading ? 'Создаём…' : 'Создать черновик'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
