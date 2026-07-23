'use client';

import { useMemo, useState } from 'react';

import MaterialChips from '@/src/components/tasks/MaterialChips';
import {
    useGetTaskMaterialAccountingQuery,
    useGetTaskMaterialUsagesQuery,
    useUpdateTaskMaterialsMutation,
} from '@/src/services/api/ordersApi';
import { useGetMaterialsQuery } from '@/src/services/api/laboratory/materialApi';
import type { MaterialUsageHistoryItem } from '@/src/types/task.types';
import { normalizeMaterialIds, validateMaterialIds } from '@/src/utils/materialAccounting';

function formatQuantity(value: number, unit: string) {
    return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value)} ${unit}`;
}

function formatDateTime(value: string | null | undefined) {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ru-RU');
}

function groupUsages(items: MaterialUsageHistoryItem[]) {
    const groups = new Map<string, MaterialUsageHistoryItem[]>();
    for (const item of items) {
        groups.set(item.materialReportId, [...(groups.get(item.materialReportId) ?? []), item]);
    }
    return Array.from(groups.entries());
}

export default function TaskMaterialAccountingPanel({
    taskId,
    materialIds,
    materialNames,
}: {
    taskId: string;
    materialIds: string[];
    materialNames: string[];
}) {
    const { data: accounting, isLoading: isAccountingLoading } = useGetTaskMaterialAccountingQuery(taskId);
    const { data: usages = [], isLoading: isUsagesLoading } = useGetTaskMaterialUsagesQuery(taskId);
    const { data: materials = [] } = useGetMaterialsQuery();
    const [updateTaskMaterials, { isLoading: isSavingMaterials }] = useUpdateTaskMaterialsMutation();
    const [isEditing, setIsEditing] = useState(false);
    const [selectedIds, setSelectedIds] = useState(() => normalizeMaterialIds(materialIds));
    const materialError = validateMaterialIds(selectedIds);
    const usageGroups = useMemo(() => groupUsages(usages), [usages]);

    const saveMaterials = async () => {
        if (materialError) return;
        try {
            await updateTaskMaterials({ taskId, materialIds: normalizeMaterialIds(selectedIds) }).unwrap();
            setIsEditing(false);
        } catch (error) {
            console.error('Task materials update failed:', error);
        }
    };

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Материальный учёт</h3>
                    <p className="mt-1 text-xs text-slate-400">
                        {accounting?.finalized ? `Расходы зафиксированы · ${formatDateTime(accounting.finalizedAt)}` : 'Предварительные данные'}
                    </p>
                </div>
                {!accounting?.finalized ? (
                    <button type="button" onClick={() => { if (isEditing) setSelectedIds(normalizeMaterialIds(materialIds)); setIsEditing((value) => !value); }} className="rounded-lg border border-violet-200 px-3 py-1.5 text-[10px] font-black text-violet-700 hover:bg-violet-50">
                        {isEditing ? 'Отмена' : 'Изменить материалы'}
                    </button>
                ) : null}
            </div>

            <div className="mt-3">
                <MaterialChips materialNames={materialNames} />
            </div>

            {isEditing ? (
                <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Новый полный набор материалов</p>
                    <div className="mt-2 grid gap-1 sm:grid-cols-2">
                        {materials.filter((material) => material.isActive).map((material) => {
                            const selected = selectedIds.includes(material.id);
                            return (
                                <label key={material.id} className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-slate-700">
                                    <input type="checkbox" checked={selected} onChange={() => setSelectedIds((ids) => selected ? ids.filter((id) => id !== material.id) : normalizeMaterialIds([...ids, material.id]))} className="accent-violet-600" />
                                    {material.name}
                                </label>
                            );
                        })}
                    </div>
                    {materialError ? <p className="mt-2 text-xs font-semibold text-red-600">{materialError}</p> : null}
                    <button type="button" disabled={Boolean(materialError) || isSavingMaterials} onClick={() => void saveMaterials()} className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-xs font-black text-white disabled:bg-slate-300">
                        {isSavingMaterials ? 'Сохранение...' : 'Сохранить полный набор'}
                    </button>
                </div>
            ) : null}

            <div className="mt-4 overflow-x-auto">
                {isAccountingLoading ? <p className="py-4 text-center text-xs text-slate-400">Загрузка план/факт...</p> : accounting?.items.length ? (
                    <table className="min-w-[1120px] w-full text-left text-[10px]">
                        <thead className="text-slate-400"><tr>{['Материал', 'План-норма', 'План-потери', 'План-всего', 'Выдано', 'Использовано', 'Факт-потери', 'Возврат', 'Итоговое списание', 'Отклонение', 'Себестоимость'].map((label) => <th key={label} className="border-b border-slate-200 px-2 py-2 font-black uppercase">{label}</th>)}</tr></thead>
                        <tbody>{accounting.items.map((item) => (
                            <tr key={item.nomenclatureId} className="border-b border-slate-100 text-slate-700">
                                <td className="px-2 py-2 font-bold">{item.nomenclatureName}<span className="ml-1 text-slate-400">({item.unit})</span></td>
                                {[item.plannedStandardQuantity, item.plannedWasteQuantity, item.plannedTotalQuantity, item.issuedQuantity, item.actualConsumedQuantity, item.actualWasteQuantity, item.returnedQuantity, item.actualWriteOffQuantity].map((value, index) => <td key={index} className="px-2 py-2">{formatQuantity(value, item.unit)}</td>)}
                                <td className={`px-2 py-2 font-black ${item.varianceQuantity > 0 ? 'text-red-600' : item.varianceQuantity < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>{formatQuantity(item.varianceQuantity, item.unit)}{item.varianceQuantity > 0 ? ' · перерасход' : item.varianceQuantity < 0 ? ' · экономия' : ''}</td>
                                <td className="px-2 py-2 font-bold">{accounting.finalized ? `${item.finalizedCost.toLocaleString('ru-RU')} ₸` : 'После финализации'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                ) : <p className="py-4 text-center text-xs text-slate-400">План/факт пока не сформирован</p>}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">История по этапам</h4>
                {isUsagesLoading ? <p className="mt-3 text-xs text-slate-400">Загрузка истории...</p> : usageGroups.length ? (
                    <div className="mt-3 space-y-3">{usageGroups.map(([reportId, rows]) => {
                        const first = rows[0];
                        return (
                            <article key={reportId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-black text-slate-800">{first.previousStatusName} → {first.nextStatusName}</p><p className="mt-0.5 text-[10px] text-slate-400">{formatDateTime(first.createdAt)} · {first.employeeName}</p></div><code className="text-[9px] text-slate-400">{reportId.slice(0, 8)}</code></div>
                                <div className="mt-2 space-y-1">{rows.map((row, index) => <div key={row.id ?? `${row.nomenclatureId}-${index}`} className="grid gap-1 rounded-lg bg-white px-2.5 py-2 text-[10px] text-slate-600 sm:grid-cols-[minmax(120px,1fr)_repeat(4,auto)]"><strong className="text-slate-800">{row.nomenclatureName}</strong><span>Выдано {formatQuantity(row.issuedQuantity, row.unit)}</span><span>Исп. {formatQuantity(row.consumedQuantity, row.unit)}</span><span>Потери {formatQuantity(row.wasteQuantity, row.unit)}</span><span>Возврат {formatQuantity(row.returnedQuantity, row.unit)}</span>{row.note ? <p className="sm:col-span-5 text-slate-400">{row.note}</p> : null}</div>)}</div>
                            </article>
                        );
                    })}</div>
                ) : <p className="mt-3 text-xs text-slate-400">Материальные отчёты ещё не отправлялись</p>}
            </div>
        </section>
    );
}
