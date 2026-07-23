'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useGetTasksDashboardQuery } from '@/src/services/api/tasksDashboardApi';
import MaterialChips from '@/src/components/tasks/MaterialChips';
import { taskMatchesMaterialSearch } from '@/src/utils/materialAccounting';
import type {
    TaskDashboardColumn,
    TaskDashboardTask,
} from '@/src/types/task.types';

type StatusOption = {
    value: string;
    label: string;
    statusId?: string;
};

const statusThemes = [
    { border: 'border-slate-300', dot: 'bg-slate-500', badge: 'bg-slate-100 text-slate-700', glow: 'from-slate-500/10' },
    { border: 'border-blue-300', dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700', glow: 'from-blue-500/10' },
    { border: 'border-cyan-300', dot: 'bg-cyan-500', badge: 'bg-cyan-50 text-cyan-700', glow: 'from-cyan-500/10' },
    { border: 'border-amber-300', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700', glow: 'from-amber-500/10' },
    { border: 'border-violet-300', dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700', glow: 'from-violet-500/10' },
    { border: 'border-emerald-300', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', glow: 'from-emerald-500/10' },
    { border: 'border-rose-300', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700', glow: 'from-rose-500/10' },
];

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
});

function formatNumber(value?: number | null) {
    return (value ?? 0).toLocaleString('ru-RU');
}

function formatDate(value?: string | null) {
    if (!value) return 'Без срока';

    const date = new Date(`${value}T00:00:00`);

    return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatDateTime(value?: string | null) {
    if (!value) return 'Дата не указана';

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

function getShortId(value: string) {
    return value.length > 8 ? value.slice(0, 8) : value;
}

function getColumnTheme(index: number) {
    return statusThemes[index % statusThemes.length];
}

function getTaskTitle(task: TaskDashboardTask) {
    return task.workTypeName || task.materialNames?.[0] || 'Задача заказа';
}

function getOrderLabel(task: TaskDashboardTask) {
    return task.orderNumber || getShortId(task.orderId);
}

function getTeethLabel(task: TaskDashboardTask) {
    return task.toothNumbers.length > 0
        ? task.toothNumbers.join(', ')
        : 'не указаны';
}

function buildStatusOptions(columns: TaskDashboardColumn[]) {
    const used = new Set<string>();

    return columns.reduce<StatusOption[]>((options, column) => {
        const value = column.statusId || column.statusCode;

        if (!value || used.has(value)) return options;

        used.add(value);
        options.push({
            value,
            label: column.statusName || column.statusCode,
            statusId: column.statusId,
        });

        return options;
    }, []);
}

function MetricCard({
    label,
    value,
    accentClassName,
    toneClassName,
}: {
    label: string;
    value: number;
    accentClassName: string;
    toneClassName: string;
}) {
    return (
        <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-950/5">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <span className={`h-2.5 w-2.5 rounded-full ${accentClassName}`} />
            </div>
            <p className={`mt-5 text-3xl font-black tracking-tight ${toneClassName}`}>
                {formatNumber(value)}
            </p>
            <p className="mt-2 text-[11px] text-slate-400">Актуальные данные</p>
        </article>
    );
}

function TaskCard({ task }: { task: TaskDashboardTask }) {
    const patientInitial = (task.patientName || 'П').trim().charAt(0).toLocaleUpperCase('ru-RU');

    return (
        <Link
            href={`/orders/${task.orderId}`}
            className={`group relative block overflow-hidden rounded-xl border bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-950/10 ${
                task.isOverdue ? 'border-red-200' : 'border-slate-200'
            }`}
        >
            <span className={`absolute inset-y-0 left-0 w-1 ${task.isOverdue ? 'bg-red-500' : 'bg-violet-500 opacity-0 transition group-hover:opacity-100'}`} />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                        Заказ {getOrderLabel(task)}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-slate-900">
                        {getTaskTitle(task)}
                    </h3>
                </div>

                <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${
                        task.isOverdue
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3 w-3" aria-hidden="true"><circle cx="12" cy="12" r="9" strokeWidth="2" /><path d="M12 7v5l3 2" strokeWidth="2" strokeLinecap="round" /></svg>
                    {formatDate(task.deadline)}
                </span>
            </div>

            <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-black text-violet-700">{patientInitial}</span>
                <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">{task.patientName || 'Пациент не указан'}</p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">{task.clinicName || 'Клиника не указана'}</p>
                </div>
            </div>

            <dl className="mt-2.5 space-y-1.5 text-[10px] text-slate-500">
                <div className="flex justify-between gap-3">
                    <dt>Врач</dt>
                    <dd className="max-w-36 truncate text-right font-semibold text-slate-700" title={task.doctorName || 'Не указан'}>
                        {task.doctorName || 'Не указан'}
                    </dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt>Техник</dt>
                    <dd className="max-w-36 truncate text-right font-semibold text-slate-700" title={task.technicianName || 'Не назначен'}>
                        {task.technicianName || 'Не назначен'}
                    </dd>
                </div>
            </dl>

            <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-100 pt-2.5 text-[9px] font-semibold text-slate-600">
                <MaterialChips materialNames={task.materialNames} compact />
                <span className="rounded-md bg-slate-100 px-2 py-1">Цвет: {task.colorCode || '—'}</span>
                <span className="rounded-md bg-slate-100 px-2 py-1">{formatNumber(task.quantity)} ед.</span>
                <span className="rounded-md bg-slate-100 px-2 py-1">Зубы: {getTeethLabel(task)}</span>
            </div>
        </Link>
    );
}

function DashboardSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
            ))}
        </div>
    );
}

export default function Dashboard() {
    const [search, setSearch] = useState('');
    const [workTypeCode, setWorkTypeCode] = useState('');
    const [selectedStatusKey, setSelectedStatusKey] = useState('');
    const [selectedStatusId, setSelectedStatusId] = useState<string | undefined>();
    const [selectedStatusLabel, setSelectedStatusLabel] = useState('');

    const dashboardFilters = useMemo(
        () => ({
            search,
            workTypeCode,
            statusId: selectedStatusId,
        }),
        [search, workTypeCode, selectedStatusId]
    );

    const {
        data,
        isError,
        isFetching,
        isLoading,
        refetch,
    } = useGetTasksDashboardQuery(dashboardFilters);

    const columns = useMemo(() => data?.columns ?? [], [data?.columns]);
    const statusOptions = useMemo(() => buildStatusOptions(columns), [columns]);
    const visibleStatusOptions = useMemo(() => {
        if (
            !selectedStatusKey ||
            statusOptions.some((option) => option.value === selectedStatusKey)
        ) {
            return statusOptions;
        }

        return [
            {
                value: selectedStatusKey,
                label: selectedStatusLabel || 'Выбранный статус',
                statusId: selectedStatusId,
            },
            ...statusOptions,
        ];
    }, [selectedStatusId, selectedStatusKey, selectedStatusLabel, statusOptions]);

    const visibleColumns = useMemo(() => {
        const statusColumns = !selectedStatusKey || selectedStatusId ? columns : columns.filter((column) => {
            const value = column.statusId || column.statusCode;

            return value === selectedStatusKey;
        });

        if (!search.trim()) return statusColumns;

        return statusColumns.map((column) => {
            const tasks = column.tasks.filter((task) => taskMatchesMaterialSearch(task, search));
            return { ...column, tasks, count: tasks.length };
        });
    }, [columns, search, selectedStatusId, selectedStatusKey]);

    const visibleTaskCount = visibleColumns.reduce(
        (count, column) => count + column.tasks.length,
        0
    );
    const hasFilters = Boolean(
        search.trim() || workTypeCode.trim() || selectedStatusKey
    );

    const handleStatusChange = (value: string) => {
        const option = statusOptions.find((item) => item.value === value);

        setSelectedStatusKey(value);
        setSelectedStatusId(option?.statusId);
        setSelectedStatusLabel(option?.label ?? '');
    };

    const resetFilters = () => {
        setSearch('');
        setWorkTypeCode('');
        setSelectedStatusKey('');
        setSelectedStatusId(undefined);
        setSelectedStatusLabel('');
    };

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-6">
            <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                        Дэшборд
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Сводка по задачам лаборатории, этапам выполнения и последним завершенным работам.
                    </p>
                </div>

                <div className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    {isFetching && !isLoading ? 'Обновление...' : `Показано задач: ${formatNumber(visibleTaskCount)}`}
                </div>
            </header>

            {isLoading ? (
                <DashboardSkeleton />
            ) : (
                <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <MetricCard
                        label="Всего задач"
                        value={data?.totalTasksCount ?? 0}
                        accentClassName="bg-slate-500"
                        toneClassName="text-slate-900"
                    />
                    <MetricCard
                        label="В работе"
                        value={data?.inProgressTasksCount ?? 0}
                        accentClassName="bg-blue-500"
                        toneClassName="text-blue-700"
                    />
                    <MetricCard
                        label="На проверке"
                        value={data?.onReviewTasksCount ?? 0}
                        accentClassName="bg-violet-500"
                        toneClassName="text-violet-700"
                    />
                    <MetricCard
                        label="Просрочено"
                        value={data?.overdueTasksCount ?? 0}
                        accentClassName="bg-red-500"
                        toneClassName="text-red-700"
                    />
                </section>
            )}

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(11rem,1fr)_minmax(11rem,1fr)_auto]">
                    <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-500">
                            Поиск
                        </span>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Заказ, пациент, клиника, врач, материал"
                            className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-500">
                            Код работы
                        </span>
                        <input
                            value={workTypeCode}
                            onChange={(event) => setWorkTypeCode(event.target.value)}
                            placeholder="workTypeCode"
                            className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-500">
                            Статус
                        </span>
                        <select
                            value={selectedStatusKey}
                            onChange={(event) => handleStatusChange(event.target.value)}
                            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                        >
                            <option value="">Все статусы</option>
                            {visibleStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={resetFilters}
                            disabled={!hasFilters}
                            className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 lg:w-auto"
                        >
                            Сбросить
                        </button>
                    </div>
                </div>
            </section>

            {isError && (
                <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold">
                            Не удалось загрузить задачи для главного дэшборда.
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="min-h-10 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition hover:bg-red-700"
                        >
                            Повторить
                        </button>
                    </div>
                </section>
            )}

            <section className="space-y-3">
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div>
                        <div className="flex items-center gap-2.5"><h2 className="text-sm font-bold text-slate-900">Производственный поток</h2><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">{visibleColumns.length} этапов</span></div>
                        <p className="mt-1 text-xs text-slate-400">Задачи распределены по текущему статусу</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-slate-50 px-3 py-2"><span className="text-[10px] text-slate-400">Видимых задач</span><strong className="ml-2 text-sm text-slate-900">{formatNumber(visibleTaskCount)}</strong></div>
                        {hasFilters && <span className="rounded-xl bg-violet-50 px-3 py-2 text-[10px] font-bold text-violet-700">Фильтры активны</span>}
                    </div>
                </div>
                <div className="overflow-x-auto pb-3 [scrollbar-color:#8b5cf6_transparent]">
                <div className="flex min-w-max snap-x snap-mandatory gap-3 pb-2">
                    {visibleColumns.map((column, index) => {
                        const theme = getColumnTheme(index);
                        return (
                        <div
                            key={column.statusId || column.statusCode || column.statusName}
                            className={`flex h-[min(680px,72dvh)] w-[16.5rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-slate-50 shadow-sm dark:bg-slate-950 2xl:w-[17rem] ${theme.border}`}
                        >
                            <div className={`sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-br ${theme.glow} to-white p-3 backdrop-blur dark:border-slate-700 dark:to-slate-900`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className={`h-3 w-3 shrink-0 rounded-full shadow-sm ring-4 ring-white dark:ring-slate-800 ${theme.dot}`} />
                                        <div className="min-w-0"><h2 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                                            {column.statusName || column.statusCode}
                                        </h2>
                                        {column.statusCode && (
                                            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                                                {column.statusCode}
                                            </p>
                                        )}</div>
                                    </div>

                                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${theme.badge}`}>
                                        {formatNumber(column.count)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-2.5 overflow-y-auto p-2.5">
                                {column.tasks.length === 0 ? (
                                    <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-500">
                                        Нет задач на этом этапе
                                    </div>
                                ) : (
                                    column.tasks.map((task) => (
                                        <TaskCard key={task.id} task={task} />
                                    ))
                                )}
                            </div>
                        </div>
                    );})}
                </div>
                </div>

                {!isLoading && !isError && visibleColumns.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
                        По выбранным фильтрам задач нет
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">
                            Последние завершенные задачи
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Всего завершено: {formatNumber(data?.totalCompletedCount)}
                        </p>
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {(data?.recentCompletedTasks ?? []).length === 0 ? (
                        <div className="p-6 text-sm text-slate-400">
                            Пока нет завершенных задач
                        </div>
                    ) : (
                        data?.recentCompletedTasks.map((task) => (
                            <div
                                key={task.id}
                                className="grid grid-cols-1 gap-3 p-4 text-sm md:grid-cols-[1.3fr_1fr_1fr_1fr] md:items-center"
                            >
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900">
                                        {task.workTypeName || 'Завершенная задача'}
                                    </p>
                                    <p className="mt-1 text-xs text-blue-600">
                                        Заказ {task.orderNumber || getShortId(task.id)}
                                    </p>
                                </div>

                                <p className="text-slate-600">
                                    {task.patientName || 'Пациент не указан'}
                                </p>

                                <p className="text-slate-600">
                                    {task.technicianName || 'Техник не указан'}
                                </p>

                                <p className="text-left font-semibold text-emerald-700 md:text-right">
                                    {formatDateTime(task.completedAt)}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
