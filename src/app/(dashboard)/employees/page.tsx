'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
    EmployeeRoleFilter,
    employeeRoleOptions,
} from '@/src/types/employee.types';

import {
    getKpiColor,
    getStatusBadge,
    getStatusLabel,
} from '@/src/utils/employeesUtils';
import CreateEmployeeModal from '@/src/components/Modals/CreateEmployeeModal';
import {useGetUsersQuery} from "@/src/services/api/usersApi";


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
    const [selectedRole, setSelectedRole] = useState<EmployeeRoleFilter>('ALL');
    const [showFiredEmployees, setShowFiredEmployees] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const {
        data: users = [],
        isLoading,
        isError,
    } = useGetUsersQuery();


    const filteredEmployees = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return users.filter((employee) => {
            const matchesRole =
                selectedRole === 'ALL' || employee.role === selectedRole;

            const matchesSearch =
                employee.fullName.toLowerCase().includes(normalizedSearch) ||
                employee.specialization?.toLowerCase().includes(normalizedSearch);

            const matchesStatus =
                showFiredEmployees || employee.status !== 'FIRED';

            return matchesRole && matchesSearch && matchesStatus;
        });
    }, [users, search, selectedRole, showFiredEmployees]);

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
                        (sum, employee) => sum + employee.stats.timelyPercent,
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

    if (isLoading) {
        return <div className="text-sm text-slate-500">Загрузка сотрудников...</div>;
    }

    if (isError) {
        return <div className="text-sm text-red-500">Ошибка загрузки сотрудников</div>;
    }

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
                            onChange={(e) => setSelectedRole(e.target.value as EmployeeRoleFilter)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white sm:w-56"
                        >
                            {employeeRoleOptions.map((option) => (
                                <option key={option.id} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="fired-employees" className="flex items-center gap-2">
                            <input
                                id="fired-employees"
                                type="checkbox"
                                checked={showFiredEmployees}
                                onChange={(e) => setShowFiredEmployees(e.target.checked)}
                            />
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
                                            {employee.fullName[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                {employee.fullName}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {employee.specialization}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="p-4">
                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase `}
                                        >
                                            {employee.role}
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
                                    {employee.stats.totalTasks}
                                </td>

                                <td className="p-4 text-sm text-slate-600">
                                    {employee.stats.avgDays} дн.
                                </td>

                                <td className="p-4">
                                        <span
                                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${getKpiColor(
                                                employee.stats.timelyPercent
                                            )}`}
                                        >
                                            {employee.stats.timelyPercent}%
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