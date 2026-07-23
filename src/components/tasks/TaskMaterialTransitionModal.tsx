'use client';

import { useMemo, useState } from 'react';

import Modal from '@/src/components/ui/Modal';
import {
    useGetTaskMaterialAccountingQuery,
    useGetTaskMaterialPlanQuery,
    useUpdateTaskStatusMutation,
} from '@/src/services/api/ordersApi';
import { useGetNomenclatureQuery } from '@/src/services/api/warehouseApi';
import {
    useGetAdminWorkflowStepsQuery,
    useGetAvailableWorkflowTransitionsQuery,
    useGetWorkflowStatusesQuery,
} from '@/src/services/api/workflowApi';
import type { MaterialPlanItem, MaterialUsageRequest } from '@/src/types/task.types';
import {
    createMaterialReportId,
    getMaterialUsageDifference,
    getReportedQuantity,
    isZeroMaterialUsage,
    validateMaterialUsages,
} from '@/src/utils/materialAccounting';

type ReportRow = MaterialUsageRequest & {
    key: string;
    nomenclatureName: string;
    unit: string;
    plannedStandardQuantity: number;
    plannedWasteQuantity: number;
    plannedTotalQuantity: number;
    alreadyReportedQuantity: number;
};

function toNumber(value: string) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
}

function createRow(plan: MaterialPlanItem, alreadyReportedQuantity = 0): ReportRow {
    return {
        key: plan.nomenclatureId,
        nomenclatureId: plan.nomenclatureId,
        nomenclatureName: plan.nomenclatureName,
        unit: plan.unit,
        plannedStandardQuantity: plan.remainingStandardQuantity,
        plannedWasteQuantity: plan.remainingWasteQuantity,
        plannedTotalQuantity: plan.remainingReservedQuantity,
        alreadyReportedQuantity,
        issuedQuantity: 0,
        consumedQuantity: 0,
        wasteQuantity: 0,
        returnedQuantity: 0,
        note: '',
    };
}

function toUsage(row: ReportRow): MaterialUsageRequest {
    return {
        nomenclatureId: row.nomenclatureId,
        issuedQuantity: row.issuedQuantity,
        consumedQuantity: row.consumedQuantity,
        wasteQuantity: row.wasteQuantity,
        returnedQuantity: row.returnedQuantity,
        ...(row.note?.trim() ? { note: row.note.trim() } : {}),
    };
}

export default function TaskMaterialTransitionModal({
    taskId,
    workTypeId,
    workTypeCode,
    currentStatusId,
    nextStatusId,
    assignedUserId,
    defaultComment = '',
    onClose,
    onSuccess,
}: {
    taskId: string;
    workTypeId?: string;
    workTypeCode: string;
    currentStatusId: string;
    nextStatusId: string;
    assignedUserId?: string;
    defaultComment?: string;
    onClose: () => void;
    onSuccess?: () => void;
}) {
    const [materialReportId] = useState(createMaterialReportId);
    const [comment, setComment] = useState(defaultComment);
    const [rowOverrides, setRowOverrides] = useState<Record<string, ReportRow>>({});
    const [extraRows, setExtraRows] = useState<ReportRow[]>([]);
    const [removedRowKeys, setRemovedRowKeys] = useState<string[]>([]);
    const [selectedNomenclatureId, setSelectedNomenclatureId] = useState('');
    const [nomenclatureSearch, setNomenclatureSearch] = useState('');
    const { data: plan = [], isLoading: isPlanLoading, isError: isPlanError, refetch: refetchPlan } = useGetTaskMaterialPlanQuery(taskId, { refetchOnMountOrArgChange: true });
    const { data: accounting, isLoading: isAccountingLoading } = useGetTaskMaterialAccountingQuery(taskId, { refetchOnMountOrArgChange: true });
    const { data: transitions = [], isLoading: isTransitionsLoading, isError: isTransitionsError, refetch: refetchTransitions } = useGetAvailableWorkflowTransitionsQuery(
        { workType: workTypeCode, currentStatusId },
        { skip: !workTypeCode || !currentStatusId, refetchOnMountOrArgChange: true }
    );
    const { data: steps = [], isLoading: isStepsLoading } = useGetAdminWorkflowStepsQuery(
        { workTypeId: workTypeId ?? '' },
        { skip: !workTypeId, refetchOnMountOrArgChange: true }
    );
    const { data: statuses = [], isLoading: isStatusesLoading } = useGetWorkflowStatusesQuery(undefined, { refetchOnMountOrArgChange: true });
    const [updateTaskStatus, { isLoading: isSubmitting }] = useUpdateTaskStatusMutation();

    const workflowStep = steps.find((step) => step.fromStatusId === currentStatusId && step.toStatusId === nextStatusId)
        ?? transitions.find((transition) => transition.toStatusId === nextStatusId || transition.id === nextStatusId);
    const isTerminal = statuses.some((status) => status.id === nextStatusId && status.terminal);
    const allowUnplannedMaterials = workflowStep?.allowUnplannedMaterials === true;
    const materialReportRequired = workflowStep?.materialReportRequired === true;
    const { data: nomenclature = [], isLoading: isNomenclatureLoading } = useGetNomenclatureQuery(
        { activeOnly: true, page: 0, size: 200, sort: 'name,ASC' },
        { skip: !allowUnplannedMaterials }
    );
    const accountingById = useMemo(() => new Map(accounting?.items.map((item) => [item.nomenclatureId, item]) ?? []), [accounting?.items]);
    const rows = useMemo(() => [
        ...plan
            .map((item) => rowOverrides[item.nomenclatureId] ?? createRow(item, getReportedQuantity(accountingById.get(item.nomenclatureId))))
            .filter((row) => !removedRowKeys.includes(row.key)),
        ...extraRows.filter((row) => !removedRowKeys.includes(row.key)),
    ], [accountingById, extraRows, plan, removedRowKeys, rowOverrides]);
    const availableNomenclature = useMemo(() => {
        const search = nomenclatureSearch.trim().toLocaleLowerCase('ru-RU');
        return nomenclature.filter((item) => !rows.some((row) => row.nomenclatureId === item.id) && (!search || `${item.name} ${item.code}`.toLocaleLowerCase('ru-RU').includes(search)));
    }, [nomenclature, nomenclatureSearch, rows]);

    const payloadRows = rows.filter((row) => !isZeroMaterialUsage(row));
    const usageError = validateMaterialUsages(rows.map(toUsage));
    const isWorkflowLoading = isTransitionsLoading || isStepsLoading || isStatusesLoading;
    const canSubmit = Boolean(workflowStep)
        && !accounting?.finalized
        && !usageError
        && (!materialReportRequired || payloadRows.length > 0)
        && !isPlanLoading
        && !isPlanError
        && !isAccountingLoading
        && !isWorkflowLoading
        && !isTransitionsError
        && !isSubmitting;

    const updateRow = (key: string, field: keyof MaterialUsageRequest, value: string | number) => {
        const row = rows.find((item) => item.key === key);
        if (row) setRowOverrides((current) => ({ ...current, [key]: { ...row, [field]: value } }));
    };

    const fillAllAsConsumed = () => {
        setRowOverrides(Object.fromEntries(rows.map((row) => {
            const issued = row.issuedQuantity > 0 ? row.issuedQuantity : row.plannedTotalQuantity;
            return [row.key, { ...row, issuedQuantity: issued, consumedQuantity: issued, wasteQuantity: 0, returnedQuantity: 0 }];
        })) as Record<string, ReportRow>);
    };

    const markReturns = () => {
        setRowOverrides(Object.fromEntries(rows.map((row) => [row.key, { ...row, consumedQuantity: 0, wasteQuantity: 0, returnedQuantity: row.issuedQuantity }])) as Record<string, ReportRow>);
    };

    const addMaterial = () => {
        if (!selectedNomenclatureId || rows.some((row) => row.nomenclatureId === selectedNomenclatureId)) return;
        const item = nomenclature.find((candidate) => candidate.id === selectedNomenclatureId);
        if (!item) return;
        setExtraRows((current) => [...current, {
            key: item.id,
            nomenclatureId: item.id,
            nomenclatureName: item.name,
            unit: item.unit,
            plannedStandardQuantity: 0,
            plannedWasteQuantity: 0,
            plannedTotalQuantity: 0,
            alreadyReportedQuantity: getReportedQuantity(accountingById.get(item.id)),
            issuedQuantity: 0,
            consumedQuantity: 0,
            wasteQuantity: 0,
            returnedQuantity: 0,
            note: '',
        }]);
        setSelectedNomenclatureId('');
    };

    const submit = async () => {
        if (!canSubmit) return;
        try {
            await updateTaskStatus({
                taskId,
                body: {
                    nextStatusId,
                    ...(assignedUserId ? { assignedUserId } : {}),
                    ...(comment.trim() ? { comment: comment.trim() } : {}),
                    ...(payloadRows.length > 0 || materialReportRequired ? {
                        materialReportId,
                        materialUsages: payloadRows.map(toUsage),
                    } : {}),
                },
            }).unwrap();
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Material transition failed:', error);
        }
    };

    return (
        <Modal contentClassName="max-w-7xl overflow-hidden p-0">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-white p-5">
                <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-600">Переход этапа</p><h2 className="mt-1 text-xl font-black text-slate-950">Материальный отчёт</h2><p className="mt-1 text-xs text-slate-500">ID отчёта {materialReportId}</p></div>
                <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">Закрыть</button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                {(isPlanError || isTransitionsError) ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">Не удалось получить актуальный план или шаг workflow. <button type="button" className="font-black underline" onClick={() => { void refetchPlan(); void refetchTransitions(); }}>Повторить</button></div> : null}
                {accounting?.finalized ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">Материальные расходы задачи уже финализированы. Форма доступна только для чтения.</div> : null}
                {isTerminal ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>Материальный расход задачи будет окончательно зафиксирован.</strong> Со склада будут списаны использованные материалы и потери. После завершения изменить отчёт будет нельзя.</div> : null}

                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${materialReportRequired ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{materialReportRequired ? 'Отчёт обязателен' : 'Отчёт необязателен'}</span>
                    <button type="button" onClick={fillAllAsConsumed} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Заполнить всё как использованное</button>
                    <button type="button" onClick={markReturns} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">Указать возврат</button>
                </div>

                {allowUnplannedMaterials ? <div className="mb-4 grid gap-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3 sm:grid-cols-[minmax(180px,.8fr)_minmax(220px,1fr)_auto]"><input value={nomenclatureSearch} onChange={(event) => { setNomenclatureSearch(event.target.value); setSelectedNomenclatureId(''); }} placeholder="Поиск по названию или коду" className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-violet-500" /><select value={selectedNomenclatureId} onChange={(event) => setSelectedNomenclatureId(event.target.value)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"><option value="">Добавить активную номенклатуру...</option>{availableNomenclature.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.unit}</option>)}</select><button type="button" onClick={addMaterial} disabled={!selectedNomenclatureId || isNomenclatureLoading} className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-black text-white disabled:bg-slate-300">Добавить материал</button></div> : null}

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-[1260px] w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-400"><tr>{['Складской материал', 'Ед.', 'Первоначальный план', 'Уже заявленный факт', 'Выдано', 'Использовано', 'Потери', 'Возврат', 'Комментарий', 'Распределено', 'Разница', ''].map((label) => <th key={label} className="px-2 py-2.5 font-black">{label}</th>)}</tr></thead>
                        <tbody>{rows.map((row) => {
                            const allocated = row.consumedQuantity + row.wasteQuantity + row.returnedQuantity;
                            const difference = getMaterialUsageDifference(row);
                            return <tr key={row.key} className="border-t border-slate-100"><td className="px-2 py-2 font-bold text-slate-800">{row.nomenclatureName}</td><td className="px-2 py-2 text-slate-500">{row.unit}</td><td className="px-2 py-2">{row.plannedStandardQuantity} + {row.plannedWasteQuantity} = <strong>{row.plannedTotalQuantity}</strong></td><td className="px-2 py-2">{row.alreadyReportedQuantity}</td>{(['issuedQuantity', 'consumedQuantity', 'wasteQuantity', 'returnedQuantity'] as const).map((field) => <td key={field} className="px-1 py-2"><input type="number" min="0" step="any" value={row[field]} onChange={(event) => updateRow(row.key, field, toNumber(event.target.value))} className="w-24 rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-violet-500" /></td>)}<td className="px-1 py-2"><input value={row.note} onChange={(event) => updateRow(row.key, 'note', event.target.value)} className="w-44 rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-violet-500" placeholder="Комментарий" /></td><td className="px-2 py-2 font-bold">{allocated}</td><td className={`px-2 py-2 font-black ${Math.abs(difference) > 0.000001 ? 'text-red-600' : 'text-emerald-600'}`}>{difference}</td><td className="px-2 py-2"><button type="button" onClick={() => setRemovedRowKeys((current) => [...current, row.key])} className="text-xs font-bold text-red-600">Удалить строку</button></td></tr>;
                        })}</tbody>
                    </table>
                    {!rows.length && !isPlanLoading ? <p className="p-6 text-center text-sm text-slate-400">В материальном плане нет строк</p> : null}
                </div>

                {usageError ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{usageError}</p> : null}
                {materialReportRequired && payloadRows.length === 0 ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Для этого перехода требуется хотя бы одна ненулевая строка отчёта.</p> : null}

                <label className="mt-4 block"><span className="mb-1 block text-xs font-bold text-slate-500">Комментарий к переходу</span><textarea value={comment} onChange={(event) => setComment(event.target.value)} className="min-h-20 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-violet-500" /></label>
            </div>

            <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600">Отмена</button><button type="button" disabled={!canSubmit} onClick={() => void submit()} className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">{isSubmitting ? 'Подтверждение...' : isTerminal ? 'Зафиксировать и завершить' : 'Подтвердить переход'}</button></footer>
        </Modal>
    );
}
