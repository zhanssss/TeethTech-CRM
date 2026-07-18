'use client';

import Link from 'next/link';
import { type FormEvent, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import EmployeeTasksKanban from '@/src/components/employee/EmployeeTasksKanban';
import ErrorState from '@/src/components/ui/ErrorState';
import { RootState } from '@/src/lib/store';
import { useChangeUserPasswordMutation, useGetUsersQuery } from '@/src/services/api/usersApi';
import { mapUserToEmployee } from '@/src/utils/employeesUtils';

const EMPLOYEE_STATUS = {
    ACTIVE: {
        label: 'На смене',
        className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    },
    BUSY: {
        label: 'Занят',
        className: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    },
    OFFLINE: {
        label: 'Не в сети',
        className: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
    },
    FIRED: {
        label: 'Неактивен',
        className: 'border-red-400/30 bg-red-400/10 text-red-200',
    },
} as const;

function getRoleLabel(role: string | null | undefined) {
    switch (role) {
        case 'ADMIN':
            return 'Администратор';
        case 'DISPATCHER':
            return 'Диспетчер';
        case 'OPERATOR':
            return 'Оператор';
        case 'TECHNICIAN':
            return 'Зубной техник';
        default:
            return role ?? 'Сотрудник';
    }
}

function formatJoinedAt(value?: string) {
    if (!value) return 'Дата не указана';

    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function getInitials(value: string | null) {
    return (value ?? 'Сотрудник')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function ProfileLink({
    href,
    title,
    description,
}: {
    href: string;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 transition hover:border-blue-400/40 hover:bg-white/[0.12]"
        >
            <span>
                <span className="block text-sm font-bold text-white">{title}</span>
                <span className="mt-1 block text-xs text-slate-400">{description}</span>
            </span>
            <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg text-blue-200 transition group-hover:translate-x-0.5 group-hover:bg-blue-500 group-hover:text-white"
            >
                →
            </span>
        </Link>
    );
}

function ChangePasswordCard({ userId }: { userId: string | null }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [changeUserPassword, { isLoading }] = useChangeUserPasswordMutation();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');

        if (!userId) {
            setFormError('Не удалось определить пользователя.');
            return;
        }

        if (newPassword.trim().length < 6) {
            setFormError('Новый пароль должен быть не короче 6 символов.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setFormError('Пароли не совпадают.');
            return;
        }

        try {
            await changeUserPassword({
                id: userId,
                newPassword,
            }).unwrap();
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Password change failed:', error);
        }
    };

    return (
        <section
            aria-labelledby="employee-password-title"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                    Безопасность
                </p>
                <h2 id="employee-password-title" className="mt-1 text-lg font-black text-slate-900">
                    Смена пароля
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Обновите пароль для входа в личный кабинет.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-start">
                <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-500">
                        Новый пароль
                    </span>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        autoComplete="new-password"
                        className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-500">
                        Повторите пароль
                    </span>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                </label>

                <button
                    type="submit"
                    disabled={isLoading || !userId}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 lg:mt-6"
                >
                    {isLoading ? 'Сохранение...' : 'Сменить пароль'}
                </button>

                {formError && (
                    <p className="text-sm font-semibold text-red-600 lg:col-span-3">
                        {formError}
                    </p>
                )}
            </form>
        </section>
    );
}

export default function EmployeePage() {
    const { id, name, role } = useSelector((state: RootState) => state.auth);
    const { data: users = [] } = useGetUsersQuery();
    const currentEmployee = useMemo(
        () => {
            const user = users.find((employee) => employee.id === id);
            return user ? mapUserToEmployee(user) : undefined;
        },
        [id, users]
    );
    const displayName = currentEmployee?.name ?? name ?? 'Сотрудник';
    const employeeStatus = EMPLOYEE_STATUS[currentEmployee?.status ?? 'ACTIVE'];

    if (role === 'ADMIN' || role === 'DISPATCHER') {
        return (
            <ErrorState title="Раздел сотрудника">
                Эта страница доступна только сотрудникам, которым назначаются задачи.
            </ErrorState>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6">
            <section
                aria-labelledby="employee-profile-title"
                className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl"
            >
                <div className="relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
                    <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

                    <div className="relative grid gap-7 lg:grid-cols-[1fr_21rem] lg:items-end">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-black shadow-lg shadow-blue-950/40">
                                {getInitials(displayName)}
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${employeeStatus.className}`}
                                    >
                                        <span className="h-2 w-2 rounded-full bg-current" />
                                        {employeeStatus.label}
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-300">
                                        ID {id ?? '—'}
                                    </span>
                                </div>

                                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                                    Профиль сотрудника
                                </p>
                                <h1
                                    id="employee-profile-title"
                                    className="mt-1 truncate text-3xl font-black tracking-tight sm:text-4xl"
                                >
                                    {displayName}
                                </h1>
                                <p className="mt-2 text-sm text-slate-300">
                                    {currentEmployee?.specialization ?? getRoleLabel(role)} ·{' '}
                                    {getRoleLabel(currentEmployee?.role ?? role)}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <ProfileLink
                                href="/employee/calendar"
                                title="Мой календарь"
                                description="Смена, задачи и дедлайны"
                            />
                            <ProfileLink
                                href="/employee/analytics"
                                title="Моя аналитика"
                                description="Результаты и эффективность"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-3">
                    <div className="bg-slate-900 px-5 py-4 sm:px-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Телефон
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-200">
                            {currentEmployee?.phone ?? 'Не указан'}
                        </p>
                    </div>
                    <div className="bg-slate-900 px-5 py-4 sm:px-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Email
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-200">
                            {currentEmployee?.email ?? 'Не указан'}
                        </p>
                    </div>
                    <div className="bg-slate-900 px-5 py-4 sm:px-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            В команде
                        </p>
                        <p className="mt-1 text-sm font-semibold capitalize text-slate-200">
                            с {formatJoinedAt(currentEmployee?.joinedAt)}
                        </p>
                    </div>
                </div>
            </section>

            <ChangePasswordCard userId={id} />
            <EmployeeTasksKanban />
        </div>
    );
}
