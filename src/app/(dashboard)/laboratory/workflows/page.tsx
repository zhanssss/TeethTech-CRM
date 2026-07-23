'use client';

import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useGetWorkTypesQuery } from '@/src/services/api/laboratory/workTypesApi';
import QueryErrorNotice from '@/src/components/ui/QueryErrorNotice';
import RoleCreateModal from '@/src/components/roles/RoleCreateModal';
import RoleSelect from '@/src/components/roles/RoleSelect';
import type { RootState } from '@/src/lib/store';
import { useGetRolesQuery } from '@/src/services/api/rolesApi';
import {
    useCreateAdminWorkflowStepMutation,
    useCreateOrderStatusMutation,
    useDeleteAdminWorkflowStepMutation,
    useDeleteOrderStatusMutation,
    useGetAdminWorkflowStepsQuery,
    useGetOrderStatusesQuery,
    useGetWorkflowStatusesQuery,
    useUpdateOrderStatusConfigMutation,
} from '@/src/services/api/workflowApi';

type WorkflowStep = {
    id: string;
    name: string;
};

type Workflow = {
    id: string;
    name: string;
    description: string;
    startName: string;
    endName: string;
    steps: WorkflowStep[];
    createdAt: string;
};

const STORAGE_KEY = 'teeth-tech-custom-workflows';

function createId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getColorInputValue(value?: string) {
    return /^#[0-9a-fA-F]{6}$/.test(value ?? '') ? value as string : '#2563eb';
}

function SortableStep({
    step,
    index,
    onRemove,
}: {
    step: WorkflowStep;
    index: number;
    onRemove: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: step.id });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
            <button
                type="button"
                aria-label={`Переместить этап ${step.name}`}
                className="cursor-grab rounded-lg bg-slate-100 px-2.5 py-2 text-slate-400 active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                ⋮⋮
            </button>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
                {index + 2}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">
                {step.name}
            </p>
            <button
                type="button"
                onClick={() => onRemove(step.id)}
                className="rounded-lg px-2.5 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50"
            >
                Удалить
            </button>
        </div>
    );
}

export default function LaboratoryWorkflowsPage() {
    const [workflowName, setWorkflowName] = useState('');
    const [description, setDescription] = useState('');
    const [startName, setStartName] = useState('Новая задача');
    const [endName, setEndName] = useState('Готово');
    const [newStepName, setNewStepName] = useState('');
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [error, setError] = useState('');
    const [isStorageReady, setIsStorageReady] = useState(false);
    const [selectedWorkTypeId, setSelectedWorkTypeId] = useState('');
    const [fromStatusId, setFromStatusId] = useState('');
    const [toStatusId, setToStatusId] = useState('');
    const [requiredRole, setRequiredRole] = useState('');
    const [stepSortOrder, setStepSortOrder] = useState('0');
    const [materialReportRequired, setMaterialReportRequired] = useState(false);
    const [allowUnplannedMaterials, setAllowUnplannedMaterials] = useState(false);
    const [serverWorkflowError, setServerWorkflowError] = useState('');
    const [statusDraftId, setStatusDraftId] = useState('');
    const [statusCode, setStatusCode] = useState('');
    const [statusName, setStatusName] = useState('');
    const [statusDescription, setStatusDescription] = useState('');
    const [statusSortOrder, setStatusSortOrder] = useState('0');
    const [statusColorHex, setStatusColorHex] = useState('#2563eb');
    const [isRoleCreateOpen, setIsRoleCreateOpen] = useState(false);
    const jwtRoles = useSelector((state: RootState) => state.auth.roles);
    const isAdmin = jwtRoles.some(
        (role) => role.toUpperCase().replace(/^ROLE_/u, '') === 'ADMIN'
    );
    const canViewRoles = isAdmin || jwtRoles.some(
        (role) => role.toUpperCase().replace(/^ROLE_/u, '') === 'CHIEF_TECHNICIAN'
    );

    const {
        data: workTypes = [],
        isLoading: isWorkTypesLoading,
        isFetching: isWorkTypesFetching,
        isError: isWorkTypesError,
        refetch: refetchWorkTypes,
    } = useGetWorkTypesQuery();
    const {
        data: availableRoles = [],
        isLoading: isRolesLoading,
        isFetching: isRolesFetching,
        isError: isRolesError,
        refetch: refetchRoles,
    } = useGetRolesQuery(undefined, { skip: !canViewRoles });
    const serverWorkTypeId = selectedWorkTypeId || workTypes[0]?.id || '';
    const {
        data: workflowStatuses = [],
        isLoading: isWorkflowStatusesLoading,
        isFetching: isWorkflowStatusesFetching,
        isError: isWorkflowStatusesError,
        refetch: refetchWorkflowStatuses,
    } = useGetWorkflowStatusesQuery();
    const {
        data: serverWorkflowSteps = [],
        isFetching: isServerWorkflowStepsFetching,
        isError: isServerWorkflowStepsError,
        refetch: refetchServerWorkflowSteps,
    } = useGetAdminWorkflowStepsQuery(
        { workTypeId: serverWorkTypeId },
        { skip: !serverWorkTypeId }
    );
    const {
        data: orderStatuses = [],
        isFetching: isOrderStatusesFetching,
        isError: isOrderStatusesError,
        refetch: refetchOrderStatuses,
    } = useGetOrderStatusesQuery();
    const [createAdminWorkflowStep, { isLoading: isCreatingServerStep }] = useCreateAdminWorkflowStepMutation();
    const [deleteAdminWorkflowStep, { isLoading: isDeletingServerStep }] = useDeleteAdminWorkflowStepMutation();
    const [createOrderStatus, { isLoading: isCreatingOrderStatus }] = useCreateOrderStatusMutation();
    const [updateOrderStatusConfig, { isLoading: isUpdatingOrderStatus }] = useUpdateOrderStatusConfigMutation();
    const [deleteOrderStatus, { isLoading: isDeletingOrderStatus }] = useDeleteOrderStatusMutation();
    const isSavingOrderStatus = isCreatingOrderStatus || isUpdatingOrderStatus;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    );

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved) setWorkflows(JSON.parse(saved) as Workflow[]);
        } catch {
            setWorkflows([]);
        } finally {
            setIsStorageReady(true);
        }
    }, []);

    useEffect(() => {
        if (!isStorageReady) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    }, [isStorageReady, workflows]);

    const clearServerMessages = () => {
        setServerWorkflowError('');
    };

    const handleServerStepSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        clearServerMessages();

        if (!serverWorkTypeId || !fromStatusId || !toStatusId || !requiredRole.trim()) {
            setServerWorkflowError('Выберите тип работы, статусы перехода и роль.');
            return;
        }

        if (fromStatusId === toStatusId) {
            setServerWorkflowError('Начальный и конечный статусы должны отличаться.');
            return;
        }

        try {
            await createAdminWorkflowStep({
                workTypeId: serverWorkTypeId,
                fromStatusId,
                toStatusId,
                requiredRole: requiredRole.trim(),
                sortOrder: Number(stepSortOrder) || 0,
                materialReportRequired,
                allowUnplannedMaterials,
            }).unwrap();
            setRequiredRole('');
            setStepSortOrder('0');
        } catch (error) {
            console.error('Workflow step create failed:', error);
        }
    };

    const handleDeleteServerStep = async (id: string) => {
        clearServerMessages();

        try {
            await deleteAdminWorkflowStep(id).unwrap();
        } catch (error) {
            console.error('Workflow step delete failed:', error);
        }
    };

    const selectStatusDraft = (id: string) => {
        const selectedStatus = orderStatuses.find((status) => status.id === id);

        setStatusDraftId(id);
        clearServerMessages();

        if (!selectedStatus) {
            setStatusCode('');
            setStatusName('');
            setStatusDescription('');
            setStatusSortOrder('0');
            setStatusColorHex('#2563eb');
            return;
        }

        setStatusCode(selectedStatus.code);
        setStatusName(selectedStatus.name);
        setStatusDescription(selectedStatus.description ?? '');
        setStatusSortOrder(String(selectedStatus.sortOrder ?? 0));
        setStatusColorHex(getColorInputValue(selectedStatus.colorHex));
    };

    const handleOrderStatusSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        clearServerMessages();

        if (!statusCode.trim() || !statusName.trim()) {
            setServerWorkflowError('Укажите код и название статуса.');
            return;
        }

        const body = {
            code: statusCode.trim(),
            name: statusName.trim(),
            description: statusDescription.trim(),
            sortOrder: Number(statusSortOrder) || 0,
            colorHex: statusColorHex.trim() || '#2563eb',
        };

        try {
            if (statusDraftId) {
                await updateOrderStatusConfig({
                    id: statusDraftId,
                    body: {
                        id: statusDraftId,
                        ...body,
                    },
                }).unwrap();
            } else {
                await createOrderStatus(body).unwrap();
            }
        } catch (error) {
            console.error('Order status save failed:', error);
        }
    };

    const handleDeleteOrderStatus = async () => {
        if (!statusDraftId) {
            setServerWorkflowError('Выберите статус для удаления.');
            return;
        }

        clearServerMessages();

        try {
            await deleteOrderStatus(statusDraftId).unwrap();
            selectStatusDraft('');
        } catch (error) {
            console.error('Order status delete failed:', error);
        }
    };

    const addStep = () => {
        const name = newStepName.trim();
        if (!name) return;

        setSteps((current) => [
            ...current,
            { id: createId('step'), name },
        ]);
        setNewStepName('');
        setError('');
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;

        setSteps((current) => {
            const oldIndex = current.findIndex((step) => step.id === active.id);
            const newIndex = current.findIndex((step) => step.id === over.id);

            return arrayMove(current, oldIndex, newIndex);
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!workflowName.trim() || !startName.trim() || !endName.trim()) {
            setError('Заполните название workflow, начало и завершение');
            return;
        }

        if (steps.length === 0) {
            setError('Добавьте хотя бы один промежуточный этап');
            return;
        }

        const workflow: Workflow = {
            id: createId('workflow'),
            name: workflowName.trim(),
            description: description.trim(),
            startName: startName.trim(),
            endName: endName.trim(),
            steps,
            createdAt: new Date().toISOString(),
        };

        setWorkflows((current) => [workflow, ...current]);
        setWorkflowName('');
        setDescription('');
        setStartName('Новая задача');
        setEndName('Готово');
        setNewStepName('');
        setSteps([]);
        setError('');
    };

    const orderedServerSteps = [...serverWorkflowSteps].sort((a, b) => a.sortOrder - b.sortOrder);
    const routeNodes = orderedServerSteps.length > 0
        ? [
            { id: orderedServerSteps[0].fromStatusId, name: orderedServerSteps[0].fromStatusName },
            ...orderedServerSteps.map((step) => ({ id: step.toStatusId, name: step.toStatusName })),
        ].filter((node, index, nodes) => index === 0 || node.id !== nodes[index - 1].id)
        : [];
    const selectedWorkTypeName = workTypes.find((item) => item.id === serverWorkTypeId)?.name ?? 'Тип работы не выбран';

    return (
        <div className="space-y-5">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    Маршруты производства
                </h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">
                    Настройте, через какие этапы проходит работа и какая роль отвечает за каждый переход.
                </p>
                </div><span className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500">{workTypes.length} типов работ · {workflowStatuses.length} статусов</span>
            </header>

            {(isWorkTypesError || isWorkflowStatusesError || isRolesError) && (
                <QueryErrorNotice
                    message={`Не удалось загрузить ${[
                        isWorkTypesError ? 'типы работ' : '',
                        isWorkflowStatusesError ? 'статусы workflow' : '',
                        isRolesError ? 'роли' : '',
                    ].filter(Boolean).join(' и ')}.`}
                    onRetry={() => {
                        if (isWorkTypesError) void refetchWorkTypes();
                        if (isWorkflowStatusesError) void refetchWorkflowStatuses();
                        if (isRolesError) void refetchRoles();
                    }}
                    isRetrying={isWorkTypesFetching || isWorkflowStatusesFetching || isRolesFetching}
                />
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Шаг 1</p><h2 className="mt-1 text-base font-black text-slate-900">Выберите тип работы</h2><p className="mt-1 text-xs text-slate-400">У каждого типа работы может быть собственный маршрут.</p></div>
                    <select value={serverWorkTypeId} onChange={(event) => setSelectedWorkTypeId(event.target.value)} disabled={isWorkTypesLoading || workTypes.length === 0} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 lg:w-80">{workTypes.length === 0 ? <option value="">Нет типов работ</option> : workTypes.map((workType) => <option key={workType.id} value={workType.id}>{workType.name}</option>)}</select>
                </div>
                <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Шаг 2</p><h2 className="mt-1 text-base font-black text-slate-900">Маршрут: {selectedWorkTypeName}</h2></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{orderedServerSteps.length} переходов</span></div>
                    {routeNodes.length > 0 ? <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-50 p-4">{routeNodes.map((node, index) => { const status = workflowStatuses.find((item) => item.id === node.id); return <span key={`${node.id}-${index}`} className="contents">{index > 0 && <span className="text-lg text-slate-300">→</span>}<span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm" style={{borderLeftColor: status?.colorHex || '#8b5cf6', borderLeftWidth: 4}}>{node.name}</span></span>;})}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"><p className="text-sm font-semibold text-slate-600">Маршрут пока пуст</p><p className="mt-1 text-xs text-slate-400">Добавьте первый переход в форме ниже.</p></div>}
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(22rem,1.2fr)_minmax(22rem,0.8fr)]">
                <form
                    onSubmit={handleServerStepSubmit}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Шаг 3</p><h2 className="mt-1 font-bold text-slate-900">Добавить переход</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Укажите текущий и следующий этап, затем назначьте ответственную роль.
                            </p>
                        </div>
                        {isServerWorkflowStepsFetching && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                Загрузка
                            </span>
                        )}
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <label>
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Текущий этап</span>
                            <select
                                required
                                value={fromStatusId}
                                onChange={(event) => setFromStatusId(event.target.value)}
                                disabled={isWorkflowStatusesLoading || workflowStatuses.length === 0}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                                <option value="">Выберите статус</option>
                                {workflowStatuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Следующий этап</span>
                            <select
                                required
                                value={toStatusId}
                                onChange={(event) => setToStatusId(event.target.value)}
                                disabled={isWorkflowStatusesLoading || workflowStatuses.length === 0}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                                <option value="">Выберите статус</option>
                                {workflowStatuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Ответственная роль</span>
                            <RoleSelect
                                required
                                value={requiredRole}
                                onChange={setRequiredRole}
                                roles={availableRoles}
                                isLoading={isRolesLoading}
                                disabled={isRolesError}
                                canCreate={isAdmin}
                                onCreateRequest={() => setIsRoleCreateOpen(true)}
                            />
                        </label>

                        <label>
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Порядок шага</span>
                            <input
                                type="number"
                                value={stepSortOrder}
                                onChange={(event) => setStepSortOrder(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                            />
                        </label>

                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <input type="checkbox" checked={materialReportRequired} onChange={(event) => setMaterialReportRequired(event.target.checked)} className="mt-0.5 accent-violet-600" />
                            <span><strong className="block text-sm text-slate-700">Материальный отчёт обязателен</strong><span className="mt-1 block text-xs text-slate-500">Переход нельзя подтвердить без ненулевых строк расхода.</span></span>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <input type="checkbox" checked={allowUnplannedMaterials} onChange={(event) => setAllowUnplannedMaterials(event.target.checked)} className="mt-0.5 accent-violet-600" />
                            <span><strong className="block text-sm text-slate-700">Разрешить внеплановые материалы</strong><span className="mt-1 block text-xs text-slate-500">Сотрудник сможет выбрать другую активную номенклатуру.</span></span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isCreatingServerStep || !serverWorkTypeId || !requiredRole || isRolesError}
                        className="mt-4 w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-950/15 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                    >
                        {isCreatingServerStep ? 'Добавляем...' : '+ Добавить переход'}
                    </button>

                    <div className="mt-5 space-y-3">
                        {isServerWorkflowStepsError && (
                            <QueryErrorNotice
                                message="Не удалось загрузить шаги workflow."
                                onRetry={() => void refetchServerWorkflowSteps()}
                                isRetrying={isServerWorkflowStepsFetching}
                            />
                        )}

                        {orderedServerSteps.map((step, index) => (
                            <div
                                key={step.id}
                                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-black text-violet-700">{index + 1}</span><p className="truncate text-sm font-bold text-slate-800"><span className="rounded-lg bg-slate-100 px-2 py-1">{step.fromStatusName}</span><span className="mx-2 text-violet-500">→</span><span className="rounded-lg bg-violet-50 px-2 py-1 text-violet-700">{step.toStatusName}</span></p></div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Ответственный: {step.requiredRole} · порядок {step.sortOrder} · отчёт {step.materialReportRequired ? 'обязателен' : 'необязателен'} · внеплановые {step.allowUnplannedMaterials ? 'разрешены' : 'запрещены'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteServerStep(step.id)}
                                    disabled={isDeletingServerStep}
                                    className="rounded-lg px-3 py-2 text-xs font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
                                >
                                    Удалить
                                </button>
                            </div>
                        ))}

                        {!isServerWorkflowStepsFetching && !isServerWorkflowStepsError && serverWorkflowSteps.length === 0 && (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                                Для выбранного типа работы серверных шагов пока нет.
                            </div>
                        )}
                    </div>
                </form>

                <form
                    onSubmit={handleOrderStatusSubmit}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Статусы заказа</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Глобальные этапы для канбана и фильтров.
                            </p>
                        </div>
                        {isOrderStatusesFetching && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                Загрузка
                            </span>
                        )}
                    </div>

                    <div className="mt-5 space-y-3">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Редактируемый статус</span>
                            <select
                                value={statusDraftId}
                                onChange={(event) => selectStatusDraft(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            >
                                <option value="">Создать новый статус</option>
                                {orderStatuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label>
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Код</span>
                                <input
                                    required
                                    value={statusCode}
                                    onChange={(event) => setStatusCode(event.target.value)}
                                    placeholder="IN_PROGRESS"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </label>

                            <label>
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Название</span>
                                <input
                                    required
                                    value={statusName}
                                    onChange={(event) => setStatusName(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Описание</span>
                            <input
                                value={statusDescription}
                                onChange={(event) => setStatusDescription(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </label>

                        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                            <label>
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Сортировка</span>
                                <input
                                    type="number"
                                    value={statusSortOrder}
                                    onChange={(event) => setStatusSortOrder(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </label>

                            <label>
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Цвет</span>
                                <input
                                    type="color"
                                    value={statusColorHex}
                                    onChange={(event) => setStatusColorHex(event.target.value)}
                                    className="h-[46px] w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                            type="submit"
                            disabled={isSavingOrderStatus}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            {isSavingOrderStatus ? 'Сохраняем...' : statusDraftId ? 'Обновить статус' : 'Создать статус'}
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteOrderStatus}
                            disabled={!statusDraftId || isDeletingOrderStatus}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-500 px-5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
                        >
                            {isDeletingOrderStatus ? 'Удаляем...' : 'Удалить'}
                        </button>
                    </div>
                </form>
            </section>

            {serverWorkflowError && (
                <section className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    {serverWorkflowError}
                </section>
            )}

            {isOrderStatusesError && (
                <QueryErrorNotice
                    message="Не удалось загрузить статусы заказа."
                    onRetry={() => void refetchOrderStatuses()}
                    isRetrying={isOrderStatusesFetching}
                />
            )}

            <details className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden"><div><h2 className="text-sm font-bold text-slate-900">Дополнительный локальный конструктор</h2><p className="mt-1 text-xs text-slate-400">Прототип процессов, которые сохраняются только в этом браузере и не влияют на серверный маршрут.</p></div><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-open:rotate-180">⌄</span></summary>
                <div className="space-y-5 border-t border-slate-100 p-4 sm:p-5">
            <form
                onSubmit={handleSubmit}
                className="grid gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(22rem,1.2fr)]"
            >
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="font-bold text-slate-900">Новый тип задачи</h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Название будет видно диспетчеру при выборе процесса.
                    </p>

                    <div className="mt-5 space-y-4">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Название workflow
                            </span>
                            <input
                                value={workflowName}
                                onChange={(event) => setWorkflowName(event.target.value)}
                                placeholder="Например, Коронка из циркония"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                Описание
                            </span>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Для каких заказов используется этот процесс"
                                rows={3}
                                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                            />
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label>
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Начальный этап
                                </span>
                                <input
                                    value={startName}
                                    onChange={(event) => setStartName(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </label>

                            <label>
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Финальный этап
                                </span>
                                <input
                                    value={endName}
                                    onChange={(event) => setEndName(event.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                />
                            </label>
                        </div>

                        {error && (
                            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                        >
                            Сохранить workflow
                        </button>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="font-bold text-slate-900">Этапы процесса</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Начало и завершение фиксированы, середину можно менять местами.
                            </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
                            {steps.length + 2} этапа
                        </span>
                    </div>

                    <div className="mt-5 flex gap-2">
                        <input
                            value={newStepName}
                            onChange={(event) => setNewStepName(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    addStep();
                                }
                            }}
                            placeholder="Название промежуточного этапа"
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={addStep}
                            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                        >
                            + Этап
                        </button>
                    </div>

                    <div className="mt-5 space-y-3">
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                                1
                            </span>
                            <p className="text-sm font-bold text-emerald-900">
                                {startName.trim() || 'Начало'}
                            </p>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={steps.map((step) => step.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-3">
                                    {steps.map((step, index) => (
                                        <SortableStep
                                            key={step.id}
                                            step={step}
                                            index={index}
                                            onRemove={(id) =>
                                                setSteps((current) =>
                                                    current.filter((item) => item.id !== id)
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {steps.length === 0 && (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-400">
                                Добавьте этапы между началом и завершением
                            </div>
                        )}

                        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                                {steps.length + 2}
                            </span>
                            <p className="text-sm font-bold text-blue-900">
                                {endName.trim() || 'Завершение'}
                            </p>
                        </div>
                    </div>
                </section>
            </form>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="font-bold text-slate-900">Сохраненные workflow</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Локальные настройки диспетчера для прототипа интерфейса.
                        </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {workflows.length}
                    </span>
                </div>

                {workflows.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-400">
                        Пока нет сохраненных процессов
                    </div>
                ) : (
                    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                        {workflows.map((workflow) => (
                            <article
                                key={workflow.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900">
                                            {workflow.name}
                                        </h3>
                                        {workflow.description && (
                                            <p className="mt-1 text-xs text-slate-500">
                                                {workflow.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setWorkflows((current) =>
                                                current.filter((item) => item.id !== workflow.id)
                                            )
                                        }
                                        className="text-xs font-bold text-red-500 transition hover:text-red-700"
                                    >
                                        Удалить
                                    </button>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                                        {workflow.startName}
                                    </span>
                                    {workflow.steps.map((step) => (
                                        <span key={step.id} className="contents">
                                            <span className="text-slate-300">→</span>
                                            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                                {step.name}
                                            </span>
                                        </span>
                                    ))}
                                    <span className="text-slate-300">→</span>
                                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">
                                        {workflow.endName}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
                </div>
            </details>
            {isRoleCreateOpen && isAdmin && (
                <RoleCreateModal
                    onClose={() => setIsRoleCreateOpen(false)}
                    onCreated={(role) => setRequiredRole(role.code)}
                />
            )}
        </div>
    );
}
