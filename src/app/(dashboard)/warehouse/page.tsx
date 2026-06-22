'use client';

import { type FormEvent, useMemo, useState } from 'react';
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
} from 'recharts';

import Modal from '@/src/components/ui/Modal';
import { useGetAnalyticsQuery } from '@/src/services/api/analyticsApi';
import {
    useCreateMaterialMutation,
    useGetMaterialsQuery,
} from '@/src/services/api/laboratory/materialApi';
import type {
    CreateMaterialDto,
    Material,
    MaterialUnit,
} from '@/src/types/laboratory-types/materials.types';

type StockStatus = 'ok' | 'warning' | 'critical';

type StockItem = {
    id: string;
    name: string;
    category: string;
    balance: string;
    reserved: string;
    minimum: string;
    status: StockStatus;
};

type Movement = {
    id: string;
    title: string;
    date: string;
    amount: string;
    type: 'income' | 'outcome';
};

type MaterialChartItem = {
    name: string;
    value: number;
    color: string;
};

const fallbackStockItems: StockItem[] = [
    {
        id: 'zirconia',
        name: 'Zirconia HT A2',
        category: 'Диски',
        balance: '18 кг',
        reserved: '5 кг',
        minimum: '10 кг',
        status: 'ok',
    },
    {
        id: 'emax',
        name: 'E-max Press LT',
        category: 'Керамика',
        balance: '700 г',
        reserved: '300 г',
        minimum: '800 г',
        status: 'warning',
    },
    {
        id: 'pmma',
        name: 'PMMA Temporary',
        category: 'Временные материалы',
        balance: '400 г',
        reserved: '200 г',
        minimum: '600 г',
        status: 'critical',
    },
    {
        id: 'titanium',
        name: 'Titanium Blank',
        category: 'Металл',
        balance: '22 кг',
        reserved: '4 кг',
        minimum: '12 кг',
        status: 'ok',
    },
];

const movements: Movement[] = [
    {
        id: 'WH-1048',
        title: 'Приход Zirconia HT A2',
        date: '12.06.2026',
        amount: '+12 кг',
        type: 'income',
    },
    {
        id: 'WH-1047',
        title: 'Списание E-max по заказу #TT-2606-017',
        date: '11.06.2026',
        amount: '-200 г',
        type: 'outcome',
    },
    {
        id: 'WH-1046',
        title: 'Возврат остатка PMMA с заказа #TT-2606-014',
        date: '10.06.2026',
        amount: '+150 г',
        type: 'income',
    },
];

const materialColors = ['#3b82f6', '#0ea5e9', '#ec4899', '#71717a', '#10b981'];

const fallbackMaterialData: MaterialChartItem[] = [
    { name: 'Zirconia', value: 45, color: '#3b82f6' },
    { name: 'E-max', value: 30, color: '#0ea5e9' },
    { name: 'PMMA', value: 15, color: '#ec4899' },
    { name: 'Titanium', value: 10, color: '#71717a' },
];

const statusLabels: Record<StockStatus, string> = {
    ok: 'Достаточно',
    warning: 'На грани',
    critical: 'Критично',
};

const statusClasses: Record<StockStatus, string> = {
    ok: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-100 bg-amber-50 text-amber-700',
    critical: 'border-red-100 bg-red-50 text-red-700',
};

function formatQuantity(quantity?: number, unit?: MaterialUnit) {
    if (typeof quantity !== 'number' || !Number.isFinite(quantity)) return '—';
    return `${quantity.toLocaleString('ru-RU')} ${unit === 'KG' ? 'кг' : 'г'}`;
}

function getMaterialChartData(materialShares?: Record<string, number>): MaterialChartItem[] {
    const entries = Object.entries(materialShares ?? {}).filter(([, value]) => value > 0);

    if (entries.length === 0) return fallbackMaterialData;

    return entries.map(([name, value], index) => ({
        name: name.replaceAll('_', ' '),
        value,
        color: materialColors[index % materialColors.length],
    }));
}

function getStockItems(materials: Material[]): StockItem[] {
    if (materials.length === 0) return fallbackStockItems;

    return materials.map((material) => ({
        id: material.id,
        name: material.name,
        category: material.description || 'Без категории',
        balance: formatQuantity(material.quantity, material.unit),
        reserved: '—',
        minimum: '—',
        status: 'ok',
    }));
}

export default function WarehousePage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formError, setFormError] = useState('');
    const [form, setForm] = useState<CreateMaterialDto>({
        name: '',
        description: '',
        quantity: 0,
        unit: 'G',
        price: 0,
    });

    const { data: materials = [], isLoading: isMaterialsLoading } = useGetMaterialsQuery();
    const { data: analytics } = useGetAnalyticsQuery();
    const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();

    const stockItems = useMemo(() => getStockItems(materials), [materials]);
    const materialData = useMemo(
        () => getMaterialChartData(analytics?.materialShares),
        [analytics?.materialShares]
    );

    const warehouseStats = useMemo(
        () => [
            {
                title: 'Материалов в наличии',
                value: String(stockItems.length),
                description: 'Активные позиции склада',
                accent: 'border-l-blue-500',
            },
            {
                title: 'Низкий остаток',
                value: String(stockItems.filter((item) => item.status !== 'ok').length),
                description: 'Позиции, требующие внимания',
                accent: 'border-l-amber-500',
            },
            {
                title: 'Зарезервировано',
                value: '38',
                description: 'Под активные заказы лаборатории',
                accent: 'border-l-purple-500',
            },
        ],
        [stockItems]
    );

    const handleCreateMaterial = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');

        if (!form.name.trim() || form.quantity <= 0 || form.price < 0) {
            setFormError('Укажите название, количество больше нуля и сумму закупки');
            return;
        }

        try {
            await createMaterial({
                ...form,
                name: form.name.trim(),
                description: form.description.trim(),
            }).unwrap();
            setForm({
                name: '',
                description: '',
                quantity: 0,
                unit: 'G',
                price: 0,
            });
            setIsCreateOpen(false);
            setSuccessMessage('Материал добавлен на склад');
        } catch {
            setFormError('Не удалось добавить материал');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Склад</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Материалы, остатки, резерв и фактические движения по заказам
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setIsCreateOpen(true);
                        setFormError('');
                        setSuccessMessage('');
                    }}
                    className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 sm:w-auto"
                >
                    + Добавить материал
                </button>
            </header>

            {successMessage && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    <span>{successMessage}</span>
                    <button type="button" onClick={() => setSuccessMessage('')}>×</button>
                </div>
            )}

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {warehouseStats.map((stat) => (
                    <article
                        key={stat.title}
                        className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm sm:p-5 ${stat.accent}`}
                    >
                        <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                        <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                            {stat.value}
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-400">
                            {stat.description}
                        </p>
                    </article>
                ))}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">Остатки по материалам</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Закупочная сумма не используется для расчета цены грамма или килограмма
                        </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {isMaterialsLoading ? 'Загрузка...' : `${stockItems.length} позиций`}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="p-4 font-bold">Материал</th>
                                <th className="p-4 font-bold">Категория / описание</th>
                                <th className="p-4 font-bold">Остаток</th>
                                <th className="p-4 font-bold">Резерв</th>
                                <th className="p-4 font-bold">Минимум</th>
                                <th className="p-4 text-right font-bold">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stockItems.map((item) => (
                                <tr key={item.id} className="transition hover:bg-blue-50/30">
                                    <td className="p-4 text-sm font-bold text-slate-900">
                                        {item.name}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {item.category}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-slate-800">
                                        {item.balance}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {item.reserved}
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {item.minimum}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClasses[item.status]}`}>
                                            {statusLabels[item.status]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-slate-900">Движение склада</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Приход, списание и возврат остатков с заказов
                            </p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            Последние
                        </span>
                    </div>

                    <div className="mt-5 space-y-3">
                        {movements.map((movement) => (
                            <article
                                key={movement.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="font-mono text-xs font-bold text-slate-400">
                                            #{movement.id}
                                        </p>
                                        <h3 className="mt-1 text-sm font-bold text-slate-900">
                                            {movement.title}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {movement.date}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                                        movement.type === 'income'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {movement.amount}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="flex min-h-[360px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="font-bold text-slate-900">Доля материалов</h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Распределение фактического использования материалов
                    </p>
                    <div className="mt-4 min-h-[280px] flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={materialData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={72}
                                    outerRadius={108}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {materialData.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    }}
                                />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px', color: '#475569' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {isCreateOpen && (
                <Modal contentClassName="max-w-2xl p-0">
                    <form onSubmit={handleCreateMaterial} className="p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Добавить материал на склад
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Цена — полная сумма закупки указанного количества.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                aria-label="Закрыть"
                                className="rounded-lg px-2 py-1 text-xl font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Название материала
                                </span>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                    placeholder="Например, Zirconia HT A2"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Описание / категория
                                </span>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                                    rows={3}
                                    placeholder="Керамика, диски, металл..."
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </label>

                            <div className="grid gap-3 sm:grid-cols-[1fr_9rem_1fr]">
                                <label>
                                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Количество
                                    </span>
                                    <input
                                        required
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.quantity || ''}
                                        onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                </label>

                                <label>
                                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Единица
                                    </span>
                                    <select
                                        value={form.unit}
                                        onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value as MaterialUnit }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                    >
                                        <option value="G">г</option>
                                        <option value="KG">кг</option>
                                    </select>
                                </label>

                                <label>
                                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Сумма закупки, ₸
                                    </span>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.price || ''}
                                        onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                </label>
                            </div>

                            <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
                                Система сохранит количество и общую сумму партии без расчета цены за грамм или килограмм.
                            </p>

                            {formError && (
                                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                                    {formError}
                                </p>
                            )}

                            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                >
                                    {isCreating ? 'Сохранение...' : 'Добавить на склад'}
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
