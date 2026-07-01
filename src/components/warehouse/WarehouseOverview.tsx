'use client';

import {
    useGetRecentStockMovementsQuery,
    useGetStockOverviewQuery,
} from '@/src/services/api/warehouseApi';
import type { StockMovementType } from '@/src/types/warehouse.types';
import {
    formatDateTime,
    formatQuantity,
    getApiErrorMessage,
    shortId,
    stockStatusClasses,
    stockStatusLabels,
} from './warehouseUtils';

type WarehouseOverviewProps = {
    onOpenNomenclature: () => void;
    onOpenInventory: () => void;
};

const movementLabels: Record<StockMovementType, string> = {
    IN: 'Приход',
    OUT: 'Расход',
    ORDER_CONSUMPTION: 'Списание по заказу',
    ORDER_RETURN: 'Возврат из заказа',
    INVENTORY_ADJUSTMENT: 'Корректировка',
};

function isPositiveMovement(type: StockMovementType) {
    return type === 'IN' || type === 'ORDER_RETURN';
}

export default function WarehouseOverview({
    onOpenNomenclature,
    onOpenInventory,
}: WarehouseOverviewProps) {
    const overviewQuery = useGetStockOverviewQuery();
    const movementsQuery = useGetRecentStockMovementsQuery(10);

    const overview = overviewQuery.data;
    const movements = movementsQuery.data ?? [];
    const sufficientCount = Math.max(
        0,
        (overview?.totalPositionsCount ?? 0) - (overview?.lowStockCount ?? 0)
    );
    const criticalCount = overview?.items.filter((item) => item.status === 'CRITICAL').length ?? 0;
    const hasError = overviewQuery.isError || movementsQuery.isError;

    return (
        <div className="space-y-6">
            {hasError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {getApiErrorMessage(
                        overviewQuery.error ?? movementsQuery.error,
                        'Не удалось загрузить сводку склада'
                    )}
                </div>
            )}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: 'Позиций на складе',
                        value: overview?.totalPositionsCount ?? '—',
                        note: 'Вся номенклатура',
                        color: 'border-l-blue-500',
                    },
                    {
                        label: 'Остаток достаточный',
                        value: overview ? sufficientCount : '—',
                        note: 'Выше минимального уровня',
                        color: 'border-l-emerald-500',
                    },
                    {
                        label: 'Требуют внимания',
                        value: overview?.lowStockCount ?? '—',
                        note: 'На грани или ниже минимума',
                        color: 'border-l-amber-500',
                    },
                    {
                        label: 'Критический остаток',
                        value: overview ? criticalCount : '—',
                        note: 'Нужно пополнить в первую очередь',
                        color: 'border-l-red-500',
                    },
                ].map((card) => (
                    <article
                        key={card.label}
                        className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${card.color}`}
                    >
                        <p className="text-sm font-medium text-slate-500">{card.label}</p>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {overviewQuery.isLoading ? (
                                <span className="inline-block h-9 w-16 animate-pulse rounded bg-slate-100" />
                            ) : card.value}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">{card.note}</p>
                    </article>
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Остатки по позициям</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Статус рассчитан относительно минимального уровня
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onOpenNomenclature}
                            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                        >
                            Вся номенклатура
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                                <tr>
                                    <th className="px-5 py-3 font-bold">Позиция</th>
                                    <th className="px-5 py-3 font-bold">Остаток</th>
                                    <th className="px-5 py-3 font-bold">Минимум</th>
                                    <th className="px-5 py-3 text-right font-bold">Статус</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(overview?.items ?? []).map((item) => (
                                    <tr key={item.nomenclatureId} className="hover:bg-slate-50">
                                        <td className="px-5 py-4 text-sm font-bold text-slate-900">{item.name}</td>
                                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                                            {formatQuantity(item.currentQuantity, item.unit)}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {formatQuantity(item.minStockLevel, item.unit)}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${stockStatusClasses[item.status]}`}>
                                                {stockStatusLabels[item.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {!overviewQuery.isLoading && (overview?.items.length ?? 0) === 0 && (
                        <div className="px-5 py-12 text-center text-sm text-slate-500">
                            На складе пока нет номенклатурных позиций
                        </div>
                    )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-slate-900">Последние движения</h2>
                            <p className="mt-1 text-xs text-slate-500">Приходы, списания и корректировки</p>
                        </div>
                        <button
                            type="button"
                            onClick={onOpenInventory}
                            className="shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                            Инвентаризации
                        </button>
                    </div>

                    <div className="mt-5 space-y-3">
                        {movements.map((movement) => {
                            const positive = isPositiveMovement(movement.movementType);
                            return (
                                <article key={movement.id} className="rounded-xl border border-slate-200 p-3.5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-[10px] font-bold text-slate-400">
                                                    #{shortId(movement.id)}
                                                </span>
                                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                                    {movementLabels[movement.movementType] ?? movement.movementType}
                                                </span>
                                            </div>
                                            <p className="mt-1.5 truncate text-sm font-bold text-slate-900">
                                                {movement.nomenclatureName}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                                                {movement.reason || 'Без комментария'}
                                            </p>
                                            <p className="mt-1.5 text-[11px] text-slate-400">
                                                {formatDateTime(movement.createdAt)}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            {positive ? '+' : '−'}{formatQuantity(Math.abs(movement.quantity))}
                                        </span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {!movementsQuery.isLoading && movements.length === 0 && (
                        <div className="py-12 text-center text-sm text-slate-500">Движений пока нет</div>
                    )}
                </div>
            </section>
        </div>
    );
}
