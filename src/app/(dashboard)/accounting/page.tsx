'use client';

import { useMemo } from 'react';

import { useGetMaterialsQuery } from '@/src/services/api/laboratory/materialApi';
import { useGetUsersQuery } from '@/src/services/api/usersApi';
import type { Material, MaterialUnit } from '@/src/types/laboratory-types/materials.types';
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

type PayrollRow = {
    id: string;
    fullName: string;
    role: string;
    salaryType?: 'FIXED' | 'PER_UNIT';
    rate: number;
    units: number;
    accrued: number;
};

const REPORT_REVENUE = 12_480_000;
const PAID_REVENUE = 8_760_000;

const invoices: InvoiceRow[] = [
    {
        id: 'TT-2606-018',
        client: 'Smile Art Clinic',
        date: '12.06.2026',
        amount: 1_840_000,
        paid: 1_840_000,
        status: 'paid',
    },
    {
        id: 'TT-2606-017',
        client: 'Dental Park',
        date: '11.06.2026',
        amount: 1_260_000,
        paid: 760_000,
        status: 'partial',
    },
    {
        id: 'TT-2606-016',
        client: 'OrthoLine',
        date: '10.06.2026',
        amount: 680_000,
        paid: 0,
        status: 'overdue',
    },
    {
        id: 'TT-2606-015',
        client: 'Nova Dent',
        date: '09.06.2026',
        amount: 990_000,
        paid: 0,
        status: 'draft',
    },
];

const fallbackMaterialPurchases: Material[] = [
    {
        id: 'purchase-zirconia',
        name: 'Zirconia HT A2',
        description: 'Партия за июнь',
        quantity: 12,
        unit: 'KG',
        price: 920_000,
        isActive: true,
    },
    {
        id: 'purchase-emax',
        name: 'E-max Press LT',
        description: 'Партия за июнь',
        quantity: 800,
        unit: 'G',
        price: 620_000,
        isActive: true,
    },
    {
        id: 'purchase-pmma',
        name: 'PMMA Temporary',
        description: 'Партия за июнь',
        quantity: 4,
        unit: 'KG',
        price: 380_000,
        isActive: true,
    },
];

const statusLabels: Record<InvoiceStatus, string> = {
    paid: 'Оплачен',
    partial: 'Частично',
    overdue: 'Просрочен',
    draft: 'Черновик',
};

const statusClasses: Record<InvoiceStatus, string> = {
    paid: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    partial: 'border-amber-100 bg-amber-50 text-amber-700',
    overdue: 'border-red-100 bg-red-50 text-red-700',
    draft: 'border-slate-200 bg-slate-50 text-slate-600',
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

function formatQuantity(quantity?: number, unit?: MaterialUnit) {
    if (typeof quantity !== 'number' || !Number.isFinite(quantity)) return 'Не указано';
    return `${quantity.toLocaleString('ru-RU')} ${unit === 'KG' ? 'кг' : 'г'}`;
}

function getUserRole(user: User) {
    const role = user.role || user.roles?.[0] || user.specialization || 'Без роли';
    return roleLabels[role] ?? role;
}

function getPayrollRows(users: User[]): PayrollRow[] {
    return users.map((user) => {
        const rate = typeof user.salary === 'number' ? user.salary : 0;
        const units = user.unitsCompleted ?? user.stats.completed;
        const accrued = user.salaryType === 'PER_UNIT' ? rate * units : rate;

        return {
            id: user.id,
            fullName: user.fullName,
            role: getUserRole(user),
            salaryType: user.salaryType,
            rate,
            units,
            accrued,
        };
    });
}

export default function AccountingPage() {
    const {
        data: users = [],
        isLoading: isUsersLoading,
        isError: isUsersError,
    } = useGetUsersQuery();
    const {
        data: materials = [],
        isLoading: isMaterialsLoading,
        isError: isMaterialsError,
    } = useGetMaterialsQuery();

    const payrollRows = useMemo(() => getPayrollRows(users), [users]);
    const materialPurchases = materials.length > 0 ? materials : fallbackMaterialPurchases;

    const payrollTotal = payrollRows.reduce((sum, employee) => sum + employee.accrued, 0);
    const materialTotal = materialPurchases.reduce(
        (sum, material) => sum + (material.price ?? 0),
        0
    );
    const clientDebt = invoices.reduce(
        (sum, invoice) => sum + Math.max(invoice.amount - invoice.paid, 0),
        0
    );
    const payrollShare = REPORT_REVENUE > 0 ? (payrollTotal / REPORT_REVENUE) * 100 : 0;
    const preliminaryProfit = PAID_REVENUE - payrollTotal - materialTotal;

    const summaryCards = [
        {
            title: 'Выручка за июнь',
            value: formatMoney(REPORT_REVENUE),
            description: 'Сумма выставленных заказов',
            accent: 'border-l-emerald-500',
        },
        {
            title: 'Долг клиник',
            value: formatMoney(clientDebt),
            description: 'Неоплаченные и частично оплаченные заказы',
            accent: 'border-l-amber-500',
        },
        {
            title: 'Начислено сотрудникам',
            value: formatMoney(payrollTotal),
            description: `${payrollShare.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}% от выручки`,
            accent: 'border-l-purple-500',
        },
        {
            title: 'Закупки материалов',
            value: formatMoney(materialTotal),
            description: 'Полная стоимость закупленных партий',
            accent: 'border-l-blue-500',
        },
    ];

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Бухгалтерия</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Зарплаты сотрудников, закупки материалов, долги и прибыль по клиникам
                    </p>
                </div>

                <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                    preliminaryProfit >= 0
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                    Предварительная прибыль:{' '}
                    <span className="font-black">{formatMoney(preliminaryProfit)}</span>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                    <article
                        key={card.title}
                        className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm sm:p-5 ${card.accent}`}
                    >
                        <p className="text-sm font-medium text-slate-500">{card.title}</p>
                        <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                            {card.value}
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-400">
                            {card.description}
                        </p>
                    </article>
                ))}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">Зарплата сотрудников</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Фиксированная сумма либо ставка за каждую выполненную единицу
                        </p>
                    </div>
                    <div className="rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700">
                        Доля ФОТ: {payrollShare.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%
                    </div>
                </div>

                {isUsersError && (
                    <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-xs font-semibold text-red-600">
                        Не удалось загрузить сотрудников. Начисления временно не рассчитаны.
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] border-collapse text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="p-4 font-bold">Сотрудник</th>
                                <th className="p-4 font-bold">Схема оплаты</th>
                                <th className="p-4 font-bold">Оклад / ставка</th>
                                <th className="p-4 font-bold">Единиц</th>
                                <th className="p-4 font-bold">Начислено</th>
                                <th className="p-4 text-right font-bold">Доля выручки</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payrollRows.map((employee) => (
                                <tr key={employee.id} className="transition hover:bg-purple-50/30">
                                    <td className="p-4">
                                        <p className="text-sm font-bold text-slate-900">
                                            {employee.fullName}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">{employee.role}</p>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {employee.salaryType === 'PER_UNIT'
                                            ? 'За единицу'
                                            : employee.salaryType === 'FIXED'
                                                ? 'Фиксированная'
                                                : 'Не настроена'}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-slate-800">
                                        {formatMoney(employee.rate)}
                                        {employee.salaryType === 'PER_UNIT' && (
                                            <span className="ml-1 text-xs font-normal text-slate-400">/ ед.</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {employee.salaryType === 'PER_UNIT' ? employee.units : '—'}
                                    </td>
                                    <td className="p-4 text-sm font-black text-slate-900">
                                        {formatMoney(employee.accrued)}
                                    </td>
                                    <td className="p-4 text-right text-sm font-bold text-purple-700">
                                        {REPORT_REVENUE > 0
                                            ? `${((employee.accrued / REPORT_REVENUE) * 100).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`
                                            : '0%'}
                                    </td>
                                </tr>
                            ))}

                            {!isUsersLoading && payrollRows.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-sm text-slate-400">
                                        Добавьте сотрудников и настройте схему оплаты
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h2 className="font-bold text-slate-900">Счета клиник</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Финальная сумма заказа складывается из стоимости его технических задач
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] border-collapse text-left">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="p-4 font-bold">Счет</th>
                                    <th className="p-4 font-bold">Клиника</th>
                                    <th className="p-4 font-bold">Дата</th>
                                    <th className="p-4 font-bold">Сумма</th>
                                    <th className="p-4 font-bold">Оплачено</th>
                                    <th className="p-4 text-right font-bold">Статус</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="transition hover:bg-blue-50/30">
                                        <td className="p-4 font-mono text-sm font-bold text-slate-500">
                                            #{invoice.id}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-800">
                                            {invoice.client}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">{invoice.date}</td>
                                        <td className="p-4 text-sm font-bold text-slate-800">
                                            {formatMoney(invoice.amount)}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {formatMoney(invoice.paid)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses[invoice.status]}`}>
                                                {statusLabels[invoice.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="font-bold text-slate-900">Денежный результат</h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Предварительный срез по подтвержденным поступлениям
                    </p>

                    <div className="mt-5 space-y-4">
                        {[
                            { label: 'Поступило от клиник', value: PAID_REVENUE, color: 'bg-emerald-500' },
                            { label: 'Начислено сотрудникам', value: payrollTotal, color: 'bg-purple-500' },
                            { label: 'Закуплено материалов', value: materialTotal, color: 'bg-blue-500' },
                            { label: 'Долги клиник', value: clientDebt, color: 'bg-amber-500' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold text-slate-700">{item.label}</p>
                                    <p className="text-sm font-black text-slate-900">
                                        {formatMoney(item.value)}
                                    </p>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className={`h-full rounded-full ${item.color}`}
                                        style={{ width: `${Math.min((item.value / REPORT_REVENUE) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 rounded-2xl bg-slate-900 p-4 text-white">
                        <p className="text-xs font-semibold text-slate-400">
                            Поступления − зарплаты − закупки
                        </p>
                        <p className="mt-2 text-2xl font-black">
                            {formatMoney(preliminaryProfit)}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                            Черновой показатель: логика бухгалтерии может быть уточнена после подтверждения ТЗ.
                        </p>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">Закупки материалов</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Учитывается сумма всей партии — цена за грамм или килограмм не рассчитывается
                        </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        {isMaterialsLoading ? 'Загрузка...' : formatMoney(materialTotal)}
                    </span>
                </div>

                {isMaterialsError && (
                    <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-xs font-semibold text-amber-700">
                        API материалов недоступен — показаны демонстрационные партии.
                    </div>
                )}

                <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                    {materialPurchases.map((material) => (
                        <article
                            key={material.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                            <h3 className="text-sm font-bold text-slate-900">{material.name}</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                {material.description || 'Без описания'}
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                        Количество
                                    </p>
                                    <p className="mt-1 text-sm font-black text-slate-900">
                                        {formatQuantity(material.quantity, material.unit)}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-white p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                        Сумма партии
                                    </p>
                                    <p className="mt-1 text-sm font-black text-slate-900">
                                        {formatMoney(material.price ?? 0)}
                                    </p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
