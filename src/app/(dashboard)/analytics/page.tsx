'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

import { StatCard } from '@/src/components/ui/Statcard';
import { useGetAnalyticsQuery } from '@/src/services/api/analyticsApi';

import type { Analytics } from '@/src/types/analytics.types';

type StageChartItem = {
    name: string;
    count: number;
};

type MaterialChartItem = {
    name: string;
    value: number;
    color: string;
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

const fallbackStageData: StageChartItem[] = [
    { name: 'Нужно сделать', count: 12 },
    { name: 'Моделирование', count: 19 },
    { name: 'Фрезеровка', count: 8 },
    { name: 'Обработка', count: 15 },
    { name: 'Готово', count: 34 },
];

const materialColors = ['#3b82f6', '#0ea5e9', '#ec4899', '#71717a'];

const fallbackMaterialData: MaterialChartItem[] = [
    { name: 'Zirconia', value: 45, color: '#3b82f6' },
    { name: 'E-max', value: 30, color: '#0ea5e9' },
    { name: 'PMMA', value: 15, color: '#ec4899' },
    { name: 'Titanium', value: 10, color: '#71717a' },
];

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

    if (entries.length === 0) {
        return fallbackStageData;
    }

    return entries.map(([name, count]) => ({
        name: formatLabel(name),
        count,
    }));
};

const getMaterialChartData = (
    materialShares?: Record<string, number>
): MaterialChartItem[] => {
    const entries = Object.entries(materialShares ?? {}).filter(
        ([, value]) => value > 0
    );

    if (entries.length === 0) {
        return fallbackMaterialData;
    }

    return entries.map(([name, value], index) => ({
        name: formatLabel(name),
        value,
        color: materialColors[index % materialColors.length],
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
    const materialData = getMaterialChartData(analytics.materialShares);

    if (isLoading) {
        return (
            <div className="h-full overflow-y-auto bg-slate-50 p-6">
                <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm">
                    Загрузка аналитики...
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="h-full overflow-y-auto bg-slate-50 p-6">
                <div className="rounded-2xl bg-red-50 px-6 py-8 text-center text-sm text-red-600 shadow-sm">
                    Не удалось загрузить аналитику
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <header className="mb-6 rounded-2xl bg-white px-6 py-5 shadow-sm">
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

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-800">
                        Нагрузка по этапам
                    </h3>

                    <div className="min-h-[320px] flex-1">
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

                <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-lg font-semibold text-slate-800">
                        Доля материалов
                    </h3>

                    <div className="min-h-[320px] flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={materialData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {materialData.map((entry) => (
                                        <Cell
                                            key={entry.name}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Pie>

                                <RechartsTooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow:
                                            '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    }}
                                />

                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{
                                        fontSize: '12px',
                                        color: '#475569',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700">
                    Выгрузить в Excel
                </button>
            </div>
        </div>
    );
}