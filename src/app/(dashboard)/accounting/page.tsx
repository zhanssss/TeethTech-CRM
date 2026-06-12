'use client';

import { useMemo } from 'react';

import { useGetUsersQuery } from '@/src/services/api/usersApi';
import type { User } from '@/src/types/user.types';

type InvoiceStatus = 'paid' | 'partial' | 'overdue' | 'draft';

type InvoiceRow = {
    id: string;
    client: string;
    date: string;
    amount: number;
    paid: number;
    status: InvoiceStatus;
};

type UserFinanceRow = {
    area: string;
    amount: string;
    invoices: number;
    state: string;
};

const summaryCards = [
    {
        title: 'Выручка за июнь',
        value: '12 480 000 ₸',
        description: '+8.4% к прошлому месяцу',
        accent: 'border-l-emerald-500',
    },
    {
        title: 'К оплате',
        value: '3 240 000 ₸',
        description: '12 счетов ожидают оплаты',
        accent: 'border-l-amber-500',
    },
    {
        title: 'Просрочено',
        value: '680 000 ₸',
        description: '4 счета старше 7 дней',
        accent: 'border-l-red-500',
    },
    {
        title: 'Расходы склада',
        value: '1 920 000 ₸',
        description: 'Материалы и логистика',
        accent: 'border-l-blue-500',
    },
];

const invoices: InvoiceRow[] = [
    {
        id: 'TT-2606-018',
        client: 'Smile Art Clinic',
        date: '12.06.2026',
        amount: 1840000,
        paid: 1840000,
        status: 'paid',
    },
    {
        id: 'TT-2606-017',
        client: 'Dental Park',
        date: '11.06.2026',
        amount: 1260000,
        paid: 760000,
        status: 'partial',
    },
    {
        id: 'TT-2606-016',
        client: 'OrthoLine',
        date: '10.06.2026',
        amount: 680000,
        paid: 0,
        status: 'overdue',
    },
    {
        id: 'TT-2606-015',
        client: 'Nova Dent',
        date: '09.06.2026',
        amount: 990000,
        paid: 0,
        status: 'draft',
    },
];

const cashFlow = [
    {
        title: 'Поступления',
        value: '8 760 000 ₸',
        caption: 'Оплаченные счета и авансы',
        width: 'w-[82%]',
        color: 'bg-emerald-500',
    },
    {
        title: 'Расходы',
        value: '3 110 000 ₸',
        caption: 'Материалы, зарплаты, доставка',
        width: 'w-[46%]',
        color: 'bg-blue-500',
    },
    {
        title: 'Долги клиентов',
        value: '3 240 000 ₸',
        caption: 'Неоплаченные и частичные счета',
        width: 'w-[58%]',
        color: 'bg-amber-500',
    },
];

const userFinanceRows: UserFinanceRow[] = [
    {
        area: 'Счета клиник',
        amount: '2 420 000 ₸',
        invoices: 8,
        state: 'На контроле',
    },
    {
        area: 'Авансы заказов',
        amount: '1 860 000 ₸',
        invoices: 6,
        state: 'Сверено',
    },
    {
        area: 'Закрывающие документы',
        amount: '940 000 ₸',
        invoices: 5,
        state: 'Готовится',
    },
    {
        area: 'Просрочки',
        amount: '680 000 ₸',
        invoices: 4,
        state: 'Нужен звонок',
    },
    {
        area: 'Возвраты и корректировки',
        amount: '220 000 ₸',
        invoices: 2,
        state: 'Проверка',
    },
];

const statusLabels: Record<InvoiceStatus, string> = {
    paid: 'Оплачен',
    partial: 'Частично',
    overdue: 'Просрочен',
    draft: 'Черновик',
};

const statusClasses: Record<InvoiceStatus, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    partial: 'bg-amber-50 text-amber-700 border-amber-100',
    overdue: 'bg-red-50 text-red-700 border-red-100',
    draft: 'bg-slate-50 text-slate-600 border-slate-200',
};

const roleLabels: Record<string, string> = {
    ADMIN: 'Админ',
    DISPATCHER: 'Диспетчер',
    TECHNICIAN: 'Техник',
    ROLE_ADMIN: 'Админ',
    ROLE_DISPATCHER: 'Диспетчер',
    ROLE_TECHNICIAN: 'Техник',
};

function formatMoney(value: number) {
    return `${value.toLocaleString('ru-RU')} ₸`;
}

function getInitials(fullName: string) {
    return fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function getUserRole(user: User) {
    const role = user.role || user.roles?.[0] || user.specialization || 'Без роли';

    return roleLabels[role] ?? role;
}

export default function AccountingPage() {
    const {
        data: users = [],
        isLoading: isUsersLoading,
        isError: isUsersError,
    } = useGetUsersQuery();

    const responsibleUsers = useMemo(
        () =>
            users.slice(0, userFinanceRows.length).map((user, index) => ({
                user,
                finance: userFinanceRows[index],
            })),
        [users]
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Бухгалтерия
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Финансовый обзор лаборатории, счета и ответственные сотрудники
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    Баланс на сегодня:{' '}
                    <span className="font-bold text-slate-900">5 650 000 ₸</span>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                    <article
                        key={card.title}
                        className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-5 shadow-sm ${card.accent}`}
                    >
                        <p className="text-sm font-medium text-slate-500">
                            {card.title}
                        </p>
                        <p className="mt-2 text-3xl font-black text-slate-900">
                            {card.value}
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-400">
                            {card.description}
                        </p>
                    </article>
                ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="font-bold text-slate-900">
                            Последние счета
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Статичный список для макета финансового раздела
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[780px] border-collapse text-left">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="p-4 font-bold">Счет</th>
                                <th className="p-4 font-bold">Клиент</th>
                                <th className="p-4 font-bold">Дата</th>
                                <th className="p-4 font-bold">Сумма</th>
                                <th className="p-4 font-bold">Оплачено</th>
                                <th className="p-4 text-right font-bold">Статус</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                            {invoices.map((invoice) => (
                                <tr
                                    key={invoice.id}
                                    className="transition hover:bg-blue-50/30"
                                >
                                    <td className="p-4 font-mono text-sm font-bold text-slate-500">
                                        #{invoice.id}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-slate-800">
                                        {invoice.client}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {invoice.date}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-slate-800">
                                        {formatMoney(invoice.amount)}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {formatMoney(invoice.paid)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses[invoice.status]}`}
                                        >
                                            {statusLabels[invoice.status]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-slate-900">
                                Денежный поток
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Срез по основным финансовым направлениям
                            </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            Июнь
                        </span>
                    </div>

                    <div className="mt-5 space-y-5">
                        {cashFlow.map((item) => (
                            <div key={item.title}>
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {item.caption}
                                        </p>
                                    </div>
                                    <p className="text-sm font-black text-slate-900">
                                        {item.value}
                                    </p>
                                </div>

                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className={`h-full rounded-full ${item.width} ${item.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">
                            Ответственные по бухгалтерии
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Пользователи загружаются из текущего API пользователей
                        </p>
                    </div>

                    {isUsersLoading && (
                        <span className="text-xs font-bold text-blue-600">
                            Загрузка пользователей...
                        </span>
                    )}

                    {isUsersError && (
                        <span className="text-xs font-bold text-red-600">
                            Пользователи не загрузились
                        </span>
                    )}
                </div>

                <div className="divide-y divide-slate-100">
                    {responsibleUsers.map(({ user, finance }) => (
                        <div
                            key={user.id}
                            className="grid grid-cols-1 gap-4 px-5 py-4 md:grid-cols-[1.2fr_1fr_0.7fr_0.8fr] md:items-center"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-blue-700">
                                    {getInitials(user.fullName)}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">
                                        {user.fullName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {getUserRole(user)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-bold text-slate-800">
                                    {finance.area}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {finance.invoices} счетов в работе
                                </p>
                            </div>

                            <p className="text-sm font-black text-slate-900">
                                {finance.amount}
                            </p>

                            <div className="md:text-right">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                                    {finance.state}
                                </span>
                            </div>
                        </div>
                    ))}

                    {!isUsersLoading && responsibleUsers.length === 0 && (
                        <div className="px-5 py-10 text-center text-sm text-slate-400">
                            Нет пользователей для отображения
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
