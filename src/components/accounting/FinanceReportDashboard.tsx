'use client';

import { useMemo, useState } from 'react';

import type {
    FinanceOrderLine,
    FinanceReport,
    FinanceSalaryLine,
    FinanceWarehouseLine,
} from '@/src/types/finance.types';

type ReportTab = 'orders' | 'salary' | 'warehouse' | 'payments';

const tabs: Array<{ id: ReportTab; label: string }> = [
    { id: 'orders', label: 'Ордера / работы' },
    { id: 'salary', label: 'Зарплата' },
    { id: 'warehouse', label: 'Склад' },
    { id: 'payments', label: 'Оплаты / бухгалтерия' },
];

const paymentTypeLabels: Record<string, string> = {
    FIXED: 'Фиксированная',
    PIECEWORK: 'Сдельная',
    HYBRID: 'Гибридная',
};

const salaryStatusLabels: Record<string, string> = {
    DRAFT: 'Черновик',
    PAID: 'Оплачено',
};

function money(value?: number | null) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'KZT',
        maximumFractionDigits: 2,
    }).format(value ?? 0);
}

function number(value?: number | null) {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 }).format(value ?? 0);
}

function percent(value?: number | null) {
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value ?? 0)} %`;
}

function date(value?: string | null, withTime = true) {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('ru-RU', {
        dateStyle: 'short',
        ...(withTime ? { timeStyle: 'short' as const } : {}),
    }).format(parsed);
}

function ValueCard({
    label,
    value,
    note,
    tone = 'slate',
}: {
    label: string;
    value: string;
    note?: string;
    tone?: 'slate' | 'emerald' | 'amber' | 'violet' | 'blue' | 'rose';
}) {
    const tones = {
        slate: 'border-l-slate-400',
        emerald: 'border-l-emerald-500',
        amber: 'border-l-amber-500',
        violet: 'border-l-violet-500',
        blue: 'border-l-blue-500',
        rose: 'border-l-rose-500',
    };
    return (
        <article className={`rounded-2xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${tones[tone]}`}>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">{value}</p>
            {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
        </article>
    );
}

function Totals({ items }: { items: Array<{ label: string; value: string; tone?: string }> }) {
    return (
        <dl className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
                <div key={item.label} className={`rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800 ${item.tone ?? ''}`}>
                    <dt className="text-[9px] font-black uppercase tracking-wide text-slate-400">{item.label}</dt>
                    <dd className="mt-1 text-sm font-black text-slate-800 dark:text-slate-100">{item.value}</dd>
                </div>
            ))}
        </dl>
    );
}

function EmptyState({ text = 'За выбранный период данных нет.' }: { text?: string }) {
    return <p className="p-10 text-center text-sm font-semibold text-slate-400">{text}</p>;
}

function TableShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="max-h-[620px] overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
            {children}
        </div>
    );
}

const th = 'sticky top-0 z-10 whitespace-nowrap bg-slate-100 px-3 py-3 text-left text-[9px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800';
const td = 'whitespace-nowrap border-t border-slate-100 px-3 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:text-slate-300';

function OrdersTable({ lines }: { lines: FinanceOrderLine[] }) {
    if (!lines.length) return <EmptyState />;
    return (
        <TableShell>
            <table className="min-w-[1900px] w-full">
                <thead><tr>
                    {['Ордер', 'Клиника', 'Пациент', 'Работа', 'Техник', 'Кол-во', 'Цена/ед.', 'Валовая сумма', 'Скидка %', 'Скидка', 'Сумма работ', 'Заработок', 'Ведомость ЗП', 'Завершено'].map((label) => <th key={label} className={th}>{label}</th>)}
                </tr></thead>
                <tbody>{lines.map((line, index) => (
                    <tr key={`${line.orderNumber}-${line.completedAt}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className={`${td} font-black`}>{line.orderNumber || '—'}</td>
                        <td className={td}>{line.clinicName || '—'}</td><td className={td}>{line.patientName || '—'}</td>
                        <td className={td}>{line.workType || '—'}</td><td className={td}>{line.technicianName || '—'}</td>
                        <td className={td}>{number(line.quantity)}</td><td className={td}>{money(line.pricePerUnit)}</td>
                        <td className={td}>{money(line.grossAmount)}</td><td className={td}>{percent(line.discountPercent)}</td>
                        <td className={td}>{money(line.discountAmount)}</td><td className={`${td} font-black`}>{money(line.netAmount)}</td>
                        <td className={td}>{money(line.salaryEarnedAmount)}</td><td className={td}>{line.salaryStatementId || '—'}</td>
                        <td className={td}>{date(line.completedAt)}</td>
                    </tr>
                ))}</tbody>
            </table>
        </TableShell>
    );
}

function SalaryTable({ lines }: { lines: FinanceSalaryLine[] }) {
    if (!lines.length) return <EmptyState />;
    return (
        <TableShell>
            <table className="min-w-[1750px] w-full">
                <thead><tr>
                    {['Сотрудник', 'Начало', 'Конец', 'Тип оплаты', 'Статус', 'Оклад', 'Сдельно', 'Начислено', 'Входящий перенос', 'Исходящий перенос', 'К выплате', 'Задач', 'Оплачено'].map((label) => <th key={label} className={th}>{label}</th>)}
                </tr></thead>
                <tbody>{lines.map((line, index) => (
                    <tr key={`${line.employeeName}-${line.startDate}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className={`${td} font-black`}>{line.employeeName || '—'}</td><td className={td}>{date(line.startDate, false)}</td>
                        <td className={td}>{date(line.endDate, false)}</td><td className={td}>{paymentTypeLabels[line.paymentType] ?? line.paymentType}</td>
                        <td className={td}><span className={`rounded-full px-2 py-1 font-bold ${line.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{salaryStatusLabels[line.status] ?? line.status}</span></td>
                        <td className={td}>{money(line.baseSalaryAmount)}</td><td className={td}>{money(line.pieceworkAmount)}</td>
                        <td className={td}>{money(line.grossAccruedAmount)}</td><td className={td}>{money(line.carryInAmount)}</td>
                        <td className={td}>{money(line.carryOutAmount)}</td><td className={`${td} font-black`}>{money(line.totalAmount)}</td>
                        <td className={td}>{number(line.totalTasksCount)}</td><td className={td}>{date(line.paidAt)}</td>
                    </tr>
                ))}</tbody>
            </table>
        </TableShell>
    );
}

function isPurchase(line: FinanceWarehouseLine) {
    const marker = `${line.movementType} ${line.referenceType}`.toUpperCase();
    return marker.includes('PURCHASE') || marker.includes('RECEIPT') || marker.includes('INCOME');
}

function WarehouseTable({ lines, purchase }: { lines: FinanceWarehouseLine[]; purchase: boolean }) {
    const filtered = lines.filter((line) => isPurchase(line) === purchase);
    if (!filtered.length) return <EmptyState text={purchase ? 'Приходов на склад за период нет.' : 'Списаний в производство за период нет.'} />;
    return (
        <TableShell>
            <table className="min-w-[1900px] w-full">
                <thead><tr>
                    {['Дата', 'Движение', 'Тип основания', 'ID основания', 'Номенклатура', 'Ед.', 'Количество', 'Норма', 'Потери', 'Общая стоимость', 'Стоимость нормы', 'Стоимость потерь', 'Причина'].map((label) => <th key={label} className={th}>{label}</th>)}
                </tr></thead>
                <tbody>{filtered.map((line, index) => (
                    <tr key={`${line.referenceId}-${line.nomenclatureName}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className={td}>{date(line.createdAt)}</td><td className={`${td} font-bold`}>{line.movementType || '—'}</td>
                        <td className={td}>{line.referenceType || '—'}</td><td className={td}>{line.referenceId || '—'}</td>
                        <td className={`${td} font-black`}>{line.nomenclatureName || '—'}</td><td className={td}>{line.unit || '—'}</td>
                        <td className={td}>{number(line.quantity)}</td><td className={td}>{number(line.standardQuantity)}</td>
                        <td className={td}>{number(line.wasteQuantity)}</td><td className={`${td} font-black`}>{money(line.totalCost)}</td>
                        <td className={td}>{money(line.standardCost)}</td><td className={td}>{money(line.wasteCost)}</td>
                        <td className={`${td} max-w-64 whitespace-normal`}>{line.reason || '—'}</td>
                    </tr>
                ))}</tbody>
            </table>
        </TableShell>
    );
}

export default function FinanceReportDashboard({
    report,
    isLoading,
}: {
    report: FinanceReport;
    isLoading: boolean;
}) {
    const [activeTab, setActiveTab] = useState<ReportTab>('orders');
    const order = report.orderAccounting;
    const salary = report.salaryAccounting;
    const warehouse = report.warehouseAccounting;
    const payments = report.paymentAccounting;
    const reconciliation = report.reconciliation;
    const cards = useMemo(() => [
        ['Валовая выручка', money(report.grossRevenue), 'До скидок', 'emerald'],
        ['Скидки', money(report.totalDiscounts), 'Предоставлено клиникам', 'amber'],
        ['Выполненные работы', money(order?.netWorkAmount), `${order?.completedTaskCount ?? report.totalCompletedTasks} задач`, 'blue'],
        ['Полученные оплаты', money(report.netRevenue), `${payments?.paymentCount ?? 0} платежей`, 'emerald'],
        ['ФОТ / ЗП', money(report.totalPayroll), 'Расход периода', 'violet'],
        ['Себестоимость материалов', money(report.materialCost), 'Списано в производство', 'rose'],
        ['Закупки на склад', money(report.inventoryPurchases), 'Складской актив, не расход прибыли', 'blue'],
        ['Прибыль', money(report.grossProfit), 'Без закупок как расхода', report.grossProfit >= 0 ? 'emerald' : 'rose'],
        ['Маржинальность', percent(report.marginPercentage), 'Прибыль / выручка', report.marginPercentage >= 0 ? 'emerald' : 'rose'],
    ] as const, [order, payments, report]);

    if (isLoading) {
        return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-bold text-slate-500">Формируем финансовый отчёт…</div>;
    }

    return (
        <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {cards.map(([label, value, note, tone]) => <ValueCard key={label} label={label} value={value} note={note} tone={tone} />)}
            </section>

            {reconciliation ? (
                <section className={`rounded-2xl border p-5 ${reconciliation.balanced ? 'border-emerald-300 bg-emerald-50/70' : 'border-red-300 bg-red-50'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Сверка бухгалтерии</p><h2 className={`mt-1 text-lg font-black ${reconciliation.balanced ? 'text-emerald-800' : 'text-red-800'}`}>{reconciliation.balanced ? 'Сверка пройдена' : 'Обнаружены расхождения'}</h2></div>
                        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${reconciliation.balanced ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>{reconciliation.balanced ? 'BALANCED' : 'ТРЕБУЕТ ПРОВЕРКИ'}</span>
                    </div>
                    <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            ['Работы минус оплаты', money(reconciliation.netWorkMinusPayments)],
                            ['Разница материалов', money(reconciliation.materialCostDifference)],
                            ['Разница ФОТ', money(reconciliation.payrollDifference)],
                            ['Задач без ведомости ЗП', number(reconciliation.completedTasksWithoutSalaryStatement)],
                            ['Задач без списания', number(reconciliation.completedTasksWithoutMaterialWriteOff)],
                            ['Списаний без задачи', number(reconciliation.stockWriteOffsWithoutCompletedTask)],
                            ['Оплат без ордера', number(reconciliation.paymentsWithoutOrder)],
                        ].map(([label, value]) => <div key={label} className="rounded-xl bg-white/80 px-3 py-2"><dt className="text-[9px] font-black uppercase text-slate-400">{label}</dt><dd className="mt-1 text-sm font-black text-slate-800">{value}</dd></div>)}
                    </dl>
                    {!reconciliation.balanced && reconciliation.warnings.length ? (
                        <ul className="mt-4 space-y-2">{reconciliation.warnings.map((warning, index) => <li key={`${warning}-${index}`} className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700">⚠ {warning}</li>)}</ul>
                    ) : null}
                </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">
                    {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black ${activeTab === tab.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{tab.label}</button>)}
                </div>

                {activeTab === 'orders' ? <><Totals items={[
                    { label: 'Выполнено задач', value: number(order?.completedTaskCount) },
                    { label: 'Валовая сумма', value: money(order?.grossAmount) },
                    { label: 'Скидки', value: money(order?.discountAmount) },
                    { label: 'Сумма выполненных работ', value: money(order?.netWorkAmount) },
                ]} /><OrdersTable lines={order?.lines ?? []} /></> : null}

                {activeTab === 'salary' ? <><Totals items={[
                    { label: 'Ведомостей', value: number(salary?.statementCount) },
                    { label: 'Оплачено задач', value: number(salary?.paidTaskCount) },
                    { label: 'Оклад', value: money(salary?.baseSalaryAmount) },
                    { label: 'Сдельно', value: money(salary?.pieceworkAmount) },
                    { label: 'Начислено', value: money(salary?.grossAccruedAmount) },
                    { label: 'Входящий перенос', value: money(salary?.carryInAmount) },
                    { label: 'Исходящий перенос', value: money(salary?.carryOutAmount) },
                    { label: 'Выплачено', value: money(salary?.totalPaidAmount) },
                ]} /><SalaryTable lines={salary?.lines ?? []} /></> : null}

                {activeTab === 'warehouse' ? <div className="space-y-6"><Totals items={[
                    { label: 'Списаний', value: number(warehouse?.materialWriteOffCount) },
                    { label: 'Стоимость списаний', value: money(warehouse?.materialWriteOffCost) },
                    { label: 'Стоимость нормы', value: money(warehouse?.materialStandardCost) },
                    { label: 'Стоимость потерь', value: money(warehouse?.materialWasteCost) },
                    { label: 'Количество списано', value: number(warehouse?.materialWriteOffQuantity) },
                    { label: 'Приходов по закупкам', value: number(warehouse?.purchaseReceiptCount) },
                    { label: 'Стоимость закупок', value: money(warehouse?.purchaseReceiptCost), tone: 'text-blue-700' },
                ]} /><div><h3 className="mb-2 text-sm font-black text-rose-700">Списания материалов в производство · расход</h3><WarehouseTable lines={warehouse?.lines ?? []} purchase={false} /></div><div><h3 className="mb-2 text-sm font-black text-blue-700">Закупки / приход на склад · складской актив</h3><WarehouseTable lines={warehouse?.lines ?? []} purchase /></div></div> : null}

                {activeTab === 'payments' ? <><Totals items={[
                    { label: 'Количество оплат', value: number(payments?.paymentCount) },
                    { label: 'Получено', value: money(payments?.receivedAmount) },
                ]} />{payments?.lines.length ? <TableShell><table className="min-w-[1100px] w-full"><thead><tr>{['Дата оплаты', 'Счёт', 'Ордер', 'Клиника', 'Сумма', 'Способ оплаты', 'Внешняя ссылка'].map((label) => <th key={label} className={th}>{label}</th>)}</tr></thead><tbody>{payments.lines.map((line, index) => <tr key={`${line.invoiceNumber}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/60"><td className={td}>{date(line.paidAt)}</td><td className={`${td} font-black`}>{line.invoiceNumber || '—'}</td><td className={td}>{line.orderNumber || '—'}</td><td className={td}>{line.clinicName || '—'}</td><td className={`${td} font-black`}>{money(line.amount)}</td><td className={td}>{line.paymentMethod || '—'}</td><td className={td}>{line.externalReference || '—'}</td></tr>)}</tbody></table></TableShell> : <EmptyState />}</> : null}
            </section>
        </div>
    );
}
