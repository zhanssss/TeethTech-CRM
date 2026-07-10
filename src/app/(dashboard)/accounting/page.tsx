'use client';

import { type FormEvent, useMemo, useState } from 'react';

import { useGetFinanceReportQuery } from '@/src/services/api/financeApi';
import {
    useConfirmSalaryStatementMutation,
    useCreateSalaryStatementMutation,
    useGetSalaryConfigQuery,
    useUpsertSalaryConfigMutation,
} from '@/src/services/api/salariesApi';
import { useGetUsersQuery } from '@/src/services/api/usersApi';
import type {
    FinanceReport,
    SalaryPaymentType,
    SalaryStatement,
} from '@/src/types/finance.types';
import type { User } from '@/src/types/user.types';

type SummaryCardProps = {
    title: string;
    value: string;
    description: string;
    accentClassName: string;
};

const emptyReport: FinanceReport = {
    startDate: '',
    endDate: '',
    totalCompletedTasks: 0,
    grossRevenue: 0,
    totalDiscounts: 0,
    netRevenue: 0,
    totalPayroll: 0,
    grossProfit: 0,
    marginPercentage: 0,
};

const paymentTypeLabels: Record<SalaryPaymentType, string> = {
    FIXED: 'Фиксированная',
    PIECEWORK: 'Сдельная',
    HYBRID: 'Гибридная',
};

const roleLabels: Record<string, string> = {
    ADMIN: 'Админ',
    DISPATCHER: 'Диспетчер',
    TECHNICIAN: 'Техник',
    FINANCIER: 'Финансист',
    HEAD_TECHNICIAN: 'Старший техник',
    ROLE_ADMIN: 'Админ',
    ROLE_DISPATCHER: 'Диспетчер',
    ROLE_TECHNICIAN: 'Техник',
};

function padDatePart(value: number) {
    return String(value).padStart(2, '0');
}

function toDatetimeLocalValue(date: Date) {
    return [
        date.getFullYear(),
        padDatePart(date.getMonth() + 1),
        padDatePart(date.getDate()),
    ].join('-') + `T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function getDefaultStartDate() {
    const now = new Date();
    return toDatetimeLocalValue(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0));
}

function getDefaultEndDate() {
    return toDatetimeLocalValue(new Date());
}

function toApiDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function formatMoney(value?: number | null) {
    return `${(value ?? 0).toLocaleString('ru-RU')} ₸`;
}

function formatPercent(value?: number | null) {
    return `${(value ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
}

function formatDateTime(value?: string | null) {
    if (!value) return 'Не указано';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function getUserRole(user: User) {
    const role = user.role || user.roles?.[0] || user.specialization || 'Без роли';
    return roleLabels[role] ?? role;
}

function getUserName(users: User[], userId: string) {
    return users.find((user) => user.id === userId)?.fullName ?? 'Сотрудник';
}

function getInitialPaymentType(user?: User): SalaryPaymentType {
    if (user?.salaryType === 'PER_UNIT') return 'PIECEWORK';
    return 'FIXED';
}

function SummaryCard({
    title,
    value,
    description,
    accentClassName,
}: SummaryCardProps) {
    return (
        <article className={`rounded-lg border border-slate-200 border-l-4 bg-white p-4 shadow-sm sm:p-5 ${accentClassName}`}>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
                {value}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-400">
                {description}
            </p>
        </article>
    );
}

function UserSelect({
    id,
    value,
    users,
    onChange,
    disabled,
}: {
    id: string;
    value: string;
    users: User[];
    onChange: (value: string) => void;
    disabled?: boolean;
}) {
    return (
        <select
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled || users.length === 0}
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
            {users.length === 0 ? (
                <option value="">Нет сотрудников</option>
            ) : (
                users.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.fullName}
                    </option>
                ))
            )}
        </select>
    );
}

export default function AccountingPage() {
    const [reportStart, setReportStart] = useState(getDefaultStartDate);
    const [reportEnd, setReportEnd] = useState(getDefaultEndDate);
    const [selectedConfigUserId, setSelectedConfigUserId] = useState('');
    const [paymentTypeDraft, setPaymentTypeDraft] = useState<SalaryPaymentType | undefined>();
    const [baseSalaryDraft, setBaseSalaryDraft] = useState<string | undefined>();
    const [commissionPercentDraft, setCommissionPercentDraft] = useState<string | undefined>();
    const [configMessage, setConfigMessage] = useState('');
    const [configError, setConfigError] = useState('');
    const [selectedStatementEmployeeId, setSelectedStatementEmployeeId] = useState('');
    const [statementStart, setStatementStart] = useState(getDefaultStartDate);
    const [statementEnd, setStatementEnd] = useState(getDefaultEndDate);
    const [statementComment, setStatementComment] = useState('');
    const [statement, setStatement] = useState<SalaryStatement | null>(null);
    const [statementError, setStatementError] = useState('');
    const [statementMessage, setStatementMessage] = useState('');

    const {
        data: users = [],
        isLoading: isUsersLoading,
        isError: isUsersError,
    } = useGetUsersQuery();
    const firstUserId = users[0]?.id ?? '';
    const configUserId = selectedConfigUserId || firstUserId;
    const statementEmployeeId = selectedStatementEmployeeId || firstUserId;
    const reportRequest = useMemo(
        () => ({
            startDate: toApiDate(reportStart),
            endDate: toApiDate(reportEnd),
        }),
        [reportEnd, reportStart]
    );
    const {
        data: reportData,
        isFetching: isReportFetching,
        isError: isReportError,
        refetch: refetchReport,
    } = useGetFinanceReportQuery(reportRequest);
    const selectedConfigUser = useMemo(
        () => users.find((user) => user.id === configUserId),
        [configUserId, users]
    );
    const {
        data: salaryConfig,
        isFetching: isConfigFetching,
        isError: isConfigLoadError,
    } = useGetSalaryConfigQuery(configUserId, { skip: !configUserId });
    const [upsertSalaryConfig, { isLoading: isSavingConfig }] = useUpsertSalaryConfigMutation();
    const [createSalaryStatement, { isLoading: isCreatingStatement }] = useCreateSalaryStatementMutation();
    const [confirmSalaryStatement, { isLoading: isConfirmingStatement }] = useConfirmSalaryStatementMutation();

    const report = reportData ?? emptyReport;
    const paymentType = paymentTypeDraft ?? salaryConfig?.paymentType ?? getInitialPaymentType(selectedConfigUser);
    const baseSalary = baseSalaryDraft ?? String(salaryConfig?.baseSalary ?? selectedConfigUser?.salary ?? 0);
    const commissionPercent = commissionPercentDraft ?? String(salaryConfig?.commissionPercent ?? 0);
    const statementEmployeeName = statementEmployeeId
        ? getUserName(users, statementEmployeeId)
        : 'Сотрудник';
    const summaryCards = [
        {
            title: 'Валовая выручка',
            value: formatMoney(report.grossRevenue),
            description: `${report.totalCompletedTasks} завершенных задач`,
            accentClassName: 'border-l-emerald-500',
        },
        {
            title: 'Скидки',
            value: formatMoney(report.totalDiscounts),
            description: 'Суммарные скидки клиникам',
            accentClassName: 'border-l-amber-500',
        },
        {
            title: 'ФОТ мастеров',
            value: formatMoney(report.totalPayroll),
            description: 'Начисления за выбранный период',
            accentClassName: 'border-l-purple-500',
        },
        {
            title: 'Чистая прибыль',
            value: formatMoney(report.grossProfit),
            description: `Маржинальность ${formatPercent(report.marginPercentage)}`,
            accentClassName: report.grossProfit >= 0 ? 'border-l-blue-500' : 'border-l-red-500',
        },
    ];

    const handleConfigUserChange = (userId: string) => {
        setSelectedConfigUserId(userId);
        setPaymentTypeDraft(undefined);
        setBaseSalaryDraft(undefined);
        setCommissionPercentDraft(undefined);
        setConfigMessage('');
        setConfigError('');
    };

    const handleConfigSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setConfigError('');
        setConfigMessage('');

        if (!configUserId) {
            setConfigError('Выберите сотрудника.');
            return;
        }

        try {
            await upsertSalaryConfig({
                userId: configUserId,
                paymentType,
                baseSalary: Number(baseSalary) || 0,
                commissionPercent: Number(commissionPercent) || 0,
            }).unwrap();
            setConfigMessage('Схема оплаты сохранена.');
        } catch (error) {
            console.error('Salary config save failed:', error);
            setConfigError('Не удалось сохранить схему оплаты.');
        }
    };

    const handleStatementSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatementError('');
        setStatementMessage('');
        setStatement(null);

        if (!statementEmployeeId) {
            setStatementError('Выберите сотрудника.');
            return;
        }

        try {
            const createdStatement = await createSalaryStatement({
                employeeId: statementEmployeeId,
                startDate: toApiDate(statementStart),
                endDate: toApiDate(statementEnd),
                comment: statementComment.trim() || undefined,
            }).unwrap();
            setStatement(createdStatement);
            setStatementMessage('Ведомость сформирована.');
        } catch (error) {
            console.error('Salary statement create failed:', error);
            setStatementError('Не удалось сформировать ведомость.');
        }
    };

    const handleConfirmStatement = async () => {
        if (!statement?.statementId) return;

        setStatementError('');
        setStatementMessage('');

        try {
            await confirmSalaryStatement(statement.statementId).unwrap();
            setStatement((current) => current ? { ...current, status: 'PAID' } : current);
            setStatementMessage('Выплата подтверждена.');
        } catch (error) {
            console.error('Salary statement confirm failed:', error);
            setStatementError('Не удалось подтвердить выплату.');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Бухгалтерия</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Финансовый отчет, схемы оплаты и зарплатные ведомости
                    </p>
                </div>

                <div className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${
                    report.grossProfit >= 0
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                    Чистый доход:{' '}
                    <span className="font-black">{formatMoney(report.netRevenue)}</span>
                </div>
            </header>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                    <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Начало периода
                        </span>
                        <input
                            type="datetime-local"
                            value={reportStart}
                            onChange={(event) => setReportStart(event.target.value)}
                            className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Конец периода
                        </span>
                        <input
                            type="datetime-local"
                            value={reportEnd}
                            onChange={(event) => setReportEnd(event.target.value)}
                            className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </label>

                    <button
                        type="button"
                        onClick={() => refetchReport()}
                        disabled={isReportFetching}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {isReportFetching ? 'Обновление...' : 'Обновить отчет'}
                    </button>
                </div>

                {isReportError && (
                    <p className="mt-3 text-sm font-semibold text-red-600">
                        Не удалось загрузить финансовый отчет.
                    </p>
                )}

                <p className="mt-3 text-xs text-slate-400">
                    Период отчета: {formatDateTime(report.startDate || reportRequest.startDate)} - {formatDateTime(report.endDate || reportRequest.endDate)}
                </p>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                    <SummaryCard key={card.title} {...card} />
                ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <form
                    onSubmit={handleConfigSubmit}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Схема оплаты</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Оклад, сдельная ставка или гибридная схема для сотрудника
                            </p>
                        </div>
                        {isConfigFetching && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                Загрузка
                            </span>
                        )}
                    </div>

                    <div className="mt-5 space-y-4">
                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold text-slate-500">
                                Сотрудник
                            </span>
                            <UserSelect
                                id="salary-config-user"
                                value={configUserId}
                                users={users}
                                disabled={isUsersLoading}
                                onChange={handleConfigUserChange}
                            />
                        </label>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold text-slate-500">
                                    Тип оплаты
                                </span>
                                <select
                                    value={paymentType}
                                    onChange={(event) => setPaymentTypeDraft(event.target.value as SalaryPaymentType)}
                                    className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="FIXED">Фиксированная</option>
                                    <option value="PIECEWORK">Сдельная</option>
                                    <option value="HYBRID">Гибридная</option>
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold text-slate-500">
                                    Оклад
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    value={baseSalary}
                                    onChange={(event) => setBaseSalaryDraft(event.target.value)}
                                    className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-xs font-bold text-slate-500">
                                    Процент
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={commissionPercent}
                                    onChange={(event) => setCommissionPercentDraft(event.target.value)}
                                    className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                        </div>

                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <span className="font-bold text-slate-800">
                                {selectedConfigUser?.fullName ?? 'Сотрудник'}
                            </span>
                            <span className="mx-2 text-slate-300">/</span>
                            {selectedConfigUser ? getUserRole(selectedConfigUser) : 'роль не указана'}
                            <span className="mx-2 text-slate-300">/</span>
                            {isConfigLoadError ? 'схема еще не настроена' : paymentTypeLabels[paymentType]}
                        </div>

                        {(configError || configMessage) && (
                            <p className={`text-sm font-semibold ${configError ? 'text-red-600' : 'text-emerald-600'}`}>
                                {configError || configMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSavingConfig || !configUserId}
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                        >
                            {isSavingConfig ? 'Сохранение...' : 'Сохранить схему'}
                        </button>
                    </div>
                </form>

                <form
                    onSubmit={handleStatementSubmit}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                    <h2 className="font-bold text-slate-900">Зарплатная ведомость</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Расчет начислений по завершенным задачам за период
                    </p>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <label className="block md:col-span-2">
                            <span className="mb-1.5 block text-xs font-bold text-slate-500">
                                Сотрудник
                            </span>
                            <UserSelect
                                id="salary-statement-user"
                                value={statementEmployeeId}
                                users={users}
                                disabled={isUsersLoading}
                                onChange={setSelectedStatementEmployeeId}
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold text-slate-500">
                                Начало
                            </span>
                            <input
                                type="datetime-local"
                                value={statementStart}
                                onChange={(event) => setStatementStart(event.target.value)}
                                className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold text-slate-500">
                                Конец
                            </span>
                            <input
                                type="datetime-local"
                                value={statementEnd}
                                onChange={(event) => setStatementEnd(event.target.value)}
                                className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>

                        <label className="block md:col-span-2">
                            <span className="mb-1.5 block text-xs font-bold text-slate-500">
                                Комментарий
                            </span>
                            <textarea
                                value={statementComment}
                                onChange={(event) => setStatementComment(event.target.value)}
                                rows={3}
                                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>
                    </div>

                    {(statementError || statementMessage) && (
                        <p className={`mt-3 text-sm font-semibold ${statementError ? 'text-red-600' : 'text-emerald-600'}`}>
                            {statementError || statementMessage}
                        </p>
                    )}

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="submit"
                            disabled={isCreatingStatement || !statementEmployeeId}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            {isCreatingStatement ? 'Расчет...' : 'Сформировать ведомость'}
                        </button>

                        <button
                            type="button"
                            onClick={handleConfirmStatement}
                            disabled={!statement?.statementId || statement.status === 'PAID' || isConfirmingStatement}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-600 px-5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                        >
                            {isConfirmingStatement ? 'Подтверждение...' : 'Подтвердить выплату'}
                        </button>
                    </div>
                </form>
            </section>

            {isUsersError && (
                <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    Не удалось загрузить сотрудников. Настройка зарплат временно недоступна.
                </section>
            )}

            {statement && (
                <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">
                                Ведомость: {statement.employeeName || statementEmployeeName}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {formatDateTime(statement.startDate)} - {formatDateTime(statement.endDate)}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs font-bold">
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
                                {paymentTypeLabels[statement.paymentType]}
                            </span>
                            <span className={`rounded-full px-3 py-1.5 ${
                                statement.status === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                            }`}>
                                {statement.status === 'PAID' ? 'Оплачено' : 'Черновик'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-px bg-slate-100 md:grid-cols-4">
                        <div className="bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Оклад</p>
                            <p className="mt-2 text-xl font-black text-slate-900">{formatMoney(statement.baseSalaryAmount)}</p>
                        </div>
                        <div className="bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Сдельно</p>
                            <p className="mt-2 text-xl font-black text-slate-900">{formatMoney(statement.pieceworkAmount)}</p>
                        </div>
                        <div className="bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Задач</p>
                            <p className="mt-2 text-xl font-black text-slate-900">{statement.totalTaskCount}</p>
                        </div>
                        <div className="bg-white p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Итого</p>
                            <p className="mt-2 text-xl font-black text-emerald-700">{formatMoney(statement.totalAmount)}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse text-left">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="p-4 font-bold">Задача</th>
                                    <th className="p-4 font-bold">Заказ</th>
                                    <th className="p-4 font-bold">Работа</th>
                                    <th className="p-4 font-bold">Кол-во</th>
                                    <th className="p-4 font-bold">Сумма задачи</th>
                                    <th className="p-4 font-bold">Начислено</th>
                                    <th className="p-4 text-right font-bold">Завершено</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {statement.tasks.map((task) => (
                                    <tr key={task.taskId} className="transition hover:bg-blue-50/30">
                                        <td className="p-4 font-mono text-xs font-bold text-slate-500">
                                            {task.taskId}
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-slate-700">
                                            {task.orderNumber}
                                        </td>
                                        <td className="p-4 text-sm text-slate-700">
                                            {task.workTypeName}
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">
                                            {task.quantity}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-800">
                                            {formatMoney(task.taskAmount)}
                                        </td>
                                        <td className="p-4 text-sm font-black text-emerald-700">
                                            {formatMoney(task.earnedAmount)}
                                        </td>
                                        <td className="p-4 text-right text-sm text-slate-500">
                                            {formatDateTime(task.completedAt)}
                                        </td>
                                    </tr>
                                ))}

                                {statement.tasks.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-sm text-slate-400">
                                            В ведомости нет задач за выбранный период.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
