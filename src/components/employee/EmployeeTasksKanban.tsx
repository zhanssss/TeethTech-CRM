'use client';

import Link from 'next/link';
import { useState } from 'react';

import TaskDetailsSidebar from '@/src/components/layout/TaskDetailsSidebar';
import {
    useGetMyTasksKanbanQuery,
    useUpdateTaskStatusMutation,
} from '@/src/services/api/ordersApi';
import type {
    EmployeeKanbanColumn,
    EmployeeKanbanTask,
    Task,
} from '@/src/types/task.types';

type ColumnVariant = 'previous' | 'current' | 'next';

const COLUMN_STYLES: Record<ColumnVariant, {
    accent: string;
    badge: string;
    eyebrow: string;
    emptyText: string;
}> = {
    previous: {
        accent: 'border-t-amber-400',
        badge: 'bg-amber-100 text-amber-800',
        eyebrow: 'Предыдущий этап',
        emptyText: 'На предыдущем этапе задач нет.',
    },
    current: {
        accent: 'border-t-blue-500',
        badge: 'bg-blue-100 text-blue-800',
        eyebrow: 'Мой этап',
        emptyText: 'Сейчас у вас нет задач в работе.',
    },
    next: {
        accent: 'border-t-violet-500',
        badge: 'bg-violet-100 text-violet-800',
        eyebrow: 'Следующий этап',
        emptyText: 'На следующий этап задачи ещё не переданы.',
    },
};

function formatMoney(value: number) {
    return new Intl.NumberFormat('ru-RU').format(value);
}

function getTaskLabel(task: EmployeeKanbanTask) {
    return task.workTypeName || task.workTypeCode || `Задача ${task.id.slice(0, 8)}`;
}

function mapTaskToDetails(task: EmployeeKanbanTask): Task {
    return {
        id: task.id,
        title: getTaskLabel(task),
        status: task.currentStatusFormName || task.currentStatusCode || 'Не указан',
        currentStatusId: task.currentStatusId,
        currentStatusCode: task.currentStatusCode,
        isCompleted: task.isCompleted,
        hasAccess: task.hasAccess,
        orderId: task.orderId,
        type: task.workTypeName,
        material: task.materialName,
        color: task.colorCode,
        technicianId: task.dentalTechnicianFullName,
        units: task.quantity,
        unitPrice: task.quantity > 0 ? task.totalAmount / task.quantity : task.totalAmount,
        discount: 0,
    };
}

function MoveTaskButton({ task }: { task: EmployeeKanbanTask }) {
    const [updateTaskStatus, { isLoading }] = useUpdateTaskStatusMutation();
    const nextStatusId = task.allowedNextStatusIds[0];

    if (!nextStatusId) {
        return (
            <p className="text-xs font-semibold text-slate-400">
                Нет доступного перехода
            </p>
        );
    }

    const handleMoveNext = async () => {
        try {
            await updateTaskStatus({
                taskId: task.id,
                body: {
                    nextStatusId,
                    comment: `Завершён этап: ${task.currentStatusFormName || task.currentStatusCode}`,
                },
            }).unwrap();
        } catch (error) {
            console.error('Task status update failed:', error);
        }
    };

    return (
        <div className="space-y-2" onClick={(event) => event.stopPropagation()}>
            <button
                type="button"
                onClick={handleMoveNext}
                disabled={isLoading}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
                {isLoading ? 'Передача...' : 'Завершить этап'}
                {!isLoading && <span aria-hidden="true" className="ml-2">→</span>}
            </button>

        </div>
    );
}

function EmployeeTaskCard({
    task,
    canMoveNext,
    onOpen,
}: {
    task: EmployeeKanbanTask;
    canMoveNext: boolean;
    onOpen: () => void;
}) {
    const status = task.currentStatusFormName || task.currentStatusCode;

    return (
        <article
            role="button"
            tabIndex={0}
            aria-label={`Открыть детали задачи ${getTaskLabel(task)}`}
            onClick={onOpen}
            onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onOpen();
                }
            }}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
            <div className="flex items-start justify-between gap-3">
                <span className="rounded-md bg-blue-50 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-blue-700">
                    {task.workTypeCode || task.id.slice(0, 8)}
                </span>
                <span className="shrink-0 text-xs font-semibold text-slate-400">
                    {task.quantity} ед.
                </span>
            </div>

            <h3 className="mt-3 text-base font-black leading-snug text-slate-900">
                {getTaskLabel(task)}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
                {task.materialName || 'Материал не указан'}
                {task.colorCode ? ` · цвет ${task.colorCode}` : ''}
            </p>

            {status && (
                <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                    {status}
                </p>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                <div>
                    <dt className="font-bold uppercase tracking-wide text-slate-400">Зубы</dt>
                    <dd className="mt-1 font-semibold text-slate-700">
                        {task.toothNumbers.length ? task.toothNumbers.join(', ') : '—'}
                    </dd>
                </div>
                <div>
                    <dt className="font-bold uppercase tracking-wide text-slate-400">Сумма</dt>
                    <dd className="mt-1 font-black text-slate-900">
                        {formatMoney(task.totalAmount)} ₸
                    </dd>
                </div>
            </dl>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Техник</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                        {task.dentalTechnicianFullName || 'Не назначен'}
                    </p>
                </div>
                <Link
                    href={`/orders/${task.orderId}`}
                    onClick={(event) => event.stopPropagation()}
                    className="shrink-0 text-xs font-bold text-blue-600 hover:underline"
                >
                    Заказ →
                </Link>
            </div>

            {canMoveNext && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                    <MoveTaskButton task={task} />
                </div>
            )}
        </article>
    );
}

function KanbanColumn({
    column,
    variant,
    onOpenTask,
}: {
    column: EmployeeKanbanColumn;
    variant: ColumnVariant;
    onOpenTask: (task: EmployeeKanbanTask) => void;
}) {
    const styles = COLUMN_STYLES[variant];

    return (
        <section className={`min-h-80 rounded-2xl border border-slate-200 border-t-4 bg-slate-50/70 shadow-sm ${styles.accent}`}>
            <header className="rounded-t-xl border-b border-slate-200 bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                            {styles.eyebrow}
                        </p>
                        <h3 className="mt-1 truncate text-sm font-black text-slate-900">
                            {column.title || column.statusName}
                        </h3>
                        {column.title && column.statusName && column.title !== column.statusName && (
                            <p className="mt-1 truncate text-xs text-slate-500">{column.statusName}</p>
                        )}
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${styles.badge}`}>
                        {column.taskCount}
                    </span>
                </div>
            </header>

            <div className="space-y-3 p-3">
                {column.tasks.map((task) => (
                    <EmployeeTaskCard
                        key={task.id}
                        task={task}
                        canMoveNext={variant === 'current'}
                        onOpen={() => onOpenTask(task)}
                    />
                ))}

                {column.tasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-10 text-center text-xs text-slate-500">
                        {styles.emptyText}
                    </div>
                )}
            </div>
        </section>
    );
}

export default function EmployeeTasksKanban() {
    const [selectedTask, setSelectedTask] = useState<EmployeeKanbanTask | null>(null);
    const {
        data,
        isError,
        isFetching,
        isLoading,
        refetch,
    } = useGetMyTasksKanbanQuery();
    const refreshedSelectedTask = selectedTask && data
        ? [
            ...data.previousColumn.tasks,
            ...data.currentColumn.tasks,
            ...data.nextColumn.tasks,
        ].find((task) => task.id === selectedTask.id) ?? selectedTask
        : selectedTask;
    const selectedDetailsTask = refreshedSelectedTask ? mapTaskToDetails(refreshedSelectedTask) : null;

    if (isLoading) {
        return (
            <section aria-busy="true" aria-label="Загрузка задач" className="space-y-4">
                <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
                <div className="grid gap-4 lg:grid-cols-3">
                    {[0, 1, 2].map((item) => (
                        <div key={item} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
                    ))}
                </div>
            </section>
        );
    }

    if (isError || !data) {
        return (
            <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center">
                <h2 className="font-black text-red-900">Не удалось загрузить мои задачи</h2>
                <p className="mt-1 text-sm text-red-700">Проверьте соединение и попробуйте ещё раз.</p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
                >
                    Повторить
                </button>
            </section>
        );
    }

    const totalTasks = data.previousColumn.taskCount
        + data.currentColumn.taskCount
        + data.nextColumn.taskCount;

    return (
        <>
            <section aria-labelledby="employee-tasks-title" className="space-y-5">
                <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                            Рабочая смена
                        </p>
                        <h2 id="employee-tasks-title" className="mt-1 text-2xl font-black text-slate-900">
                            Мои задачи
                        </h2>
                        <p className="mt-1 max-w-2xl text-sm text-slate-500">
                            Персональный фокус: предыдущий, текущий и следующий этапы работы.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
                            Всего: {totalTasks}
                        </span>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-wait disabled:text-slate-400"
                        >
                            {isFetching ? 'Обновление...' : 'Обновить'}
                        </button>
                    </div>
                </header>

                <div className="grid items-start gap-4 lg:grid-cols-3">
                    <KanbanColumn
                        column={data.previousColumn}
                        variant="previous"
                        onOpenTask={setSelectedTask}
                    />
                    <KanbanColumn
                        column={data.currentColumn}
                        variant="current"
                        onOpenTask={setSelectedTask}
                    />
                    <KanbanColumn
                        column={data.nextColumn}
                        variant="next"
                        onOpenTask={setSelectedTask}
                    />
                </div>
            </section>

            <TaskDetailsSidebar
                task={selectedDetailsTask}
                onClose={() => setSelectedTask(null)}
            />
        </>
    );
}
