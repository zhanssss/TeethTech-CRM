'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { mockTasksByEmployee } from '@/src/mock/employeeTasks';
import { mockMonthlyHistory } from '@/src/mock/employeeHistory';
import {
    EmployeeRole,
    EmployeeStatus,
    EmployeeTask,
    TaskStatus,
} from '@/src/types/employee.types';
import ErrorState from '@/src/components/ui/ErrorState';
import { useGetUsersQuery } from '@/src/services/api/usersApi';
import { mapUserToEmployee } from '@/src/utils/employeesUtils';


function getRoleLabel(role: EmployeeRole) {
    switch (role) {
        case 'TECHNICIAN':
            return 'Техник';
        case 'OPERATOR':
            return 'Оператор';
        case 'DISPATCHER':
            return 'Диспетчер';
        case 'ADMIN':
            return 'Администратор';
        default:
            return role;
    }
}

function getRoleBadge(role: EmployeeRole) {
    switch (role) {
        case 'TECHNICIAN':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'OPERATOR':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'DISPATCHER':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'ADMIN':
            return 'bg-slate-100 text-slate-700 border-slate-200';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

function getStatusLabel(status: EmployeeStatus) {
    switch (status) {
        case 'ACTIVE':
            return 'Активен';
        case 'BUSY':
            return 'Занят';
        case 'OFFLINE':
            return 'Не в сети';
        default:
            return status;
    }
}

function getStatusBadge(status: EmployeeStatus) {
    switch (status) {
        case 'ACTIVE':
            return 'bg-green-50 text-green-700 border-green-200';
        case 'BUSY':
            return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'OFFLINE':
            return 'bg-slate-100 text-slate-500 border-slate-200';
        default:
            return 'bg-slate-100 text-slate-500 border-slate-200';
    }
}

function getTaskStatusLabel(status: TaskStatus) {
    switch (status) {
        case 'TODO':
            return 'Нужно сделать';
        case 'MODELING':
            return 'Моделирование';
        case 'MILLING':
            return 'Фрезеровка';
        case 'POST_PROCESSING':
            return 'Обработка';
        case 'DONE':
            return 'Готово';
        default:
            return status;
    }
}

function getTaskStatusBadge(status: TaskStatus) {
    switch (status) {
        case 'TODO':
            return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'MODELING':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'MILLING':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'POST_PROCESSING':
            return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'DONE':
            return 'bg-green-50 text-green-700 border-green-200';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

function getPriorityBadge(priority: EmployeeTask['priority']) {
    switch (priority) {
        case 'LOW':
            return 'bg-slate-100 text-slate-600';
        case 'MEDIUM':
            return 'bg-blue-100 text-blue-700';
        case 'HIGH':
            return 'bg-orange-100 text-orange-700';
        case 'URGENT':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
}

function StatCard({
                      title,
                      value,
                      hint,
                  }: {
    title: string;
    value: string | number;
    hint: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{value}</p>
            <p className="mt-2 text-xs text-slate-400">{hint}</p>
        </div>
    );
}

export default function EmployeeDetailsPage() {
    const params = useParams<{ id: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { data: users = [], isLoading, isError } = useGetUsersQuery();

    const employee = useMemo(
        () => {
            const user = users.find((item) => item.id === id);
            return user ? mapUserToEmployee(user) : undefined;
        },
        [id, users]
    );

    const [tasks] = useState<EmployeeTask[]>(mockTasksByEmployee[id] || []);

    if (isLoading) {
        return <div className="text-sm text-slate-500">Загрузка сотрудника...</div>;
    }

    if (isError) {
        return <ErrorState>Не удалось загрузить сотрудника</ErrorState>;
    }

    if (!employee) {
        return (
            <ErrorState title="Сотрудник не найден">
                <div className="space-y-4">
                    <p>Проверь id или вернись в список сотрудников.</p>
                    <Link
                        href="/employees"
                        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
                    >
                        ← Сотрудники
                    </Link>
                </div>
            </ErrorState>
        );
    }

    const doneTasks = tasks.filter((task) => task.status === 'DONE').length;
    const activeTasks = tasks.filter((task) => task.status !== 'DONE').length;
    const urgentTasks = tasks.filter((task) => task.priority === 'URGENT').length;

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <Link
                        href="/employees"
                        className="mb-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
                    >
                        ← Сотрудники
                    </Link>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-black text-blue-700 sm:h-16 sm:w-16 sm:text-2xl">
                            {employee.name[0]}
                        </div>

                        <div>
                            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                                {employee.name}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                {employee.specialization}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getRoleBadge(
                            employee.role
                        )}`}
                    >
                        {getRoleLabel(employee.role)}
                    </span>

                    <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${getStatusBadge(
                            employee.status
                        )}`}
                    >
                        {getStatusLabel(employee.status)}
                    </span>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                <div className="xl:col-span-3 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <StatCard
                        title="Выполнено"
                        value={employee.stats.completed}
                        hint="Всего завершённых работ"
                    />
                    <StatCard
                        title="В процессе"
                        value={employee.stats.inProgress}
                        hint="Активные текущие задачи"
                    />
                    <StatCard
                        title="Просрочено"
                        value={employee.stats.overdue}
                        hint="Задачи с нарушением срока"
                    />
                    <StatCard
                        title="KPI вовремя"
                        value={`${employee.stats.onTimeRate}%`}
                        hint="Доля задач, выполненных вовремя"
                    />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Контакты
                    </p>

                    <div className="mt-4 space-y-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                                Телефон
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {employee.phone}
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                                Email
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {employee.email}
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                                В команде с
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {employee.joinedAt}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Текущие и последние задачи
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] border-collapse text-left lg:min-w-[850px]">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="p-4 font-bold">ID</th>
                                <th className="p-4 font-bold">Пациент</th>
                                <th className="p-4 font-bold">Работа</th>
                                <th className="p-4 font-bold">Материал</th>
                                <th className="p-4 font-bold">Срок</th>
                                <th className="p-4 font-bold">Статус</th>
                                <th className="p-4 font-bold">Приоритет</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                            {tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-blue-50/30 transition">
                                    <td className="p-4 text-sm font-mono text-slate-500">
                                        {task.id}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-slate-800">
                                        {task.patient}
                                    </td>
                                    <td className="p-4 text-sm text-slate-700">
                                        {task.workType}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {task.material}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {task.deadline}
                                    </td>
                                    <td className="p-4">
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${getTaskStatusBadge(
                                                    task.status
                                                )}`}
                                            >
                                                {getTaskStatusLabel(task.status)}
                                            </span>
                                    </td>
                                    <td className="p-4">
                                            <span
                                                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase ${getPriorityBadge(
                                                    task.priority
                                                )}`}
                                            >
                                                {task.priority}
                                            </span>
                                    </td>
                                </tr>
                            ))}

                            {tasks.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-8 text-center text-sm text-slate-400"
                                    >
                                        У сотрудника пока нет задач
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Быстрая сводка
                        </h2>

                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <span className="text-sm text-slate-500">Активные задачи</span>
                                <span className="text-lg font-black text-slate-900">
                                    {activeTasks}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <span className="text-sm text-slate-500">Завершено в списке</span>
                                <span className="text-lg font-black text-green-600">
                                    {doneTasks}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <span className="text-sm text-slate-500">Срочные задачи</span>
                                <span className="text-lg font-black text-red-600">
                                    {urgentTasks}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <span className="text-sm text-slate-500">Средний срок</span>
                                <span className="text-lg font-black text-slate-900">
                                    {employee.stats.averageDays} дн.
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Динамика по месяцам
                        </h2>

                        <div className="mt-4 space-y-4">
                            {mockMonthlyHistory.map((item) => (
                                <div key={item.month}>
                                    <div className="mb-2 flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-600">
                                            {item.month}
                                        </span>
                                        <span className="text-slate-400">
                                            {item.completed} работ
                                        </span>
                                    </div>

                                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-blue-600"
                                            style={{ width: `${Math.min(item.completed * 6, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
