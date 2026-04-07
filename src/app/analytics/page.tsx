'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// --- MOCK DATA (В будущем придет из Redux/API) ---

// 1. Статистика по этапам (Где сейчас скапливается работа?)
const stageData = [
    { name: 'Нужно сделать', count: 12 },
    { name: 'Моделирование', count: 19 },
    { name: 'Фрезеровка', count: 8 },
    { name: 'Обработка', count: 15 },
    { name: 'Готово', count: 34 },
];

// 2. Популярность материалов
const materialData = [
    { name: 'Zirconia', value: 45, color: '#3b82f6' }, // blue-500
    { name: 'E-max', value: 30, color: '#0ea5e9' },   // sky-500
    { name: 'PMMA', value: 15, color: '#ec4899' },    // pink-500
    { name: 'Titanium', value: 10, color: '#71717a' },// zinc-500
];

// Компонент карточки KPI
const StatCard = ({ title, value, trend, isPositive }: any) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{value}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {trend}
      </span>
        </div>
    </div>
);

export default function AnalyticsPage() {
    return (
        <div className="h-full flex flex-col space-y-6 overflow-y-auto pb-8 pr-2">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Аналитика лаборатории</h1>
                <p className="text-slate-500 text-sm">Показатели эффективности и загрузка производства</p>
            </header>

            {/* Секция 1: KPI Карточки */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Выполнено за месяц" value="128" trend="+12%" isPositive={true} />
                <StatCard title="В работе сейчас" value="54" trend="+5" isPositive={false} />
                <StatCard title="Просрочено дедлайнов" value="3" trend="-2" isPositive={true} />
                <StatCard title="Среднее время (дни)" value="4.2" trend="-0.5" isPositive={true} />
            </div>

            {/* Секция 2: Графики */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                {/* График 1: Воронка этапов (Bottlenecks) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Нагрузка по этапам</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* График 2: Распределение материалов */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Доля материалов</h3>
                    <div className="flex-1 min-h-[300px]">
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
                                    {materialData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}