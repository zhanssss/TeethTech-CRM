'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import EmployeeAnalyticsPanel from '@/src/components/analytics/EmployeeAnalyticsPanel';
import ErrorState from '@/src/components/ui/ErrorState';
import { mockTasksByEmployee } from '@/src/mock/employeeTasks';
import { useGetUsersQuery } from '@/src/services/api/usersApi';
import type {
    EmployeeRole,
    EmployeeStatus,
    EmployeeTask,
    TaskStatus,
} from '@/src/types/employee.types';
import { mapUserToEmployee } from '@/src/utils/employeesUtils';

type ProfileTab = 'overview' | 'analytics';

function getRoleLabel(role: EmployeeRole) {
    const labels: Partial<Record<EmployeeRole, string>> = {
        TECHNICIAN: 'Техник',
        OPERATOR: 'Оператор',
        DISPATCHER: 'Диспетчер',
        ADMIN: 'Администратор',
    };
    return labels[role] ?? role;
}

function getRoleBadge(role: EmployeeRole) {
    switch (role) {
        case 'TECHNICIAN':
            return 'border-blue-200 bg-blue-50 text-blue-700';
        case 'OPERATOR':
            return 'border-violet-200 bg-violet-50 text-violet-700';
        case 'DISPATCHER':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-700';
    }
}

function getStatusLabel(status: EmployeeStatus) {
    const labels: Record<EmployeeStatus, string> = {
        ACTIVE: 'Активен',
        BUSY: 'Занят',
        OFFLINE: 'Не в сети',
        FIRED: 'Уволен',
    };
    return labels[status] ?? status;
}

function getStatusBadge(status: EmployeeStatus) {
    switch (status) {
        case 'ACTIVE':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'BUSY':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        case 'FIRED':
            return 'border-red-200 bg-red-50 text-red-700';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-500';
    }
}

function getTaskStatusLabel(status: TaskStatus) {
    const labels: Record<TaskStatus, string> = {
        TODO: 'Нужно сделать',
        MODELING: 'Моделирование',
        MILLING: 'Фрезеровка',
        POST_PROCESSING: 'Постобработка',
        DONE: 'Готово',
    };
    return labels[status];
}

function getTaskStatusBadge(status: TaskStatus) {
    switch (status) {
        case 'MODELING':
            return 'border-blue-200 bg-blue-50 text-blue-700';
        case 'MILLING':
            return 'border-violet-200 bg-violet-50 text-violet-700';
        case 'POST_PROCESSING':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        case 'DONE':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-700';
    }
}

function getPriorityMeta(priority: EmployeeTask['priority']) {
    const meta = {
        LOW: { label: 'Низкий', className: 'bg-slate-100 text-slate-600' },
        MEDIUM: { label: 'Средний', className: 'bg-blue-50 text-blue-700' },
        HIGH: { label: 'Высокий', className: 'bg-amber-50 text-amber-700' },
        URGENT: { label: 'Срочно', className: 'bg-red-50 text-red-700' },
    };
    return meta[priority];
}

function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function OverviewStat({ label, value, caption, tone = 'slate' }: {
    label: string;
    value: string | number;
    caption: string;
    tone?: 'slate' | 'blue' | 'red' | 'emerald';
}) {
    const valueTone = {
        slate: 'text-slate-950',
        blue: 'text-blue-700',
        red: 'text-red-600',
        emerald: 'text-emerald-600',
    }[tone];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${valueTone}`}>{value}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{caption}</p>
        </div>
    );
}

export default function EmployeeDetailsPage() {
    const params = useParams<{ id: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
    const { data: users = [], isLoading, isFetching, isError, refetch } = useGetUsersQuery();

    const employee = useMemo(() => {
        const user = users.find((item) => item.id === id);
        return user ? mapUserToEmployee(user) : undefined;
    }, [id, users]);

    const tasks = useMemo(() => mockTasksByEmployee[id] ?? [], [id]);

    if (isLoading) {
        return (
            <div className="space-y-4" aria-busy="true">
                <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <ErrorState title="Профиль недоступен" onRetry={() => void refetch()} isRetrying={isFetching}>
                Не удалось загрузить данные сотрудника.
            </ErrorState>
        );
    }

    if (!employee) {
        return (
            <ErrorState title="Сотрудник не найден">
                <div className="space-y-4">
                    <p>Проверьте ссылку или вернитесь к списку сотрудников.</p>
                    <Link href="/employees" className="inline-flex text-sm font-semibold text-blue-600 hover:underline">
                        ← К сотрудникам
                    </Link>
                </div>
            </ErrorState>
        );
    }

    const doneTasks = tasks.filter((task) => task.status === 'DONE').length;
    const activeTasks = tasks.filter((task) => task.status !== 'DONE').length;
    const urgentTasks = tasks.filter((task) => task.priority === 'URGENT').length;
    const onTimeRate = employee.stats.onTimeRate ?? employee.stats.timelyPercent ?? 0;
    const averageDays = employee.stats.averageDays ?? employee.stats.avgDays ?? 0;

    return (
        <div className="space-y-5 pb-6">
            <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
                <div className="p-5 sm:p-6">
                    <Link href="/employees" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-600 hover:text-blue-700">
                        ← Сотрудники
                    </Link>

                    <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl font-bold text-blue-700 sm:h-20 sm:w-20 sm:text-3xl">
                                {employee.name.trim().charAt(0).toUpperCase() || 'С'}
                            </div>
                            <div className="min-w-0">
                                <h1 className="truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{employee.name}</h1>
                                <p className="mt-1 truncate text-sm text-slate-500">{employee.specialization || 'Специализация не указана'}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getRoleBadge(employee.role)}`}>
                                        {getRoleLabel(employee.role)}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadge(employee.status)}`}>
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                        {getStatusLabel(employee.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:flex">
                            <div className="rounded-xl bg-slate-50 px-4 py-3 text-center sm:min-w-28">
                                <p className="text-2xl font-bold text-slate-950">{employee.stats.inProgress}</p>
                                <p className="text-xs text-slate-500">в работе</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center sm:min-w-28">
                                <p className="text-2xl font-bold text-emerald-700">{onTimeRate}%</p>
                                <p className="text-xs text-emerald-700/70">вовремя</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1 border-t border-slate-200 bg-slate-50 px-3 pt-2 sm:px-5" role="tablist" aria-label="Разделы профиля">
                    {([
                        { id: 'overview' as const, label: 'Обзор' },
                        { id: 'analytics' as const, label: 'Аналитика' },
                    ]).map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative rounded-t-lg px-4 py-3 text-sm font-semibold transition ${
                                activeTab === tab.id ? 'bg-white text-blue-700' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600" />}
                        </button>
                    ))}
                </div>
            </header>

            {activeTab === 'analytics' ? (
                <EmployeeAnalyticsPanel employee={employee} tasks={tasks} />
            ) : (
                <>
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <OverviewStat label="Выполнено" value={employee.stats.completed} caption="Всего завершённых работ" tone="emerald" />
                        <OverviewStat label="В процессе" value={employee.stats.inProgress} caption="Активные текущие задачи" tone="blue" />
                        <OverviewStat label="Просрочено" value={employee.stats.overdue} caption="Задачи с нарушением срока" tone={employee.stats.overdue > 0 ? 'red' : 'slate'} />
                        <OverviewStat label="Средний срок" value={`${averageDays} дн.`} caption="Среднее время выполнения" />
                    </section>

                    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                                <div>
                                    <h2 className="font-bold text-slate-950">Текущие и последние задачи</h2>
                                    <p className="mt-1 text-xs text-slate-500">Работы, закреплённые за сотрудником</p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{tasks.length}</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[820px] text-left">
                                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        <tr>
                                            <th className="px-5 py-3">Заказ</th>
                                            <th className="px-5 py-3">Пациент / работа</th>
                                            <th className="px-5 py-3">Материал</th>
                                            <th className="px-5 py-3">Срок</th>
                                            <th className="px-5 py-3">Статус</th>
                                            <th className="px-5 py-3">Приоритет</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {tasks.map((task) => {
                                            const priority = getPriorityMeta(task.priority);
                                            return (
                                                <tr key={task.id} className="transition hover:bg-slate-50/80">
                                                    <td className="px-5 py-4 text-sm font-mono font-medium text-slate-500">{task.id}</td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-semibold text-slate-900">{task.patient}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{task.workType}</p>
                                                    </td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">{task.material}</td>
                                                    <td className="px-5 py-4 text-sm text-slate-600">{formatDate(task.deadline)}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getTaskStatusBadge(task.status)}`}>
                                                            {getTaskStatusLabel(task.status)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priority.className}`}>{priority.label}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {tasks.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">У сотрудника пока нет задач</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h2 className="font-bold text-slate-950">Контакты</h2>
                                <div className="mt-5 space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Телефон</p>
                                        <p className="mt-1 break-words text-sm font-medium text-slate-700">{employee.phone || 'Не указан'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email</p>
                                        <p className="mt-1 break-all text-sm font-medium text-slate-700">{employee.email || 'Не указан'}</p>
                                    </div>
                                    {employee.joinedAt && (
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">В команде с</p>
                                            <p className="mt-1 text-sm font-medium text-slate-700">{employee.joinedAt}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                    <h2 className="font-bold text-slate-950">Быстрая сводка</h2>
                                    <button type="button" onClick={() => setActiveTab('analytics')} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                                        Подробнее →
                                    </button>
                                </div>
                                <div className="mt-4 divide-y divide-slate-100">
                                    {[
                                        ['Активные задачи', activeTasks],
                                        ['Завершено в списке', doneTasks],
                                        ['Срочные задачи', urgentTasks],
                                        ['Выполнено вовремя', `${onTimeRate}%`],
                                    ].map(([label, value]) => (
                                        <div key={String(label)} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                            <span className="text-sm text-slate-500">{label}</span>
                                            <span className="text-sm font-bold text-slate-950">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
