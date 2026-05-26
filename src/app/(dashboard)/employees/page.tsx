'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { mockEmployees } from '@/src/mock/employees';
import { EmployeeRole, EmployeeStatus } from '@/src/types/employee.types';
import CreateEmployeeModal from '@/src/components/Modals/CreateEmployeeModal';

const roleOptions: { label: string; value: 'ALL' | EmployeeRole }[] = [
    { label: 'Все роли', value: 'ALL' },
    { label: 'Техники', value: 'TECHNICIAN' },
    { label: 'Операторы', value: 'OPERATOR' },
    { label: 'Диспетчеры', value: 'DISPATCHER' },
    { label: 'Админы', value: 'ADMIN' },
];

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

function getKpiColor(rate: number) {
    if (rate >= 95) return 'bg-green-100 text-green-700';
    if (rate >= 85) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
}

function StatCard({
                      title,
                      value,
                      description,
                  }: {
    title: string;
    value: string | number;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
            <p className="mt-2 text-xs text-slate-400">{description}</p>
        </div>
    );
}

export default function EmployeesPage() {
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState<'ALL' | EmployeeRole>('ALL');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const filteredEmployees = useMemo(() => {
        return mockEmployees.filter((employee) => {
            const matchesRole =
                selectedRole === 'ALL' || employee.role === selectedRole;

            const normalizedSearch = search.trim().toLowerCase();
            const matchesSearch =
                employee.name.toLowerCase().includes(normalizedSearch) ||
                employee.specialization.toLowerCase().includes(normalizedSearch);

            return matchesRole && matchesSearch;
        });
    }, [search, selectedRole]);

    const summary = useMemo(() => {
        const totalEmployees = filteredEmployees.length;
        const busyEmployees = filteredEmployees.filter(
            (employee) => employee.status === 'BUSY'
        ).length;

        const totalInProgress = filteredEmployees.reduce(
            (sum, employee) => sum + employee.stats.inProgress,
            0
        );

        const averageOnTimeRate =
            totalEmployees > 0
                ? Math.round(
                    filteredEmployees.reduce(
                        (sum, employee) => sum + employee.stats.onTimeRate,
                        0
                    ) / totalEmployees
                )
                : 0;

        return {
            totalEmployees,
            busyEmployees,
            totalInProgress,
            averageOnTimeRate,
        };
    }, [filteredEmployees]);

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Сотрудники</h1>
                    <p className="text-sm text-slate-500">
                        Производительность, нагрузка и дисциплина команды
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                    + Добавить сотрудника
                </button>
            </header>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard
                    title="Всего сотрудников"
                    value={summary.totalEmployees}
                    description="С учетом текущего фильтра"
                />
                <StatCard
                    title="Сейчас заняты"
                    value={summary.busyEmployees}
                    description="Статус сотрудников в работе"
                />
                <StatCard
                    title="Работ в процессе"
                    value={summary.totalInProgress}
                    description="Суммарная активная нагрузка"
                />
                <StatCard
                    title="Средний KPI вовремя"
                    value={`${summary.averageOnTimeRate}%`}
                    description="Общий показатель соблюдения сроков"
                />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-4 sm:flex-row">
                        <input
                            type="text"
                            placeholder="Поиск по имени или специализации..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white sm:max-w-sm"
                        />

                        <select
                            value={selectedRole}
                            onChange={(e) =>
                                setSelectedRole(e.target.value as 'ALL' | EmployeeRole)
                            }
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white sm:w-56"
                        >
                            {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="fired-employees" className="flex items-center gap-2">
                            <input id="fired-employees" type="checkbox"/>
                            <h3>Показывать уволенных сотрудников</h3>
                        </label>

                    </div>

                    <div className="text-xs font-medium text-slate-400">
                        Найдено: {filteredEmployees.length}
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Реестр сотрудников
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-275 w-full border-collapse text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[.7rem] uppercase tracking-widest text-slate-400">
                        <tr>
                            <th className="p-4 font-bold">Сотрудник</th>
                            <th className="p-4 font-bold">Роль</th>
                            <th className="p-4 font-bold">Статус</th>
                            <th className="p-4 font-bold">Выполнено</th>
                            <th className="p-4 font-bold">В процессе</th>
                            <th className="p-4 font-bold">Просрочено</th>
                            <th className="p-4 font-bold">Всего задач</th>
                            <th className="p-4 font-bold">Средний срок</th>
                            <th className="p-4 font-bold">Вовремя</th>
                            <th className="p-4 text-right font-bold">Действие</th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                        {filteredEmployees.map((employee) => (
                            <tr
                                key={employee.id}
                                className="transition hover:bg-blue-50/30"
                            >
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                            {employee.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                {employee.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {employee.specialization}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="p-4">
                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${getRoleBadge(
                                                employee.role
                                            )}`}
                                        >
                                            {getRoleLabel(employee.role)}
                                        </span>
                                </td>

                                <td className="p-4">
                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusBadge(
                                                employee.status
                                            )}`}
                                        >
                                            {getStatusLabel(employee.status)}
                                        </span>
                                </td>

                                <td className="p-4 text-sm font-bold text-green-600">
                                    {employee.stats.completed}
                                </td>

                                <td className="p-4 text-sm font-bold text-blue-600">
                                    {employee.stats.inProgress}
                                </td>

                                <td className="p-4 text-sm font-bold text-red-600">
                                    {employee.stats.overdue}
                                </td>

                                <td className="p-4 text-sm font-semibold text-slate-700">
                                    {employee.stats.totalAssigned}
                                </td>

                                <td className="p-4 text-sm text-slate-600">
                                    {employee.stats.averageDays} дн.
                                </td>

                                <td className="p-4">
                                        <span
                                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${getKpiColor(
                                                employee.stats.onTimeRate
                                            )}`}
                                        >
                                            {employee.stats.onTimeRate}%
                                        </span>
                                </td>

                                <td className="p-4 text-right">
                                    <Link
                                        href={`/employees/${employee.id}`}
                                        className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                                    >
                                        Открыть
                                    </Link>
                                </td>
                            </tr>
                        ))}

                        {filteredEmployees.length === 0 && (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="p-10 text-center text-sm text-slate-400"
                                >
                                    По текущему фильтру сотрудники не найдены
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
            {isCreateModalOpen && (
                <CreateEmployeeModal onClose={() => setIsCreateModalOpen(false)} />
            )}
        </div>
    );
}