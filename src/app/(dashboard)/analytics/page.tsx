'use client';

import ErrorState from '@/src/components/ui/ErrorState';
import StageLoadAnalytics from '@/src/components/analytics/StageLoadAnalytics';
import { useGetAnalyticsQuery } from '@/src/services/api/analyticsApi';

function DashboardMetric({
    title,
    value,
    change,
    positive,
}: {
    title: string;
    value: string;
    change?: string;
    positive?: boolean;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                {change && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {change}
                    </span>
                )}
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
        </div>
    );
}

function formatChange(value: number, suffix = '') {
    return `${value > 0 ? '+' : ''}${value}${suffix}`;
}

export default function AnalyticsPage() {
    const { data, isLoading, isFetching, isError, refetch } = useGetAnalyticsQuery();

    if (isLoading) {
        return (
            <div className="space-y-4" aria-busy="true">
                <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
                </div>
                <div className="h-[420px] animate-pulse rounded-2xl bg-slate-200" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <ErrorState title="Аналитика недоступна" onRetry={() => void refetch()} isRetrying={isFetching}>
                Не удалось загрузить данные по производственной нагрузке.
            </ErrorState>
        );
    }

    const paidShare = data.totalOrdersCount > 0
        ? Math.round((data.paidOrdersCount / data.totalOrdersCount) * 100)
        : 0;

    return (
        <div className="space-y-5 pb-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                        Производство
                    </div>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Аналитика нагрузки</h1>
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                        Текущая загрузка этапов, ключевые показатели и зоны внимания лаборатории.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true">
                        <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {isFetching ? 'Обновляем…' : 'Обновить'}
                </button>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardMetric
                    title="Выполнено за месяц"
                    value={String(data.completedThisMonth)}
                    change={formatChange(data.completedPercentageChange, '%')}
                    positive={data.completedPercentageChange >= 0}
                />
                <DashboardMetric
                    title="Сейчас в работе"
                    value={String(data.inProgressCount)}
                    change={formatChange(data.inProgressChange)}
                    positive={data.inProgressChange <= 0}
                />
                <DashboardMetric
                    title="Просрочено"
                    value={String(data.overdueCount)}
                    change={formatChange(data.overdueChange)}
                    positive={data.overdueChange <= 0}
                />
                <DashboardMetric
                    title="Средний срок"
                    value={`${data.averageCompletionDays} дн.`}
                    change={formatChange(data.averageDaysChange, ' дн.')}
                    positive={data.averageDaysChange <= 0}
                />
            </section>

            <StageLoadAnalytics stageLoads={data.stageLoads} />

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Оплата заказов</p>
                        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
                            <div>
                                <span className="text-3xl font-bold text-slate-950">{paidShare}%</span>
                                <span className="ml-2 text-sm text-slate-500">оплачено</span>
                            </div>
                            <p className="pb-1 text-sm text-slate-500">
                                {data.paidOrdersCount} из {data.totalOrdersCount} заказов
                            </p>
                        </div>
                    </div>
                    <div className="w-full max-w-xl">
                        <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
                            <span>Оплачено: {data.paidOrdersCount}</span>
                            <span>Ожидает оплаты: {data.unpaidOrdersCount}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${paidShare}%` }} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
