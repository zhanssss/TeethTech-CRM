'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { useSelector } from 'react-redux';

import Modal from '@/src/components/ui/Modal';
import { useNotifications } from '@/src/features/notifications/useNotifications';
import type { RootState } from '@/src/lib/store';
import { useGetWorkTypesQuery } from '@/src/services/api/laboratory/workTypesApi';
import {
    useCreateFlexibleSalaryStatementMutation,
    useCreateSalaryPlanRuleMutation,
    useDeleteSalaryRuleMutation,
    useGetSalaryEmployeesQuery,
    useGetSalaryPlanQuery,
    useLazyGetSalaryCalculationPreviewQuery,
    useUpdateSalaryRuleMutation,
    useUpsertSalaryPlanMutation,
} from '@/src/services/api/salariesApi';
import { useGetOrderStatusesQuery } from '@/src/services/api/workflowApi';
import { getApiErrorMessage } from '@/src/services/apiNotifications';
import type {
    SalaryCalculationType,
    SalaryCapMode,
    SalaryPlan,
    SalaryPlanRule,
    SalaryRuleTreatment,
    UpsertSalaryRuleRequest,
} from '@/src/types/finance.types';

const inputClass =
    'min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';
const LAB_TIMEZONE_OFFSET = '+05:00';

const treatmentLabels: Record<SalaryRuleTreatment, string> = {
    INCLUDED_IN_BASE: 'Включено в оклад',
    PAID_EXTRA: 'Оплачивается дополнительно',
    NOT_PAYABLE: 'Не участвует в зарплате',
    REQUIRES_REVIEW: 'Требует проверки',
};

const calculationLabels: Record<SalaryCalculationType, string> = {
    ONCE_PER_STAGE: 'Один раз за этап',
    TASK_QUANTITY: 'За единицу изделия',
    TEETH_COUNT: 'За зуб',
    PERCENT_OF_TASK: 'Процент от стоимости задачи',
};

type ApiError = FetchBaseQueryError & {
    data?: { message?: string; detail?: string; error?: string } | string;
};

type PlanDraft = {
    name: string;
    baseSalary: string;
    capEnabled: boolean;
    monthlyCap: string;
    capMode: SalaryCapMode;
    carryForward: boolean;
    effectiveFrom: string;
    effectiveTo: string;
    active: boolean;
};

type RuleDraft = {
    name: string;
    workTypeId: string;
    statusId: string;
    treatment: SalaryRuleTreatment;
    calculationType: SalaryCalculationType;
    rate: string;
    priority: string;
    effectiveFrom: string;
    effectiveTo: string;
    active: boolean;
};

const emptyPlan = (): PlanDraft => ({
    name: '',
    baseSalary: '',
    capEnabled: false,
    monthlyCap: '',
    capMode: 'TOTAL',
    carryForward: false,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: '',
    active: true,
});

const emptyRule = (effectiveFrom = new Date().toISOString().slice(0, 10)): RuleDraft => ({
    name: '',
    workTypeId: '',
    statusId: '',
    treatment: 'PAID_EXTRA',
    calculationType: 'TASK_QUANTITY',
    rate: '',
    priority: '100',
    effectiveFrom,
    effectiveTo: '',
    active: true,
});

function planToDraft(plan: SalaryPlan): PlanDraft {
    return {
        name: plan.name ?? '',
        baseSalary: String(plan.baseSalary ?? ''),
        capEnabled: plan.monthlyCap !== null && plan.monthlyCap !== undefined,
        monthlyCap: plan.monthlyCap === null || plan.monthlyCap === undefined
            ? ''
            : String(plan.monthlyCap),
        capMode: plan.capMode ?? 'TOTAL',
        carryForward: Boolean(plan.carryForward),
        effectiveFrom: plan.effectiveFrom ?? '',
        effectiveTo: plan.effectiveTo ?? '',
        active: Boolean(plan.active),
    };
}

function ruleToDraft(rule: SalaryPlanRule): RuleDraft {
    return {
        name: rule.name,
        workTypeId: rule.workTypeId ?? '',
        statusId: rule.statusId ?? '',
        treatment: rule.treatment,
        calculationType: rule.calculationType,
        rate: String(rule.rate ?? 0),
        priority: String(rule.priority ?? 100),
        effectiveFrom: rule.effectiveFrom,
        effectiveTo: rule.effectiveTo ?? '',
        active: rule.active,
    };
}

function parseDecimal(value: string) {
    return Number(value.trim().replace(/\s/gu, '').replace(',', '.'));
}

function formatMoney(value?: number | null) {
    if (value === null || value === undefined) return 'Без лимита';
    return `${new Intl.NumberFormat('ru-KZ', {
        maximumFractionDigits: 2,
    }).format(value)} ₸`;
}

function formatDate(value?: string | null) {
    if (!value) return 'бессрочно';
    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}.${month}.${year}` : value;
}

function toOffsetIso(value: string, endOfDay = false) {
    if (!value) return '';
    return `${value}T${endOfDay ? '23:59:59' : '00:00:00'}${LAB_TIMEZONE_OFFSET}`;
}

function getErrorStatus(error: unknown) {
    return error && typeof error === 'object' && 'status' in error
        ? (error as ApiError).status
        : undefined;
}

function getLocalError(error: unknown, fallback: string) {
    if (getErrorStatus(error) === 403) {
        return 'Недостаточно прав для этой операции';
    }
    return getApiErrorMessage(error, fallback);
}

function getRuleKey(rule: Pick<
    SalaryPlanRule,
    'statusId' | 'workTypeId' | 'effectiveFrom' | 'effectiveTo' | 'priority'
>) {
    return [
        rule.statusId ?? '*',
        rule.workTypeId ?? '*',
        rule.effectiveFrom,
        rule.effectiveTo ?? '',
        rule.priority,
    ].join('|');
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <span className="mb-1.5 block text-xs font-bold text-slate-500">
            {children}
        </span>
    );
}

function Toggle({
    checked,
    onChange,
    label,
    disabled,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 accent-blue-600"
            />
            {label}
        </label>
    );
}

function StateNotice({
    tone,
    children,
}: {
    tone: 'loading' | 'error' | 'empty' | 'info';
    children: React.ReactNode;
}) {
    const styles = {
        loading: 'border-blue-200 bg-blue-50 text-blue-700',
        error: 'border-red-200 bg-red-50 text-red-700',
        empty: 'border-slate-200 bg-slate-50 text-slate-600',
        info: 'border-amber-200 bg-amber-50 text-amber-800',
    };
    return (
        <div className={`rounded-xl border px-4 py-3 text-sm font-medium ${styles[tone]}`}>
            {children}
        </div>
    );
}

function RuleEditor({
    plan,
    rule,
    userId,
    canEdit,
    onClose,
}: {
    plan: SalaryPlan;
    rule: SalaryPlanRule | null;
    userId: string;
    canEdit: boolean;
    onClose: () => void;
}) {
    const { notifySuccess } = useNotifications();
    const [draft, setDraft] = useState<RuleDraft>(() =>
        rule ? ruleToDraft(rule) : emptyRule(plan.effectiveFrom)
    );
    const [error, setError] = useState('');
    const statusesQuery = useGetOrderStatusesQuery();
    const workTypesQuery = useGetWorkTypesQuery();
    const [createRule, createState] = useCreateSalaryPlanRuleMutation();
    const [updateRule, updateState] = useUpdateSalaryRuleMutation();
    const isSaving = createState.isLoading || updateState.isLoading;
    const isZeroRate = ['INCLUDED_IN_BASE', 'NOT_PAYABLE'].includes(draft.treatment);

    const update = <Key extends keyof RuleDraft>(key: Key, value: RuleDraft[Key]) => {
        setDraft((current) => ({ ...current, [key]: value }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        const rate = isZeroRate ? 0 : parseDecimal(draft.rate);
        const priority = Number(draft.priority);
        if (!draft.name.trim()) return setError('Укажите название правила');
        if (!draft.effectiveFrom) return setError('Укажите дату начала действия');
        if (draft.effectiveTo && draft.effectiveTo < draft.effectiveFrom) {
            return setError('Дата окончания не может быть раньше даты начала');
        }
        if (draft.treatment === 'PAID_EXTRA' && (!Number.isFinite(rate) || rate <= 0)) {
            return setError('Для дополнительной оплаты ставка должна быть больше нуля');
        }
        if (!Number.isFinite(rate) || rate < 0) return setError('Укажите корректную ставку');
        if (!Number.isInteger(priority)) return setError('Приоритет должен быть целым числом');

        const body: UpsertSalaryRuleRequest = {
            name: draft.name.trim(),
            workTypeId: draft.workTypeId || null,
            statusId: draft.statusId || null,
            treatment: draft.treatment,
            calculationType: draft.calculationType,
            rate,
            priority,
            effectiveFrom: draft.effectiveFrom,
            effectiveTo: draft.effectiveTo || null,
            active: draft.active,
        };

        try {
            if (rule) {
                await updateRule({ ruleId: rule.id, userId, body }).unwrap();
                notifySuccess('Правило обновлено');
            } else {
                await createRule({ planId: plan.id, userId, body }).unwrap();
                notifySuccess('Правило создано');
            }
            onClose();
        } catch (submitError) {
            setError(getLocalError(submitError, 'Не удалось сохранить правило'));
        }
    };

    return (
        <Modal contentClassName="max-w-3xl p-5 sm:p-6">
            <form onSubmit={handleSubmit}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                            Правило этапа
                        </p>
                        <h2 className="mt-1 text-xl font-black text-slate-900">
                            {rule ? 'Изменить правило' : 'Новое правило'}
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100">
                        Закрыть
                    </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                        <Label>Название</Label>
                        <input className={inputClass} value={draft.name} onChange={(e) => update('name', e.target.value)} />
                    </label>
                    <label>
                        <Label>Этап</Label>
                        <select className={inputClass} value={draft.statusId} onChange={(e) => update('statusId', e.target.value)}>
                            <option value="">Любой этап</option>
                            {statusesQuery.data?.map((status) => (
                                <option key={status.id} value={status.id}>{status.name}</option>
                            ))}
                        </select>
                        {statusesQuery.isFetching && <span className="mt-1 block text-xs text-slate-400">Загрузка этапов…</span>}
                        {statusesQuery.isError && <span className="mt-1 block text-xs text-red-600">Не удалось загрузить этапы</span>}
                    </label>
                    <label>
                        <Label>Вид работы</Label>
                        <select className={inputClass} value={draft.workTypeId} onChange={(e) => update('workTypeId', e.target.value)}>
                            <option value="">Любой вид работы</option>
                            {workTypesQuery.data?.map((workType) => (
                                <option key={workType.id} value={workType.id}>{workType.name}</option>
                            ))}
                        </select>
                        {workTypesQuery.isFetching && <span className="mt-1 block text-xs text-slate-400">Загрузка видов работ…</span>}
                        {workTypesQuery.isError && <span className="mt-1 block text-xs text-red-600">Не удалось загрузить виды работ</span>}
                    </label>
                    <label>
                        <Label>Режим</Label>
                        <select
                            className={inputClass}
                            value={draft.treatment}
                            onChange={(e) => {
                                const treatment = e.target.value as SalaryRuleTreatment;
                                setDraft((current) => ({
                                    ...current,
                                    treatment,
                                    rate: ['INCLUDED_IN_BASE', 'NOT_PAYABLE'].includes(treatment)
                                        ? '0'
                                        : current.rate,
                                }));
                            }}
                        >
                            {Object.entries(treatmentLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <Label>Метод расчёта</Label>
                        <select
                            className={inputClass}
                            value={draft.calculationType}
                            onChange={(e) => update('calculationType', e.target.value as SalaryCalculationType)}
                        >
                            {Object.entries(calculationLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <Label>Ставка ({draft.calculationType === 'PERCENT_OF_TASK' ? '%' : '₸'})</Label>
                        <input
                            type="text"
                            inputMode="decimal"
                            className={inputClass}
                            disabled={isZeroRate}
                            value={isZeroRate ? '0' : draft.rate}
                            onChange={(e) => update('rate', e.target.value)}
                        />
                    </label>
                    <label>
                        <Label>Приоритет</Label>
                        <input type="number" step="1" className={inputClass} value={draft.priority} onChange={(e) => update('priority', e.target.value)} />
                    </label>
                    <label>
                        <Label>Действует с</Label>
                        <input type="date" className={inputClass} value={draft.effectiveFrom} onChange={(e) => update('effectiveFrom', e.target.value)} />
                    </label>
                    <label>
                        <Label>Действует до</Label>
                        <input type="date" className={inputClass} value={draft.effectiveTo} onChange={(e) => update('effectiveTo', e.target.value)} />
                    </label>
                    <div className="sm:col-span-2">
                        <Toggle checked={draft.active} onChange={(value) => update('active', value)} label="Правило активно" />
                    </div>
                </div>

                {error && <div className="mt-4"><StateNotice tone="error">{error}</StateNotice></div>}
                {!canEdit && <div className="mt-4"><StateNotice tone="error">Недостаточно прав для изменения правила</StateNotice></div>}

                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">
                        Отмена
                    </button>
                    {canEdit && (
                        <button disabled={isSaving} className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300">
                            {isSaving ? 'Сохранение…' : 'Сохранить'}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    );
}

export default function FlexiblePayrollPage() {
    const { notifySuccess } = useNotifications();
    const auth = useSelector((state: RootState) => state.auth);
    const normalizedRoles = useMemo(
        () => [auth.role, ...auth.roles]
            .filter(Boolean)
            .map((role) => String(role).toUpperCase().replace(/^ROLE_/u, '')),
        [auth.role, auth.roles]
    );
    const canEdit = normalizedRoles.some((role) => ['ADMIN', 'FINANCIER'].includes(role));

    const employeesQuery = useGetSalaryEmployeesQuery();
    const [selectedEmployeeChoice, setSelectedEmployeeChoice] = useState('');
    const selectedEmployeeId =
        selectedEmployeeChoice || employeesQuery.data?.[0]?.id || '';
    const selectedEmployee = employeesQuery.data?.find((employee) => employee.id === selectedEmployeeId);
    const planQuery = useGetSalaryPlanQuery(selectedEmployeeId, { skip: !selectedEmployeeId });
    const planNotFound = getErrorStatus(planQuery.error) === 404;
    const [planDraft, setPlanDraft] = useState<PlanDraft>(emptyPlan);
    const [planError, setPlanError] = useState('');
    const [savePlan, savePlanState] = useUpsertSalaryPlanMutation();

    const [editingRule, setEditingRule] = useState<SalaryPlanRule | null | undefined>(undefined);
    const [deletingRule, setDeletingRule] = useState<SalaryPlanRule | null>(null);
    const [deleteRule, deleteRuleState] = useDeleteSalaryRuleMutation();
    const [ruleError, setRuleError] = useState('');

    const today = new Date().toISOString().slice(0, 10);
    const monthStart = `${today.slice(0, 7)}-01`;
    const monthEndDate = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0);
    const monthEnd = monthEndDate.toISOString().slice(0, 10);
    const [previewStart, setPreviewStart] = useState(monthStart);
    const [previewEnd, setPreviewEnd] = useState(monthEnd);
    const [previewPeriodError, setPreviewPeriodError] = useState('');
    const [runPreview, previewQuery] = useLazyGetSalaryCalculationPreviewQuery();
    const [statementComment, setStatementComment] = useState('');
    const [showStatementConfirm, setShowStatementConfirm] = useState(false);
    const [statementResult, setStatementResult] = useState<{ statementId: string; status: string } | null>(null);
    const [createStatement, statementState] = useCreateFlexibleSalaryStatementMutation();

    useEffect(() => {
        // The server response is the source of truth when another employee or plan is loaded.
        if (planQuery.data) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPlanDraft(planToDraft(planQuery.data));
        } else if (planNotFound) {
            setPlanDraft(emptyPlan());
        }
    }, [planNotFound, planQuery.data]);

    const rules = useMemo(() => planQuery.data?.rules ?? [], [planQuery.data?.rules]);
    const duplicateKeys = useMemo(() => {
        const counts = new Map<string, number>();
        rules.filter((rule) => rule.active).forEach((rule) => {
            const key = getRuleKey(rule);
            counts.set(key, (counts.get(key) ?? 0) + 1);
        });
        return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
    }, [rules]);

    const updatePlan = <Key extends keyof PlanDraft>(key: Key, value: PlanDraft[Key]) => {
        setPlanDraft((current) => ({ ...current, [key]: value }));
    };

    const handleEmployeeChange = (employeeId: string) => {
        setSelectedEmployeeChoice(employeeId);
        setPlanError('');
        setRuleError('');
        setStatementResult(null);
        setPreviewPeriodError('');
        previewQuery.reset();
    };

    const handleSavePlan = async (event: FormEvent) => {
        event.preventDefault();
        setPlanError('');
        if (!selectedEmployeeId) return;
        const baseSalary = parseDecimal(planDraft.baseSalary);
        const monthlyCap = planDraft.capEnabled ? parseDecimal(planDraft.monthlyCap) : null;
        if (!planDraft.name.trim()) return setPlanError('Укажите название плана');
        if (!Number.isFinite(baseSalary) || baseSalary < 0) return setPlanError('Укажите корректный оклад');
        if (planDraft.capEnabled && (!Number.isFinite(monthlyCap) || Number(monthlyCap) <= 0)) {
            return setPlanError('Укажите сумму месячного лимита больше нуля');
        }
        if (!planDraft.effectiveFrom) return setPlanError('Укажите дату начала действия');
        if (planDraft.effectiveTo && planDraft.effectiveTo < planDraft.effectiveFrom) {
            return setPlanError('Дата окончания не может быть раньше даты начала');
        }

        try {
            await savePlan({
                userId: selectedEmployeeId,
                body: {
                    userId: selectedEmployeeId,
                    name: planDraft.name.trim(),
                    baseSalary,
                    monthlyCap,
                    capMode: planDraft.capMode,
                    carryForward: planDraft.carryForward,
                    effectiveFrom: planDraft.effectiveFrom,
                    effectiveTo: planDraft.effectiveTo || null,
                    active: planDraft.active,
                },
            }).unwrap();
            notifySuccess(planNotFound ? 'Зарплатный план создан' : 'Зарплатный план сохранён');
        } catch (error) {
            setPlanError(getLocalError(error, 'Не удалось сохранить зарплатный план'));
        }
    };

    const handleDeleteRule = async () => {
        if (!deletingRule || !selectedEmployeeId) return;
        setRuleError('');
        try {
            await deleteRule({ ruleId: deletingRule.id, userId: selectedEmployeeId }).unwrap();
            notifySuccess('Правило удалено. Исторические начисления сохранены');
            setDeletingRule(null);
        } catch (error) {
            setRuleError(getLocalError(error, 'Не удалось удалить правило'));
            setDeletingRule(null);
        }
    };

    const handlePreview = async () => {
        setPreviewPeriodError('');
        setStatementResult(null);
        if (!selectedEmployeeId) return setPreviewPeriodError('Выберите сотрудника');
        if (!previewStart || !previewEnd) return setPreviewPeriodError('Укажите расчётный период');
        if (previewEnd < previewStart) return setPreviewPeriodError('Конец периода не может быть раньше начала');
        try {
            await runPreview({
                employeeId: selectedEmployeeId,
                start: toOffsetIso(previewStart),
                end: toOffsetIso(previewEnd, true),
            }).unwrap();
        } catch (error) {
            setPreviewPeriodError(getLocalError(error, 'Не удалось рассчитать зарплату'));
        }
    };

    const handleCreateStatement = async () => {
        if (!previewQuery.data || !selectedEmployeeId) return;
        setPreviewPeriodError('');
        try {
            const result = await createStatement({
                employeeId: selectedEmployeeId,
                start: toOffsetIso(previewStart),
                end: toOffsetIso(previewEnd, true),
                comment: statementComment.trim() || null,
            }).unwrap();
            setStatementResult(result);
            setShowStatementConfirm(false);
            notifySuccess('Ведомость сформирована');
        } catch (error) {
            setShowStatementConfirm(false);
            setPreviewPeriodError(getLocalError(error, 'Не удалось сформировать ведомость'));
        }
    };

    return (
        <div className="mx-auto w-full max-w-[1550px] space-y-6 pb-10">
            <header className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Финансы</p>
                <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Зарплатные планы</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-500">
                    Гибкие правила оплаты этапов, лимиты выплат и предварительный расчёт ведомости
                </p>
            </header>

            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <label>
                        <Label>Сотрудник</Label>
                        <select
                            className={inputClass}
                            value={selectedEmployeeId}
                            disabled={employeesQuery.isFetching}
                            onChange={(event) => handleEmployeeChange(event.target.value)}
                        >
                            {!employeesQuery.data?.length && <option value="">Нет доступных сотрудников</option>}
                            {employeesQuery.data?.map((employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.name || employee.email || employee.id}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="text-sm text-slate-500 lg:pb-3">
                        {selectedEmployee?.email}
                    </div>
                </div>
                {employeesQuery.isFetching && <div className="mt-4"><StateNotice tone="loading">Загрузка сотрудников…</StateNotice></div>}
                {employeesQuery.isError && <div className="mt-4"><StateNotice tone="error">{getLocalError(employeesQuery.error, 'Не удалось загрузить сотрудников')}</StateNotice></div>}
                {!employeesQuery.isFetching && !employeesQuery.isError && employeesQuery.data?.length === 0 && (
                    <div className="mt-4"><StateNotice tone="empty">Backend не вернул доступных для просмотра сотрудников.</StateNotice></div>
                )}
            </section>

            <form onSubmit={handleSavePlan} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">План сотрудника</h2>
                        <p className="mt-1 text-sm text-slate-500">Оклад, лимит выплаты и период действия</p>
                    </div>
                    {planQuery.data && (
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${planQuery.data.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {planQuery.data.active ? 'Активен' : 'Неактивен'}
                        </span>
                    )}
                </div>

                {planQuery.isFetching && <div className="mt-5"><StateNotice tone="loading">Загрузка плана…</StateNotice></div>}
                {planNotFound && <div className="mt-5"><StateNotice tone="empty">План ещё не создан. Заполните форму и сохраните её.</StateNotice></div>}
                {planQuery.isError && !planNotFound && (
                    <div className="mt-5"><StateNotice tone="error">{getLocalError(planQuery.error, 'Не удалось загрузить план')}</StateNotice></div>
                )}

                {!planQuery.isFetching && (!planQuery.isError || planNotFound) && selectedEmployeeId && (
                    <>
                        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <label className="md:col-span-2">
                                <Label>Название</Label>
                                <input disabled={!canEdit} className={inputClass} value={planDraft.name} onChange={(e) => updatePlan('name', e.target.value)} />
                            </label>
                            <label>
                                <Label>Фиксированный оклад</Label>
                                <input disabled={!canEdit} type="text" inputMode="decimal" className={inputClass} value={planDraft.baseSalary} onChange={(e) => updatePlan('baseSalary', e.target.value)} />
                            </label>
                            <div>
                                <Label>Месячный лимит</Label>
                                <Toggle disabled={!canEdit} checked={planDraft.capEnabled} onChange={(value) => updatePlan('capEnabled', value)} label="Лимит включён" />
                            </div>
                            {planDraft.capEnabled && (
                                <>
                                    <label>
                                        <Label>Сумма лимита</Label>
                                        <input disabled={!canEdit} type="text" inputMode="decimal" className={inputClass} value={planDraft.monthlyCap} onChange={(e) => updatePlan('monthlyCap', e.target.value)} />
                                    </label>
                                    <label>
                                        <Label>Режим лимита</Label>
                                        <select disabled={!canEdit} className={inputClass} value={planDraft.capMode} onChange={(e) => updatePlan('capMode', e.target.value as SalaryCapMode)}>
                                            <option value="TOTAL">Ограничить всю выплату</option>
                                            <option value="VARIABLE_ONLY">Ограничить только доплаты</option>
                                        </select>
                                    </label>
                                    <div className="md:col-span-2">
                                        <Label>Превышение</Label>
                                        <Toggle disabled={!canEdit} checked={planDraft.carryForward} onChange={(value) => updatePlan('carryForward', value)} label="Переносить на следующий месяц" />
                                    </div>
                                </>
                            )}
                            <label>
                                <Label>Действует с</Label>
                                <input disabled={!canEdit} type="date" className={inputClass} value={planDraft.effectiveFrom} onChange={(e) => updatePlan('effectiveFrom', e.target.value)} />
                            </label>
                            <label>
                                <Label>Действует до</Label>
                                <input disabled={!canEdit} type="date" className={inputClass} value={planDraft.effectiveTo} onChange={(e) => updatePlan('effectiveTo', e.target.value)} />
                            </label>
                            <div className="md:col-span-2">
                                <Label>Состояние</Label>
                                <Toggle disabled={!canEdit} checked={planDraft.active} onChange={(value) => updatePlan('active', value)} label="План активен" />
                            </div>
                        </div>
                        {planError && <div className="mt-4"><StateNotice tone="error">{planError}</StateNotice></div>}
                        {canEdit && (
                            <button disabled={savePlanState.isLoading} className="mt-5 min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-700 disabled:bg-slate-300">
                                {savePlanState.isLoading ? 'Сохранение…' : planNotFound ? 'Создать план' : 'Сохранить план'}
                            </button>
                        )}
                    </>
                )}
            </form>

            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Правила этапов</h2>
                        <p className="mt-1 text-sm text-slate-500">Backend применяет самое конкретное подходящее правило</p>
                    </div>
                    {canEdit && planQuery.data && (
                        <button type="button" onClick={() => setEditingRule(null)} className="min-h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
                            Добавить правило
                        </button>
                    )}
                </div>

                {planQuery.isFetching && <div className="p-5"><StateNotice tone="loading">Загрузка правил…</StateNotice></div>}
                {planNotFound && <div className="p-5"><StateNotice tone="empty">Сначала создайте зарплатный план.</StateNotice></div>}
                {planQuery.isError && !planNotFound && <div className="p-5"><StateNotice tone="error">Не удалось загрузить правила.</StateNotice></div>}
                {duplicateKeys.size > 0 && (
                    <div className="p-5 pb-0">
                        <StateNotice tone="info">
                            Найдены активные правила с одинаковыми этапом, видом работы, периодом и приоритетом. Уточните конфигурацию, чтобы избежать неоднозначности.
                        </StateNotice>
                    </div>
                )}
                {ruleError && <div className="p-5 pb-0"><StateNotice tone="error">{ruleError}</StateNotice></div>}

                {planQuery.data && rules.length === 0 && (
                    <div className="p-8"><StateNotice tone="empty">Для этого плана пока нет правил этапов.</StateNotice></div>
                )}
                {rules.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1350px] text-left">
                            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                                <tr>
                                    {['Название', 'Этап', 'Вид работы', 'Режим', 'Метод расчёта', 'Ставка', 'Приоритет', 'Период', 'Активность', 'Действия'].map((title) => (
                                        <th key={title} className="p-4 font-bold">{title}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rules.map((rule) => {
                                    const duplicate = rule.active && duplicateKeys.has(getRuleKey(rule));
                                    return (
                                        <tr key={rule.id} className={duplicate ? 'bg-amber-50/70' : 'hover:bg-blue-50/30'}>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800">{rule.name}</div>
                                                {duplicate && <span className="mt-1 inline-block text-xs font-semibold text-amber-700">Неоднозначное правило</span>}
                                            </td>
                                            <td className="p-4 text-sm text-slate-600">{rule.statusName || (rule.statusId ? rule.statusId : 'Любой этап')}</td>
                                            <td className="p-4 text-sm text-slate-600">{rule.workTypeName || (rule.workTypeId ? rule.workTypeId : 'Любой вид')}</td>
                                            <td className="p-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{treatmentLabels[rule.treatment]}</span></td>
                                            <td className="p-4 text-sm text-slate-600">{calculationLabels[rule.calculationType]}</td>
                                            <td className="p-4 text-sm font-black text-slate-800">{rule.calculationType === 'PERCENT_OF_TASK' ? `${rule.rate}%` : formatMoney(rule.rate)}</td>
                                            <td className="p-4 text-sm font-bold text-slate-700">{rule.priority}</td>
                                            <td className="p-4 text-sm text-slate-500">{formatDate(rule.effectiveFrom)} — {formatDate(rule.effectiveTo)}</td>
                                            <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${rule.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{rule.active ? 'Активно' : 'Выключено'}</span></td>
                                            <td className="p-4">
                                                {canEdit && (
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => setEditingRule(rule)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">Изменить</button>
                                                        <button type="button" onClick={() => setDeletingRule(rule)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">Удалить</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div>
                    <h2 className="text-lg font-black text-slate-900">Предпросмотр расчёта</h2>
                    <p className="mt-1 text-sm text-slate-500">Суммы показывает backend; расчёт запускается только кнопкой</p>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
                    <label>
                        <Label>Начало периода</Label>
                        <input type="date" className={inputClass} value={previewStart} onChange={(e) => setPreviewStart(e.target.value)} />
                    </label>
                    <label>
                        <Label>Конец периода</Label>
                        <input type="date" className={inputClass} value={previewEnd} onChange={(e) => setPreviewEnd(e.target.value)} />
                    </label>
                    <button type="button" onClick={handlePreview} disabled={previewQuery.isFetching || !selectedEmployeeId} className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:bg-slate-300">
                        {previewQuery.isFetching ? 'Расчёт…' : 'Рассчитать'}
                    </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">Часовой пояс лаборатории: UTC{LAB_TIMEZONE_OFFSET}</p>
                {previewPeriodError && <div className="mt-4"><StateNotice tone="error">{previewPeriodError}</StateNotice></div>}
                {!previewQuery.data && !previewQuery.isFetching && !previewPeriodError && (
                    <div className="mt-5"><StateNotice tone="empty">Выберите период и нажмите «Рассчитать».</StateNotice></div>
                )}
                {previewQuery.isFetching && <div className="mt-5"><StateNotice tone="loading">Backend рассчитывает начисления…</StateNotice></div>}

                {previewQuery.data && (
                    <>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                ['Оклад', previewQuery.data.baseSalary],
                                ['Дополнительные начисления', previewQuery.data.extraAccrued],
                                ['Начислено', previewQuery.data.grossAccrued],
                                ['Перенос с прошлого периода', previewQuery.data.carryIn],
                                ['Доступно', previewQuery.data.available],
                                ['Лимит', previewQuery.data.monthlyCap],
                                ['К выплате', previewQuery.data.payable],
                                ['Перенос на следующий период', previewQuery.data.carryOut],
                            ].map(([label, value]) => (
                                <article key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-bold text-slate-500">{label}</p>
                                    <p className="mt-2 text-xl font-black text-slate-900">{formatMoney(value as number | null)}</p>
                                    {label === 'Перенос на следующий период' && (
                                        <p className="mt-2 text-xs leading-5 text-amber-700">Заработано, но переносится на следующий месяц из-за лимита выплаты</p>
                                    )}
                                </article>
                            ))}
                        </div>

                        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 font-bold text-slate-800">Детализация начислений</div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] text-left">
                                    <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                                        <tr>
                                            {['Правило / задача', 'Этап', 'Вид работы', 'Метод', 'Объём', 'Ставка', 'Сумма', 'Состояние'].map((title) => (
                                                <th key={title} className="p-4 font-bold">{title}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {previewQuery.data.accruals?.map((accrual, index) => {
                                            const isReview = accrual.treatment === 'REQUIRES_REVIEW';
                                            const isIncluded = accrual.treatment === 'INCLUDED_IN_BASE';
                                            return (
                                                <tr key={accrual.id ?? `${accrual.taskId}-${index}`} className={isReview ? 'bg-amber-50/60' : ''}>
                                                    <td className="p-4">
                                                        <div className="text-sm font-bold text-slate-800">{accrual.ruleName || accrual.taskId || 'Начисление'}</div>
                                                        {accrual.orderNumber && <div className="mt-1 text-xs text-slate-400">{accrual.orderNumber}</div>}
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600">{accrual.statusName || 'Любой этап'}</td>
                                                    <td className="p-4 text-sm text-slate-600">{accrual.workTypeName || 'Любой вид'}</td>
                                                    <td className="p-4 text-sm text-slate-600">{accrual.calculationType ? calculationLabels[accrual.calculationType] : '—'}</td>
                                                    <td className="p-4 text-sm text-slate-600">{accrual.quantity ?? '—'}</td>
                                                    <td className="p-4 text-sm text-slate-600">{accrual.rate === null || accrual.rate === undefined ? '—' : formatMoney(accrual.rate)}</td>
                                                    <td className={`p-4 text-sm font-black ${isReview ? 'text-slate-400' : 'text-emerald-700'}`}>{formatMoney(isIncluded ? 0 : accrual.amount)}</td>
                                                    <td className="p-4">
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isReview ? 'bg-amber-100 text-amber-800' : isIncluded ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                            {isReview ? 'Требует проверки — не в итоге' : treatmentLabels[accrual.treatment]}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {!previewQuery.data.accruals?.length && (
                                            <tr><td colSpan={8} className="p-8 text-center text-sm text-slate-400">Начислений за период нет.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {canEdit && (
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <label>
                                    <Label>Комментарий к ведомости</Label>
                                    <input className={inputClass} value={statementComment} onChange={(e) => setStatementComment(e.target.value)} placeholder="Например, Зарплата за август" />
                                </label>
                                <button type="button" onClick={() => setShowStatementConfirm(true)} disabled={statementState.isLoading} className="mt-4 min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300">
                                    Сформировать ведомость
                                </button>
                            </div>
                        )}
                        {statementResult && (
                            <div className="mt-4"><StateNotice tone="info">Ведомость сформирована: <strong>{statementResult.statementId}</strong>, статус: <strong>{statementResult.status}</strong>.</StateNotice></div>
                        )}
                    </>
                )}
            </section>

            {editingRule !== undefined && planQuery.data && (
                <RuleEditor
                    plan={planQuery.data}
                    rule={editingRule}
                    userId={selectedEmployeeId}
                    canEdit={canEdit}
                    onClose={() => setEditingRule(undefined)}
                />
            )}

            {deletingRule && (
                <Modal>
                    <h2 className="text-xl font-black text-slate-900">Удалить правило?</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                        Правило «{deletingRule.name}» будет удалено. Исторические начисления и уже сформированные ведомости сохранятся.
                    </p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setDeletingRule(null)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700">Отмена</button>
                        <button type="button" onClick={handleDeleteRule} disabled={deleteRuleState.isLoading} className="min-h-11 rounded-xl bg-red-600 px-5 text-sm font-bold text-white disabled:bg-slate-300">
                            {deleteRuleState.isLoading ? 'Удаление…' : 'Удалить'}
                        </button>
                    </div>
                </Modal>
            )}

            {showStatementConfirm && previewQuery.data && (
                <Modal>
                    <h2 className="text-xl font-black text-slate-900">Сформировать ведомость?</h2>
                    <p className="mt-2 text-sm text-slate-500">После формирования начисления за период будут запечатаны.</p>
                    <dl className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Начислено</dt><dd className="font-black text-slate-900">{formatMoney(previewQuery.data.grossAccrued)}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">К выплате</dt><dd className="font-black text-emerald-700">{formatMoney(previewQuery.data.payable)}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Перенос на следующий период</dt><dd className="font-black text-amber-700">{formatMoney(previewQuery.data.carryOut)}</dd></div>
                    </dl>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={() => setShowStatementConfirm(false)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700">Отмена</button>
                        <button type="button" onClick={handleCreateStatement} disabled={statementState.isLoading} className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white disabled:bg-slate-300">
                            {statementState.isLoading ? 'Формирование…' : 'Подтвердить'}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
