'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';

import {
    getKpiColor,
    getStatusBadge,
    getStatusLabel,
} from '@/src/utils/employeesUtils';
import CreateEmployeeModal from '@/src/components/Modals/CreateEmployeeModal';
import { useDeleteUserMutation, useGetUsersQuery } from "@/src/services/api/usersApi";
import ErrorState from '@/src/components/ui/ErrorState';
import { useGetRolesQuery } from '@/src/services/api/rolesApi';
import type { RootState } from '@/src/lib/store';


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
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{title}</p><span className="h-2.5 w-2.5 rounded-full bg-violet-500" /></div>
            <p className="mt-5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{value}</p>
            <p className="mt-2 text-xs text-slate-400">{description}</p>
        </div>
    );
}

export default function EmployeesPage() {
    const [search, setSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('ALL');
    const [showFiredEmployees, setShowFiredEmployees] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const {
        data: users = [],
        isLoading,
        isError,
    } = useGetUsersQuery();
    const jwtRoles = useSelector((state: RootState) => state.auth.roles);
    const isAdmin = jwtRoles.some(
        (role) => role.toUpperCase().replace(/^ROLE_/u, '') === 'ADMIN'
    );
    const { data: availableRoles = [] } = useGetRolesQuery(undefined, {
        skip: !isAdmin,
    });
    const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();
    const filteredEmployees = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return users.filter((employee) => {
            const matchesRole =
                selectedRole === 'ALL'
                || employee.roles?.includes(selectedRole)
                || employee.role === selectedRole;

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

    const handleDeleteUser = async (id: string, fullName: string) => {
        const shouldDelete = window.confirm(`Удалить сотрудника "${fullName}"?`);
        if (!shouldDelete) return;

        try {
            await deleteUser(id).unwrap();
        } catch (error) {
            console.error('User delete failed:', error);
        }
    };

    if (isLoading) {
        return <div className="text-sm text-slate-500">Загрузка сотрудников...</div>;
    }

    if (isError) {
        return (
            <ErrorState>
                Ошибка загрузки сотрудников
            </ErrorState>
        );
    }

    return (
        <div className="mx-auto max-w-[1600px] space-y-5 pb-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950">Сотрудники</h1>
                    <p className="text-sm text-slate-500">
                        Производительность, нагрузка и дисциплина команды
                    </p>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-950/15 transition-all hover:bg-violet-700 active:scale-95 md:w-auto"
                    >
                        + Добавить сотрудника
                    </button>
                )}
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
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 sm:max-w-sm"
                        />

                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white sm:w-56"
                        >
                            <option value="ALL">Все роли</option>
                            {availableRoles.map((option) => (
                                <option key={option.id} value={option.code}>
                                    {option.name} — {option.code}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="fired-employees" className="flex items-start gap-2 text-sm text-slate-600 sm:items-center">
                            <input
                                id="fired-employees"
                                type="checkbox"
                                checked={showFiredEmployees}
                                onChange={(e) => setShowFiredEmployees(e.target.checked)}
                                className="h-4 w-4 accent-violet-600"
                            />
                            <h3>Показывать уволенных сотрудников</h3>
                        </label>
                    </div>
                    <div className="text-xs font-medium text-slate-400">
                        Найдено: {filteredEmployees.length}
                    </div>
                </div>
            </section>
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <div><h2 className="text-sm font-bold text-slate-900">Команда лаборатории</h2><p className="mt-1 text-xs text-slate-400">Нагрузка, результативность и соблюдение сроков</p></div>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{filteredEmployees.length} сотрудников</span>
                </div>

                <div className="grid max-h-[760px] gap-4 overflow-y-auto p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3 [scrollbar-color:#8b5cf6_transparent]">
                        {filteredEmployees.map((employee) => (
                            <article
                                key={employee.id}
                                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-950/5"
                            >
                                <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 opacity-0 transition group-hover:opacity-100" />
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 text-sm font-black text-violet-700">
                                            {employee.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toLocaleUpperCase('ru-RU')}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2"><p className="truncate text-sm font-black text-slate-900" title={employee.fullName}>
                                                {employee.fullName}
                                            </p><span className={`shrink-0 rounded-lg border px-2 py-1 text-[9px] font-bold uppercase ${getStatusBadge(employee.status)}`}>{getStatusLabel(employee.status)}</span></div>
                                            <p className="mt-1 truncate text-xs text-slate-500">{employee.specialization || 'Специализация не указана'}</p>
                                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600">{employee.roles?.join(', ') || employee.role || 'Роль не назначена'}</p>
                                        </div>
                                    </div>

                                <div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[9px] uppercase text-slate-400">Готово</p><p className="mt-1 text-lg font-black text-slate-900">{employee.stats.completed}</p></div><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[9px] uppercase text-slate-400">В работе</p><p className="mt-1 text-lg font-black text-slate-900">{employee.stats.inProgress}</p></div><div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[9px] uppercase text-slate-400">Просрочено</p><p className={`mt-1 text-lg font-black ${employee.stats.overdue > 0 ? 'text-red-600' : 'text-slate-900'}`}>{employee.stats.overdue}</p></div></div>

                                <div className="mt-4"><div className="mb-1.5 flex items-center justify-between text-[10px]"><span className="text-slate-400">Выполнено вовремя</span><span className={`rounded-md px-2 py-0.5 font-bold ${getKpiColor(employee.stats.timelyPercent)}`}>{employee.stats.timelyPercent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" style={{width: `${Math.max(0, Math.min(100, employee.stats.timelyPercent))}%`}} /></div></div>

                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><div className="text-[10px] text-slate-400"><span>{employee.stats.totalTasks} задач</span><span className="mx-1.5">·</span><span>{employee.stats.avgDays} дн. средний срок</span></div><div className="flex gap-1.5">
                                        <Link
                                            href={`/employees/${employee.id}`}
                                            className="rounded-lg bg-violet-50 px-3 py-1.5 text-[10px] font-bold text-violet-700 transition hover:bg-violet-600 hover:text-white"
                                        >
                                            Открыть
                                        </Link>
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteUser(employee.id, employee.fullName)}
                                                disabled={isDeletingUser}
                                                className="rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                            >
                                                Удалить
                                            </button>
                                        )}
                                    </div></div>
                            </article>
                        ))}

                        {filteredEmployees.length === 0 && (
                            <div className="col-span-full p-12 text-center text-sm text-slate-400">
                                    По текущему фильтру сотрудники не найдены
                            </div>
                        )}
                </div>
            </section>
            {isAdmin && isCreateModalOpen && (
                <CreateEmployeeModal onClose={() => setIsCreateModalOpen(false)} />
            )}
        </div>
    );
}
