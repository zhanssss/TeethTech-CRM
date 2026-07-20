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
    const totalPositions = overview?.totalPositionsCount ?? 0;
    const healthShare = totalPositions > 0 ? Math.round((sufficientCount / totalPositions) * 100) : 0;
    const warningCount = Math.max(0, (overview?.lowStockCount ?? 0) - criticalCount);
    const attentionItems = [...(overview?.items ?? [])]
        .filter((item) => item.minStockLevel > 0 && item.currentQuantity < item.minStockLevel)
        .sort((a, b) => {
            const aCoverage = a.minStockLevel > 0 ? a.currentQuantity / a.minStockLevel : 1;
            const bCoverage = b.minStockLevel > 0 ? b.currentQuantity / b.minStockLevel : 1;
            return aCoverage - bCoverage;
        })
        .slice(0, 7);
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
                        color: 'bg-violet-500',
                    },
                    {
                        label: 'Остаток достаточный',
                        value: overview ? sufficientCount : '—',
                        note: 'Выше минимального уровня',
                        color: 'bg-emerald-500',
                    },
                    {
                        label: 'Требуют внимания',
                        value: overview?.lowStockCount ?? '—',
                        note: 'На грани или ниже минимума',
                        color: 'bg-amber-500',
                    },
                    {
                        label: 'Критический остаток',
                        value: overview ? criticalCount : '—',
                        note: 'Нужно пополнить в первую очередь',
                        color: 'bg-red-500',
                    },
                ].map((card) => (
                    <article
                        key={card.label}
                        className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/5"
                    >
                        <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{card.label}</p><span className={`h-2.5 w-2.5 rounded-full ${card.color}`} /></div>
                        <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">
                            {overviewQuery.isLoading ? (
                                <span className="inline-block h-9 w-16 animate-pulse rounded bg-slate-100" />
                            ) : card.value}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">{card.note}</p>
                    </article>
                ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(280px,.6fr)_minmax(0,1.4fr)]">
                <article className="self-start rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div><h2 className="text-sm font-bold text-slate-900">Здоровье запасов</h2><p className="mt-1 text-xs text-slate-400">Позиции выше минимального остатка</p></div>
                        <span className="text-3xl font-black tracking-tight text-violet-600">{healthShare}%</span>
                    </div>

                    <div className="mt-7 flex h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`Здоровье запасов: ${healthShare}%`}>
                        <span className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 transition-all" style={{width: `${healthShare}%`}} />
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" />Достаточно</div><p className="mt-2 text-xl font-black text-slate-950">{sufficientCount}</p></div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500"><span className="h-2 w-2 rounded-full bg-amber-500" />На грани</div><p className="mt-2 text-xl font-black text-slate-950">{warningCount}</p></div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500"><span className="h-2 w-2 rounded-full bg-red-500" />Критично</div><p className="mt-2 text-xl font-black text-slate-950">{criticalCount}</p></div>
                    </div>

                    <p className="mt-5 border-t border-slate-100 pt-4 text-[11px] leading-5 text-slate-400">
                        {criticalCount > 0 ? `${criticalCount} поз. нужно пополнить в первую очередь` : warningCount > 0 ? `${warningCount} поз. приближаются к минимальному уровню` : 'Все складские позиции находятся в безопасной зоне'}
                    </p>
                </article>

                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
                    <div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Зона риска</h2><p className="mt-1 text-xs text-slate-400">Покрытие минимального запаса по проблемным позициям</p></div><button type="button" onClick={onOpenNomenclature} className="rounded-xl bg-violet-50 px-3 py-2 text-[11px] font-bold text-violet-700">Пополнить</button></div>
                    <div className="mt-6 space-y-4">
                        {attentionItems.map((item) => {
                            const coverage = item.minStockLevel > 0 ? Math.max(0, Math.min(100, item.currentQuantity / item.minStockLevel * 100)) : 100;
                            return <div key={item.nomenclatureId} className="grid gap-2 sm:grid-cols-[minmax(120px,190px)_minmax(0,1fr)_58px] sm:items-center sm:gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-700" title={item.name}>{item.name}</p><p className="mt-0.5 text-[9px] text-slate-400">{formatQuantity(item.currentQuantity, item.unit)} из {formatQuantity(item.minStockLevel, item.unit)}</p></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400" style={{width: `${coverage}%`}} /></div><span className="text-right text-xs font-black text-violet-700">{Math.round(coverage)}%</span></div>;
                        })}
                        {!overviewQuery.isLoading && attentionItems.length === 0 && <div className="flex min-h-44 items-center justify-center rounded-xl bg-emerald-50 text-center text-sm font-semibold text-emerald-700">Все позиции обеспечены выше минимума</div>}
                        {overviewQuery.isLoading && <div className="h-44 animate-pulse rounded-xl bg-slate-100" />}
                    </div>
                </article>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
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
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-950/15 transition hover:bg-violet-700"
                        >
                            Полная информация <span aria-hidden="true">→</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/80">
                        <div className="border-r border-slate-200 px-4 py-3 sm:px-5"><p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Всего</p><p className="mt-1 text-lg font-black text-slate-950">{totalPositions}</p></div>
                        <div className="border-r border-slate-200 px-4 py-3 sm:px-5"><p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">В норме</p><p className="mt-1 text-lg font-black text-slate-950">{sufficientCount}</p></div>
                        <div className="px-4 py-3 sm:px-5"><p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Ниже минимума</p><p className="mt-1 text-lg font-black text-slate-950">{warningCount + criticalCount}</p></div>
                    </div>

                    <div className="max-h-[480px] overflow-auto [scrollbar-color:#8b5cf6_transparent]">
                        <table className="w-full min-w-[680px] text-left">
                            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 text-[10px] uppercase tracking-wider text-slate-400 backdrop-blur">
                                <tr>
                                    <th className="px-5 py-3 font-bold">Позиция</th>
                                    <th className="px-5 py-3 font-bold">Остаток</th>
                                    <th className="px-5 py-3 font-bold">Минимум</th>
                                    <th className="px-5 py-3 text-right font-bold">Статус</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(overview?.items ?? []).map((item) => (
                                    <tr key={item.nomenclatureId} className="transition hover:bg-violet-50/50">
                                        <td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className={`h-8 w-1 shrink-0 rounded-full ${item.status === 'CRITICAL' ? 'bg-red-500' : item.status === 'LOW' ? 'bg-amber-500' : 'bg-violet-400'}`} /><span className="text-sm font-bold text-slate-900">{item.name}</span></div></td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">
                                            <div className="flex min-w-36 items-center gap-3">
                                                <span className="min-w-16">{formatQuantity(item.currentQuantity, item.unit)}</span>
                                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.status === 'CRITICAL' ? 'bg-red-500' : item.status === 'LOW' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, item.minStockLevel > 0 ? item.currentQuantity / item.minStockLevel * 100 : 100)}%`}} /></div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-500">
                                            {formatQuantity(item.minStockLevel, item.unit)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
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

                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                    <div className="flex items-start justify-between gap-3">
                        <div className="px-5 pt-5">
                            <h2 className="font-bold text-slate-900">Последние движения</h2>
                            <p className="mt-1 text-xs text-slate-500">Приходы, списания и корректировки</p>
                        </div>
                        <button
                            type="button"
                            onClick={onOpenInventory}
                            className="mr-5 mt-5 shrink-0 rounded-xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
                        >
                            Инвентаризации
                        </button>
                    </div>

                    <div className="relative mt-4 max-h-[520px] space-y-0 overflow-y-auto px-5 pb-5 [scrollbar-color:#8b5cf6_transparent] before:absolute before:bottom-5 before:left-[34px] before:top-3 before:w-px before:bg-slate-200">
                        {movements.map((movement) => {
                            const positive = isPositiveMovement(movement.movementType);
                            return (
                                <article key={movement.id} className="group relative pl-9 py-2.5">
                                    <span className={`absolute left-1.5 top-4 z-[1] flex h-6 w-6 items-center justify-center rounded-full border-4 border-white text-[10px] font-black text-white shadow-sm ${positive ? 'bg-emerald-500' : 'bg-violet-600'}`}>{positive ? '↓' : '↑'}</span>
                                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition group-hover:border-violet-200 group-hover:shadow-md">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-[10px] font-bold text-slate-400">
                                                    #{shortId(movement.id)}
                                                </span>
                                                <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
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
                                        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-black ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>
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
