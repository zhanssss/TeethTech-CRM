'use client';

import {
    Area,
    AreaChart,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type StageLoadAnalyticsProps = { stageLoads: Record<string, number> };

const stageLabels: Record<string, string> = {
    TODO: 'Новые',
    SCANNING: 'Сканирование',
    MODELING: 'Моделирование',
    MILLING: 'Фрезеровка',
    PRINTING: '3D-печать',
    CASTING: 'Литьё',
    POST_PROCESSING: 'Постобработка',
    QUALITY_CONTROL: 'Контроль',
    READY: 'Готово',
    DONE: 'Завершено',
};

const stageOrder = Object.keys(stageLabels);
const formatStageName = (value: string) => stageLabels[value] ?? value.replaceAll('_', ' ').toLocaleLowerCase('ru-RU');

function LoadTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-xl shadow-slate-950/10">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <div className="mt-1.5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                <span className="text-xs text-slate-500">Задач</span>
                <strong className="ml-2 text-sm text-slate-900">{payload[0].value ?? 0}</strong>
            </div>
        </div>
    );
}

export default function StageLoadAnalytics({ stageLoads }: StageLoadAnalyticsProps) {
    const data = Object.entries(stageLoads)
        .map(([key, count]) => ({ key, name: formatStageName(key), count: Number.isFinite(count) ? Math.max(0, count) : 0 }))
        .sort((a, b) => {
            const aIndex = stageOrder.indexOf(a.key);
            const bIndex = stageOrder.indexOf(b.key);
            return (aIndex < 0 ? stageOrder.length : aIndex) - (bIndex < 0 ? stageOrder.length : bIndex);
        });
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const average = data.length ? total / data.length : 0;
    const peak = data.reduce<(typeof data)[number] | undefined>((current, item) => !current || item.count > current.count ? item : current, undefined);

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Обзор производственной нагрузки</h2>
                    <p className="mt-1 text-xs text-slate-400">Количество активных задач на каждом этапе</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-violet-500" />Задачи</span>
                    <span className="flex items-center gap-2"><span className="w-5 border-t border-dashed border-violet-300" />Среднее: {average.toFixed(1)}</span>
                </div>
            </div>

            {data.length ? (
                <div className="mt-7 h-[350px] w-full sm:h-[390px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 10 }}>
                            <defs>
                                <linearGradient id="stageLoadFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.28} />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="currentColor" className="text-slate-200" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={{ stroke: '#3f3f46' }} tickLine={false} interval="preserveStartEnd" dy={10} />
                            <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<LoadTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <ReferenceLine y={average} stroke="#a78bfa" strokeDasharray="4 5" strokeOpacity={0.75} />
                            <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#stageLoadFill)" activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fafafa', strokeWidth: 2 }} dot={{ r: 3, fill: '#8b5cf6', stroke: '#fafafa', strokeWidth: 1.5 }} animationDuration={700} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex h-[350px] flex-col items-center justify-center text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">⌁</span>
                    <h3 className="mt-4 text-sm font-semibold text-slate-900">Нет данных по этапам</h3>
                    <p className="mt-1 text-xs text-slate-400">Данные появятся после назначения задач.</p>
                </div>
            )}

            {data.length > 0 && (
                <div className="grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
                    <div><p className="text-[11px] text-slate-400">Всего на этапах</p><p className="mt-1 text-lg font-bold text-slate-900">{total}</p></div>
                    <div><p className="text-[11px] text-slate-400">Пиковый этап</p><p className="mt-1 truncate text-sm font-semibold text-slate-800">{peak?.name ?? '—'}</p></div>
                    <div><p className="text-[11px] text-slate-400">Задач на пике</p><p className="mt-1 text-lg font-bold text-violet-600">{peak?.count ?? 0}</p></div>
                </div>
            )}
        </section>
    );
}
