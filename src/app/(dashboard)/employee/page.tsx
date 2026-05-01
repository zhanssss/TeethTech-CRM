'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/lib/store';
import { mockEmployees } from '@/src/mock/employees';
import { mockTasks } from '@/src/mock/tasks';

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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
            <p className="mt-2 text-xs text-slate-400">{hint}</p>
        </div>
    );
}

function getStatusBadge(status: string) {
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

function getStatusLabel(status: string) {
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

function getPriorityBadge(priority: string) {
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

export default function EmployeePage() {
    const { id, name, role } = useSelector((state: RootState) => state.auth);

    const currentEmployee = useMemo(() => {
        return mockEmployees.find((employee) => employee.id === id);
    }, [id]);

    const myTasks = useMemo(() => {
        return mockTasks.filter((task) => task.technicianId === id);
    }, [id]);

    const completedCount = myTasks.filter((task) => task.status === 'DONE').length;
    const activeTasks = myTasks.filter((task) => task.status !== 'DONE');
    const overdueCount = activeTasks.filter(
        (task) => new Date(task.deadline) < new Date()
    ).length;

    const nearestDeadlineTask = [...activeTasks].sort(
        (a, b) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    )[0];

    if (!currentEmployee) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">
                    Сотрудник не найден
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Для личного кабинета нужен пользователь с ролью TECHNICIAN.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Мой кабинет
                    </h1>
                    <p className="text-sm text-slate-500">
                        Добро пожаловать, {name}. Ваш рабочий профиль и текущая нагрузка.
                    </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                        {name?.[0]}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900">{name}</p>
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                            {role}
                        </p>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard
                    title="Выполнено"
                    value={completedCount}
                    hint="Закрытые задачи сотрудника"
                />
                <StatCard
                    title="В работе"
                    value={activeTasks.length}
                    hint="Активные текущие задачи"
                />
                <StatCard
                    title="Просрочено"
                    value={overdueCount}
                    hint="Задачи с нарушением дедлайна"
                />
                <StatCard
                    title="Всего назначено"
                    value={myTasks.length}
                    hint="Общее количество задач"
                />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Ближайший дедлайн
                    </h2>

                    {nearestDeadlineTask ? (
                        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                                Срочная задача
                            </p>
                            <h3 className="mt-2 text-lg font-bold text-slate-900">
                                {nearestDeadlineTask.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Пациент: {nearestDeadlineTask.patient}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                Срок: {nearestDeadlineTask.deadline}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                Заказ: {nearestDeadlineTask.orderId}
                            </p>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-slate-400">
                            Активных задач нет
                        </p>
                    )}
                </div>

                <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Мои активные задачи
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[850px] w-full border-collapse text-left">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="p-4 font-bold">ID</th>
                                <th className="p-4 font-bold">Заказ</th>
                                <th className="p-4 font-bold">Пациент</th>
                                <th className="p-4 font-bold">Работа</th>
                                <th className="p-4 font-bold">Срок</th>
                                <th className="p-4 font-bold">Статус</th>
                                <th className="p-4 font-bold">Приоритет</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                            {activeTasks.map((task) => (
                                <tr key={task.id} className="transition hover:bg-blue-50/30">
                                    <td className="p-4 text-sm font-mono text-slate-500">
                                        {task.id}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <Link
                                            href={`/orders/${task.orderId}`}
                                            className="font-bold text-blue-600 hover:underline"
                                        >
                                            #{task.orderId}
                                        </Link>
                                    </td>
                                    <td className="p-4 text-sm font-semibold text-slate-800">
                                        {task.patient}
                                    </td>
                                    <td className="p-4 text-sm text-slate-700">
                                        {task.title}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {task.deadline}
                                    </td>
                                    <td className="p-4">
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusBadge(
                                                    task.status
                                                )}`}
                                            >
                                                {getStatusLabel(task.status)}
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

                            {activeTasks.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-8 text-center text-sm text-slate-400"
                                    >
                                        У вас сейчас нет активных задач
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}