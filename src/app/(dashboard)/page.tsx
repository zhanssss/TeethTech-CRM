'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useGetTasksDashboardQuery } from '@/src/services/api/tasksDashboardApi';
import type {
    TaskDashboardColumn,
    TaskDashboardTask,
} from '@/src/types/task.types';

type StatusOption = {
    value: string;
    label: string;
    statusId?: string;
};

const statusAccents = [
    'border-t-slate-500',
    'border-t-blue-500',
    'border-t-cyan-500',
    'border-t-amber-500',
    'border-t-violet-500',
    'border-t-emerald-500',
    'border-t-rose-500',
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

function getColumnAccent(index: number) {
    return statusAccents[index % statusAccents.length];
}

function getTaskTitle(task: TaskDashboardTask) {
    return task.workTypeName || task.materialName || 'Задача заказа';
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
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-4 h-1.5 w-10 rounded-full ${accentClassName}`} />
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className={`mt-2 text-3xl font-black ${toneClassName}`}>
                {formatNumber(value)}
            </p>
        </article>
    );
}

function TaskCard({ task }: { task: TaskDashboardTask }) {
    return (
        <Link
            href={`/orders/${task.orderId}`}
            className={`block rounded-lg border bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md ${
                task.isOverdue ? 'border-red-200' : 'border-slate-200'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-bold text-blue-600">
                        Заказ {getOrderLabel(task)}
                    </p>
                    <h3 className="mt-2 text-sm font-bold text-slate-900">
                        {getTaskTitle(task)}
                    </h3>
                </div>

                <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        task.isOverdue
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                    }`}
                >
                    {formatDate(task.deadline)}
                </span>
            </div>

            <dl className="mt-4 space-y-2 text-xs text-slate-500">
                <div className="flex justify-between gap-3">
                    <dt>Пациент</dt>
                    <dd className="text-right font-semibold text-slate-700">
                        {task.patientName || 'Не указан'}
                    </dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt>Клиника</dt>
                    <dd className="text-right font-semibold text-slate-700">
                        {task.clinicName || 'Не указана'}
                    </dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt>Врач</dt>
                    <dd className="text-right font-semibold text-slate-700">
                        {task.doctorName || 'Не указан'}
                    </dd>
                </div>
                <div className="flex justify-between gap-3">
                    <dt>Техник</dt>
                    <dd className="text-right font-semibold text-slate-700">
                        {task.technicianName || 'Не назначен'}
                    </dd>
                </div>
            </dl>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-xs">
                <div>
                    <p className="text-slate-400">Материал</p>
                    <p className="mt-1 font-bold text-slate-700">
                        {task.materialName || '-'}
                    </p>
                </div>
                <div>
                    <p className="text-slate-400">Цвет</p>
                    <p className="mt-1 font-bold text-slate-700">
                        {task.colorCode || '-'}
                    </p>
                </div>
                <div>
                    <p className="text-slate-400">Ед.</p>
                    <p className="mt-1 font-bold text-slate-700">
                        {formatNumber(task.quantity)}
                    </p>
                </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
                Зубы: <span className="font-semibold text-slate-700">{getTeethLabel(task)}</span>
            </p>
        </Link>
    );
}

function DashboardSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white"
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
        if (!selectedStatusKey || selectedStatusId) return columns;

        return columns.filter((column) => {
            const value = column.statusId || column.statusCode;

            return value === selectedStatusKey;
        });
    }, [columns, selectedStatusId, selectedStatusKey]);

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
        <div className="space-y-6">
            <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Дэшборд задач заказов
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Сводка по задачам лаборатории, этапам выполнения и последним завершенным работам.
                    </p>
                </div>

                <div className="flex min-h-11 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm">
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

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(11rem,1fr)_minmax(11rem,1fr)_auto]">
                    <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-500">
                            Поиск
                        </span>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Заказ, пациент, клиника, врач"
                            className="min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                            className="min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-xs font-bold text-slate-500">
                            Статус
                        </span>
                        <select
                            value={selectedStatusKey}
                            onChange={(event) => handleStatusChange(event.target.value)}
                            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                            className="min-h-11 w-full rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300 lg:w-auto"
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

            <section className="overflow-x-auto pb-3">
                <div className="flex min-w-max gap-4">
                    {visibleColumns.map((column, index) => (
                        <div
                            key={column.statusId || column.statusCode || column.statusName}
                            className={`flex h-[min(680px,72dvh)] w-[19rem] shrink-0 flex-col rounded-lg border border-slate-200 border-t-4 bg-slate-50 shadow-sm sm:w-80 ${getColumnAccent(index)}`}
                        >
                            <div className="border-b border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-slate-900">
                                            {column.statusName || column.statusCode}
                                        </h2>
                                        {column.statusCode && (
                                            <p className="mt-1 text-xs text-slate-400">
                                                {column.statusCode}
                                            </p>
                                        )}
                                    </div>

                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                        {formatNumber(column.count)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto p-3">
                                {column.tasks.length === 0 ? (
                                    <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 text-center text-sm text-slate-400">
                                        Нет задач на этом этапе
                                    </div>
                                ) : (
                                    column.tasks.map((task) => (
                                        <TaskCard key={task.id} task={task} />
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {!isLoading && !isError && visibleColumns.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
                        По выбранным фильтрам задач нет
                    </div>
                )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
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
