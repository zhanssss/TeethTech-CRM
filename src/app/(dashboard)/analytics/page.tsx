'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from 'recharts';

import { StatCard } from '@/src/components/ui/Statcard';
import { useGetAnalyticsQuery } from '@/src/services/api/analyticsApi';
import ErrorState from '@/src/components/ui/ErrorState';

import type { Analytics } from '@/src/types/analytics.types';

type StageChartItem = {
    name: string;
    count: number;
};

const emptyAnalytics: Analytics = {
    completedThisMonth: 0,
    completedPercentageChange: 0,

    inProgressCount: 0,
    inProgressChange: 0,

    overdueCount: 0,
    overdueChange: 0,

    averageCompletionDays: 0,
    averageDaysChange: 0,

    paidOrdersCount: 0,
    unpaidOrdersCount: 0,
    totalOrdersCount: 0,

    stageLoads: {},
    materialShares: {},
};

const formatChange = (value: number, suffix = '') => {
    if (value > 0) return `+${value}${suffix}`;
    return `${value}${suffix}`;
};

const formatLabel = (value: string) => {
    return value.replaceAll('_', ' ');
};

const getStageChartData = (
    stageLoads?: Record<string, number>
): StageChartItem[] => {
    const entries = Object.entries(stageLoads ?? {}).filter(
        ([, value]) => value > 0
    );

    return entries.map(([name, count]) => ({
        name: formatLabel(name),
        count,
    }));
};

export default function AnalyticsPage() {
    const {
        data,
        isLoading,
        isError,
    } = useGetAnalyticsQuery();

    const analytics = data ?? emptyAnalytics;

    const stageData = getStageChartData(analytics.stageLoads);

    if (isLoading) {
        return (
            <div className="bg-slate-50">
                <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm sm:px-6">
                    Загрузка аналитики...
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <ErrorState>
                Не удалось загрузить аналитику
            </ErrorState>
        );
    }

    return (
        <div className="bg-slate-50">
            <header className="mb-4 rounded-2xl bg-white px-4 py-4 shadow-sm sm:mb-6 sm:px-6 sm:py-5">
                <h1 className="text-2xl font-semibold text-slate-900">
                    Аналитика лаборатории
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Показатели эффективности, оплат и загрузки производства
                </p>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Выполнено за месяц"
                    value={String(analytics.completedThisMonth)}
                    trend={formatChange(analytics.completedPercentageChange, '%')}
                    isPositive={analytics.completedPercentageChange >= 0}
                />

                <StatCard
                    title="В работе сейчас"
                    value={String(analytics.inProgressCount)}
                    trend={formatChange(analytics.inProgressChange)}
                    isPositive={analytics.inProgressChange <= 0}
                />

                <StatCard
                    title="Просрочено дедлайнов"
                    value={String(analytics.overdueCount)}
                    trend={formatChange(analytics.overdueChange)}
                    isPositive={analytics.overdueChange <= 0}
                />

                <StatCard
                    title="Среднее время"
                    value={`${analytics.averageCompletionDays} дн.`}
                    trend={formatChange(analytics.averageDaysChange, ' дн.')}
                    isPositive={analytics.averageDaysChange <= 0}
                />

                <StatCard
                    title="Оплаченные заказы"
                    value={String(analytics.paidOrdersCount)}
                />

                <StatCard
                    title="Неоплаченные заказы"
                    value={String(analytics.unpaidOrdersCount)}
                />

                <StatCard
                    title="Всего заказов"
                    value={String(analytics.totalOrdersCount)}
                />
            </div>

            <div className="mt-6">
                <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm sm:p-5">
                    <h3 className="mb-4 text-lg font-semibold text-slate-800">
                        Нагрузка по этапам
                    </h3>

                    <div className="min-h-[280px] flex-1 sm:min-h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={stageData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    stroke="#e2e8f0"
                                />

                                <XAxis
                                    dataKey="name"
                                    tick={{
                                        fontSize: 12,
                                        fill: '#64748b',
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <YAxis
                                    tick={{
                                        fontSize: 12,
                                        fill: '#64748b',
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <RechartsTooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow:
                                            '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    }}
                                />

                                <Bar
                                    dataKey="count"
                                    fill="#2563eb"
                                    radius={[6, 6, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            <div className="mt-6">
                <button className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto">
                    Выгрузить в Excel
                </button>
            </div>
        </div>
    );
}
