'use client';

type StageLoadAnalyticsProps = {
    stageLoads: Record<string, number>;
};

const stageLabels: Record<string, string> = {
    TODO: 'Новые задачи',
    SCANNING: 'Сканирование',
    MODELING: 'Моделирование',
    MILLING: 'Фрезеровка',
    PRINTING: '3D-печать',
    CASTING: 'Литьё',
    POST_PROCESSING: 'Постобработка',
    QUALITY_CONTROL: 'Контроль качества',
    READY: 'Готово к выдаче',
    DONE: 'Завершено',
};

const palette = ['#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#0f766e', '#0891b2'];

function formatStageName(value: string) {
    return stageLabels[value] ?? value.replaceAll('_', ' ').toLocaleLowerCase('ru-RU');
}

export default function StageLoadAnalytics({ stageLoads }: StageLoadAnalyticsProps) {
    const data = Object.entries(stageLoads)
        .map(([key, count], index) => ({
            key,
            name: formatStageName(key),
            count: Number.isFinite(count) ? Math.max(0, count) : 0,
            color: palette[index % palette.length],
        }))
        .sort((a, b) => b.count - a.count);

    const total = data.reduce((sum, item) => sum + item.count, 0);
    const average = data.length > 0 ? total / data.length : 0;
    const peak = data[0];

    if (data.length === 0) {
        return (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6" aria-hidden="true">
                        <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </div>
                <h2 className="mt-4 text-base font-semibold text-slate-900">Нет данных по этапам</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Распределение нагрузки появится после назначения задач на производственные этапы.
                </p>
            </section>
        );
    }

    return (
        <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">В работе на этапах</p>
                    <div className="mt-2 flex items-end gap-2">
                        <span className="text-3xl font-bold text-slate-950">{total}</span>
                        <span className="pb-1 text-sm text-slate-500">задач</span>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Пиковый этап</p>
                    <p className="mt-2 truncate text-lg font-bold text-slate-950" title={peak?.name}>
                        {peak?.name ?? '—'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{peak?.count ?? 0} задач в очереди</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Среднее на этап</p>
                    <div className="mt-2 flex items-end gap-2">
                        <span className="text-3xl font-bold text-slate-950">{average.toFixed(1)}</span>
                        <span className="pb-1 text-sm text-slate-500">задачи</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-950">Нагрузка по этапам</h2>
                            <p className="mt-1 text-sm text-slate-500">Количество активных задач на каждом участке производства</p>
                        </div>
                        <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:mt-0">
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                            Текущая нагрузка
                        </span>
                    </div>

                    <div className="mt-7 flex min-h-[320px] flex-col justify-center gap-5 sm:min-h-[360px]">
                        {data.map((item) => {
                            const relativeWidth = peak && peak.count > 0 ? (item.count / peak.count) * 100 : 0;
                            return (
                                <div key={item.key} className="grid gap-2 sm:grid-cols-[132px_minmax(0,1fr)_36px] sm:items-center sm:gap-4">
                                    <span className="truncate text-xs font-semibold text-slate-600" title={item.name}>{item.name}</span>
                                    <div className="h-7 overflow-hidden rounded-lg bg-slate-100">
                                        <div
                                            className="flex h-full min-w-0 items-center justify-end rounded-lg px-2 text-[10px] font-bold text-white transition-[width] duration-500"
                                            style={{ width: `${relativeWidth}%`, backgroundColor: item.color }}
                                        >
                                            {relativeWidth >= 18 ? item.count : ''}
                                        </div>
                                    </div>
                                    <span className="hidden text-right text-sm font-bold text-slate-900 sm:block">{item.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <aside className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-blue-300">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5" aria-hidden="true">
                            <path d="M12 8v4m0 4h.01M10.3 3.8 2.8 17a2 2 0 0 0 1.74 3h14.92a2 2 0 0 0 1.74-3L13.7 3.8a2 2 0 0 0-3.4 0Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Фокус команды</p>
                    <h3 className="mt-2 text-xl font-bold">{peak?.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                        На этом этапе находится {total > 0 ? Math.round(((peak?.count ?? 0) / total) * 100) : 0}% всей текущей нагрузки.
                        Проверьте очередь и доступность исполнителей.
                    </p>

                    <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                        {data.slice(0, 4).map((item) => {
                            const share = total > 0 ? (item.count / total) * 100 : 0;
                            return (
                                <div key={item.key}>
                                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                                        <span className="truncate text-slate-300">{item.name}</span>
                                        <span className="font-semibold text-white">{Math.round(share)}%</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full rounded-full bg-blue-400" style={{ width: `${share}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </aside>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="font-bold text-slate-950">Детализация очередей</h2>
                    <p className="mt-1 text-xs text-slate-500">Оценка рассчитывается относительно средней нагрузки по всем этапам</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            <tr>
                                <th className="px-5 py-3">Этап</th>
                                <th className="px-5 py-3">Задач</th>
                                <th className="px-5 py-3">Доля нагрузки</th>
                                <th className="px-5 py-3">Оценка</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map((item) => {
                                const share = total > 0 ? (item.count / total) * 100 : 0;
                                const isHigh = average > 0 && item.count > average * 1.25;
                                const isLow = average > 0 && item.count < average * 0.65;
                                return (
                                    <tr key={item.key} className="transition hover:bg-slate-50/80">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-sm font-semibold text-slate-800">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm font-bold text-slate-950">{item.count}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                                                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${share}%` }} />
                                                </div>
                                                <span className="text-sm text-slate-500">{Math.round(share)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                isHigh
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : isLow
                                                        ? 'bg-slate-100 text-slate-600'
                                                        : 'bg-emerald-50 text-emerald-700'
                                            }`}>
                                                {isHigh ? 'Выше среднего' : isLow ? 'Низкая' : 'Сбалансировано'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
