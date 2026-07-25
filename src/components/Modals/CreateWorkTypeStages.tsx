'use client';

import {useMemo, useRef, useState} from 'react';
import {useSelector} from 'react-redux';

import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';

import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {CSS} from '@dnd-kit/utilities';

import Modal from '@/src/components/ui/Modal';
import RoleCreateModal from '@/src/components/roles/RoleCreateModal';
import RolePicker from '@/src/components/roles/RoleSelect';
import type {RootState} from '@/src/lib/store';
import type {Role} from '@/src/types/role.types';

import {
    useCreateWorkflowWorkTypesMutation,
    useGetWorkflowStatusesQuery,
} from '@/src/services/api/workflowApi';

import {
    useGetRolesQuery,
} from '@/src/services/api/rolesApi';

import type {
    CreateWorkflowWorkTypesDTO,
    WorkflowStatus,
} from '@/src/types/workflow.types';
import {
    findSimilarWorkflowStatus,
    isProtectedWorkflowStatus,
    normalizeWorkflowStageValue,
    searchWorkflowStatuses,
} from '@/src/utils/workflowStageMatching';

type CreateWorkTypeStagesProps = {
    isOpen: boolean;
    onClose: () => void;
};

type WorkflowStage =
    CreateWorkflowWorkTypesDTO['stages'][number];

type IntermediateStage = Omit<
    WorkflowStage,
    'initial' | 'terminal' | 'review'
> & {
    clientId: string;
    existingStatusId?: string;
};

type WorkTypeForm = Omit<
    CreateWorkflowWorkTypesDTO,
    'stages'
>;

type SystemStageType =
    | 'TODO'
    | 'REVIEW'
    | 'DONE';

type SystemRoles = Record<SystemStageType, string>;
type RoleCreationTarget =
    | { kind: 'system'; type: SystemStageType }
    | { kind: 'intermediate'; id: string };

const initialFormData: WorkTypeForm = {
    workTypeCode: '',
    workTypeName: '',
    description: '',
};

const initialSystemRoles: SystemRoles = {
    TODO: '',
    REVIEW: '',
    DONE: '',
};

/*
 * Проверь коды TODO, REVIEW и DONE.
 * Они должны совпадать с кодами, которые ожидает backend.
 */
const SYSTEM_STAGES: Record<
    SystemStageType,
    Omit<WorkflowStage, 'requiredRole'>
> = {
    TODO: {
        code: 'TODO',
        name: 'Нужно сделать',
        description: 'Начальный этап рабочего процесса',
        colorHex: '#64748B',
        initial: true,
        terminal: false,
        review: false,
    },

    REVIEW: {
        code: 'WAITING_FOR_APPROVAL',
        name: 'Ожидание проверки',
        description: 'Проверка результата работы',
        colorHex: '#8B5CF6',
        initial: false,
        terminal: false,
        review: true,
    },

    DONE: {
        code: 'ORDER_CLOSED',
        name: 'Завершено',
        description: 'Рабочий процесс завершён',
        colorHex: '#10B981',
        initial: false,
        terminal: true,
        review: false,
    },
};

function createIntermediateStage(): IntermediateStage {
    return {
        clientId: crypto.randomUUID(),
        code: '',
        name: '',
        description: '',
        colorHex: '#3B82F6',
        requiredRole: '',
    };
}

function hasDuplicateIntermediateStages(stages: IntermediateStage[]) {
    return stages.some((stage, index) =>
        stages.slice(index + 1).some((candidate) => {
            const code = normalizeWorkflowStageValue(stage.code);
            const name = normalizeWorkflowStageValue(stage.name);

            return (
                Boolean(code) &&
                code === normalizeWorkflowStageValue(candidate.code)
            ) || (
                Boolean(name) &&
                name === normalizeWorkflowStageValue(candidate.name)
            );
        }),
    );
}

type RoleSelectProps = {
    value: string;
    disabled?: boolean;
    roles: Role[];
    isLoading: boolean;
    onChange: (value: string) => void;
    canCreate: boolean;
    onCreateRequest: () => void;
};

function RoleSelect({
                        value,
                        disabled,
                        roles,
                        isLoading,
                        onChange,
                        canCreate,
                        onCreateRequest,
                    }: RoleSelectProps) {
    return (
        <RolePicker
            value={value}
            disabled={disabled || isLoading}
            roles={roles}
            isLoading={isLoading}
            onChange={onChange}
            canCreate={canCreate}
            onCreateRequest={onCreateRequest}
        />
    );
}

type SystemStageRowProps = {
    type: SystemStageType;
    requiredRole: string;
    roles: Role[];
    rolesLoading: boolean;
    onRoleChange: (role: string) => void;
    canCreate: boolean;
    onCreateRequest: () => void;
};

function SystemStageRow({
                            type,
                            requiredRole,
                            roles,
                            rolesLoading,
                            onRoleChange,
                            canCreate,
                            onCreateRequest,
                        }: SystemStageRowProps) {
    const stage = SYSTEM_STAGES[type];

    const labelByType: Record<
        SystemStageType,
        string
    > = {
        TODO: 'Начальный',
        REVIEW: 'Проверка',
        DONE: 'Конечный',
    };

    return (
        <div className="grid items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[32px_minmax(150px,1fr)_180px_90px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-black text-slate-400 shadow-sm">
                —
            </div>

            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                            backgroundColor: stage.colorHex,
                        }}
                    />

                    <p className="truncate text-sm font-bold text-slate-900">
                        {stage.name}
                    </p>

                    <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                        {labelByType[type]}
                    </span>
                </div>

                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                    {stage.code}
                </p>
            </div>

            <RoleSelect
                value={requiredRole}
                roles={roles}
                isLoading={rolesLoading}
                onChange={onRoleChange}
                canCreate={canCreate}
                onCreateRequest={onCreateRequest}
            />

            <span className="hidden text-right text-[10px] font-bold uppercase text-slate-400 md:block">
                Закреплён
            </span>
        </div>
    );
}

type SortableStageRowProps = {
    stage: IntermediateStage;
    index: number;
    existingStatuses: WorkflowStatus[];
    statusesLoading: boolean;
    statusesError: boolean;
    roles: Role[];
    rolesLoading: boolean;
    onChange: (
        id: string,
        patch: Partial<IntermediateStage>,
    ) => void;
    onDelete: (id: string) => void;
    onUseExisting: (id: string, status: WorkflowStatus) => void;
    canCreate: boolean;
    onCreateRequest: () => void;
};

type StageIdentityFieldsProps = {
    stage: IntermediateStage;
    index: number;
    existingStatuses: WorkflowStatus[];
    statusesLoading: boolean;
    statusesError: boolean;
    onChange: (
        id: string,
        patch: Partial<IntermediateStage>,
    ) => void;
    onUseExisting: (id: string, status: WorkflowStatus) => void;
};

function StageIdentityFields({
                                 stage,
                                 index,
                                 existingStatuses,
                                 statusesLoading,
                                 statusesError,
                                 onChange,
                                 onUseExisting,
                             }: StageIdentityFieldsProps) {
    const [activeField, setActiveField] =
        useState<'code' | 'name' | null>(null);
    const codeInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const query = activeField === 'code' ? stage.code : stage.name;
    const matches = useMemo(
        () => searchWorkflowStatuses(query, existingStatuses),
        [existingStatuses, query],
    );
    const selectedStatus = existingStatuses.find(
        (status) => status.id === stage.existingStatusId,
    );
    const similarMatch = stage.existingStatusId
        ? undefined
        : findSimilarWorkflowStatus(stage, existingStatuses);
    const similarStatus = existingStatuses.find(
        (status) => status.id === similarMatch?.status.id,
    );
    const similarStatusIsProtected =
        similarStatus ? isProtectedWorkflowStatus(similarStatus) : false;

    const changeIdentity = (
        patch: Pick<Partial<IntermediateStage>, 'code' | 'name'>,
    ) => {
        onChange(stage.clientId, {
            ...patch,
            existingStatusId: undefined,
        });
    };

    const focusSimilarField = () => {
        const target = similarMatch?.matchedBy === 'code'
            ? codeInputRef.current
            : nameInputRef.current;

        target?.focus();
    };

    return (
        <div className="relative min-w-0">
            <div className="grid min-w-0 gap-2 sm:grid-cols-[110px_minmax(140px,1fr)]">
                <input
                    ref={codeInputRef}
                    required
                    type="text"
                    autoComplete="off"
                    value={stage.code}
                    onFocus={() => setActiveField('code')}
                    onBlur={() => setActiveField(null)}
                    onChange={(event) =>
                        changeIdentity({code: event.target.value})
                    }
                    placeholder="CODE"
                    aria-label={`Код промежуточного этапа ${index + 1}`}
                    className="h-10 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs font-bold uppercase outline-none transition focus:border-violet-500 focus:bg-white"
                />

                <input
                    ref={nameInputRef}
                    required
                    type="text"
                    autoComplete="off"
                    value={stage.name}
                    onFocus={() => setActiveField('name')}
                    onBlur={() => setActiveField(null)}
                    onChange={(event) =>
                        changeIdentity({name: event.target.value})
                    }
                    placeholder={`Промежуточный этап ${index + 1}`}
                    aria-label={`Название промежуточного этапа ${index + 1}`}
                    className="h-10 min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none transition focus:border-violet-500 focus:bg-white"
                />
            </div>

            {activeField && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    {statusesLoading ? (
                        <p className="px-3 py-2.5 text-xs font-semibold text-slate-400">
                            Загружаем существующие этапы…
                        </p>
                    ) : statusesError ? (
                        <p className="px-3 py-2.5 text-xs font-semibold text-red-600">
                            Не удалось загрузить существующие этапы.
                        </p>
                    ) : matches.length > 0 ? (
                        <div className="max-h-56 overflow-y-auto py-1">
                            {matches.map(({status}) => {
                                const fullStatus = existingStatuses.find(
                                    (item) => item.id === status.id,
                                );
                                const protectedStatus =
                                    isProtectedWorkflowStatus(status);

                                if (!fullStatus) return null;

                                return protectedStatus ? (
                                    <div
                                        key={status.id}
                                        className="flex items-center justify-between gap-3 px-3 py-2 text-left"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-bold text-slate-500">
                                                {status.name}
                                            </span>
                                            <span className="block truncate font-mono text-[10px] font-bold text-slate-400">
                                                {status.code}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-[10px] font-bold text-slate-400">
                                            Уже добавлен
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        key={status.id}
                                        type="button"
                                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-violet-50"
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            onUseExisting(stage.clientId, fullStatus);
                                            setActiveField(null);
                                        }}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-bold text-slate-700">
                                                {status.name}
                                            </span>
                                            <span className="block truncate font-mono text-[10px] font-bold text-slate-400">
                                                {status.code}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-[10px] font-bold text-violet-600">
                                            Выбрать
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="px-3 py-2.5 text-xs font-semibold text-slate-400">
                            Совпадений нет. Можно оставить новые код и название.
                        </p>
                    )}
                </div>
            )}

            {selectedStatus && (
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                    <span>✓ Используется существующий этап</span>
                    <span className="font-mono">{selectedStatus.code}</span>
                </div>
            )}

            {similarStatus && (
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-bold text-amber-900">
                        Похожий этап уже существует: {similarStatus.name}{' '}
                        <span className="font-mono text-[11px]">
                            ({similarStatus.code})
                        </span>
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-amber-700">
                        {similarStatusIsProtected
                            ? 'Этот системный этап уже добавлен в маршрут автоматически. Измените введённый код или название.'
                            : 'Код и название этапа используются вместе. Измените введённое значение или выберите существующий этап.'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {!similarStatusIsProtected && (
                            <button
                                type="button"
                                onClick={() =>
                                    onUseExisting(stage.clientId, similarStatus)
                                }
                                className="rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-700"
                            >
                                Использовать существующий
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={focusSimilarField}
                            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-800 transition hover:bg-amber-100"
                        >
                            Изменить введённое
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function SortableStageRow({
                              stage,
                              index,
                              existingStatuses,
                              statusesLoading,
                              statusesError,
                              roles,
                              rolesLoading,
                              onChange,
                              onDelete,
                              onUseExisting,
                              canCreate,
                              onCreateRequest,
                          }: SortableStageRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: stage.clientId,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const normalizedColor =
        /^#[0-9A-Fa-f]{6}$/.test(stage.colorHex)
            ? stage.colorHex
            : '#3B82F6';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rounded-xl border bg-white p-3 transition ${
                isDragging
                    ? 'z-50 border-violet-400 opacity-80 shadow-xl'
                    : 'border-slate-200'
            }`}
        >
            <div className="grid items-start gap-2 md:grid-cols-[32px_minmax(260px,1fr)_180px_48px_36px]">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    aria-label="Переместить стадию"
                    className="flex h-9 w-8 touch-none cursor-grab items-center justify-center rounded-lg text-lg font-bold text-slate-400 transition hover:bg-violet-50 hover:text-violet-600 active:cursor-grabbing"
                >
                    ⋮⋮
                </button>

                <StageIdentityFields
                    stage={stage}
                    index={index}
                    existingStatuses={existingStatuses}
                    statusesLoading={statusesLoading}
                    statusesError={statusesError}
                    onChange={onChange}
                    onUseExisting={onUseExisting}
                />

                <RoleSelect
                    value={stage.requiredRole}
                    roles={roles}
                    isLoading={rolesLoading}
                    onChange={(requiredRole) =>
                        onChange(stage.clientId, {
                            requiredRole,
                        })
                    }
                    canCreate={canCreate}
                    onCreateRequest={onCreateRequest}
                />

                <input
                    type="color"
                    value={normalizedColor}
                    onChange={(event) =>
                        onChange(stage.clientId, {
                            colorHex: event.target.value,
                        })
                    }
                    title="Цвет стадии"
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                />

                <button
                    type="button"
                    onClick={() =>
                        onDelete(stage.clientId)
                    }
                    title="Удалить стадию"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold text-red-400 transition hover:bg-red-50 hover:text-red-600"
                >
                    ×
                </button>
            </div>

            <details className="mt-2">
                <summary className="cursor-pointer select-none text-[11px] font-bold text-slate-400 transition hover:text-violet-600">
                    Описание этапа
                </summary>

                <textarea
                    value={stage.description}
                    onChange={(event) =>
                        onChange(stage.clientId, {
                            description: event.target.value,
                        })
                    }
                    placeholder="Необязательное описание стадии"
                    className="mt-2 min-h-16 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none transition focus:border-violet-500 focus:bg-white"
                />
            </details>
        </div>
    );
}

export default function CreateWorkTypeStages({
                                                 isOpen,
                                                 onClose,
                                             }: CreateWorkTypeStagesProps) {
    const [formData, setFormData] =
        useState<WorkTypeForm>(initialFormData);

    const [
        intermediateStages,
        setIntermediateStages,
    ] = useState<IntermediateStage[]>([]);

    const [
        systemRoles,
        setSystemRoles,
    ] = useState<SystemRoles>(initialSystemRoles);

    const [formError, setFormError] =
        useState('');
    const [roleCreationTarget, setRoleCreationTarget] =
        useState<RoleCreationTarget | null>(null);
    const jwtRoles = useSelector((state: RootState) => state.auth.roles);
    const isAdmin = jwtRoles.some(
        (role) => role.toUpperCase().replace(/^ROLE_/u, '') === 'ADMIN'
    );
    const canViewRoles = isAdmin || jwtRoles.some(
        (role) => role.toUpperCase().replace(/^ROLE_/u, '') === 'CHIEF_TECHNICIAN'
    );

    const {
        data: roles = [],
        isLoading: rolesLoading,
        isError: rolesError,
    } = useGetRolesQuery(undefined, {skip: !canViewRoles});

    const {
        data: existingStatuses = [],
        isLoading: statusesLoading,
        isFetching: statusesFetching,
        isError: statusesError,
        refetch: refetchStatuses,
    } = useGetWorkflowStatusesQuery(undefined, {skip: !isOpen});

    const [
        createWorkflowWorkTypes,
        {
            isLoading: creating,
            error: createError,
        },
    ] = useCreateWorkflowWorkTypesMutation();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter:
            sortableKeyboardCoordinates,
        }),
    );

    if (!isOpen) return null;

    const addIntermediateStage = () => {
        setIntermediateStages((current) => [
            ...current,
            createIntermediateStage(),
        ]);

        setFormError('');
    };

    const updateIntermediateStage = (
        id: string,
        patch: Partial<IntermediateStage>,
    ) => {
        setIntermediateStages((current) =>
            current.map((stage) =>
                stage.clientId === id
                    ? {
                        ...stage,
                        ...patch,
                    }
                    : stage,
            ),
        );
    };

    const deleteIntermediateStage = (
        id: string,
    ) => {
        setIntermediateStages((current) =>
            current.filter(
                (stage) => stage.clientId !== id,
            ),
        );
    };

    const useExistingStage = (
        id: string,
        status: WorkflowStatus,
    ) => {
        updateIntermediateStage(id, {
            existingStatusId: status.id,
            code: status.code,
            name: status.name,
            description: status.description ?? '',
            colorHex: status.colorHex || '#3B82F6',
        });
        setFormError('');
    };

    const handleDragEnd = (
        event: DragEndEvent,
    ) => {
        const {active, over} = event;

        if (!over || active.id === over.id) {
            return;
        }

        setIntermediateStages((current) => {
            const oldIndex = current.findIndex(
                (stage) =>
                    stage.clientId === active.id,
            );

            const newIndex = current.findIndex(
                (stage) =>
                    stage.clientId === over.id,
            );

            if (
                oldIndex === -1 ||
                newIndex === -1
            ) {
                return current;
            }

            return arrayMove(
                current,
                oldIndex,
                newIndex,
            );
        });
    };

    const buildSystemStage = (
        type: SystemStageType,
    ): WorkflowStage => ({
        ...SYSTEM_STAGES[type],
        requiredRole: systemRoles[type],
    });

    const buildIntermediatePayload = (
        stage: IntermediateStage,
    ): WorkflowStage => ({
        code: stage.code.trim(),
        name: stage.name.trim(),
        description: stage.description.trim(),
        colorHex: stage.colorHex,
        requiredRole: stage.requiredRole,
        initial: false,
        terminal: false,
        review: false,
    });

    const resetForm = () => {
        setFormData(initialFormData);
        setIntermediateStages([]);
        setSystemRoles(initialSystemRoles);
        setFormError('');
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();
        setFormError('');

        if (statusesError) {
            setFormError(
                'Не удалось проверить этапы на дубликаты. Повторите загрузку списка этапов.',
            );
            return;
        }

        const unresolvedSimilarStage = intermediateStages
            .filter((stage) => !stage.existingStatusId)
            .map((stage) => ({
                stage,
                match: findSimilarWorkflowStatus(stage, existingStatuses),
            }))
            .find(({match}) => Boolean(match));

        if (unresolvedSimilarStage?.match) {
            setFormError(
                `Этап «${unresolvedSimilarStage.stage.name || unresolvedSimilarStage.stage.code}» похож на существующий «${unresolvedSimilarStage.match.status.name}» (${unresolvedSimilarStage.match.status.code}). Используйте существующий этап или измените код и название.`,
            );
            return;
        }

        if (hasDuplicateIntermediateStages(intermediateStages)) {
            setFormError(
                'В маршруте повторяются коды или названия промежуточных этапов. Используйте каждый этап только один раз.',
            );
            return;
        }

        const normalizedIntermediateStages =
            intermediateStages.map(
                buildIntermediatePayload,
            );

        const payload:
            CreateWorkflowWorkTypesDTO = {
            ...formData,

            stages: [
                buildSystemStage('TODO'),

                ...normalizedIntermediateStages,

                buildSystemStage('REVIEW'),
                buildSystemStage('DONE'),
            ],
        };

        try {
            const result =
                await createWorkflowWorkTypes(
                    payload,
                ).unwrap();

            console.log(
                'Created workflow:',
                result,
            );

            resetForm();
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
        <Modal contentClassName="max-h-[90vh] max-w-4xl overflow-hidden p-0">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                        Рабочий процесс
                    </p>

                    <h2 className="mt-1 text-lg font-black text-slate-950">
                        Создать тип работы
                    </h2>

                    <p className="text-xs text-slate-500">
                        Добавьте и расположите промежуточные стадии
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xl font-bold text-slate-400 transition hover:bg-slate-200"
                >
                    ×
                </button>
            </header>

            <form
                onSubmit={handleSubmit}
                className="max-h-[calc(90vh-76px)] overflow-y-auto"
            >
                <div className="space-y-5 p-5">
                    <section className="grid gap-3 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Код типа работы
                            </label>

                            <input
                                required
                                type="text"
                                value={formData.workTypeCode}
                                onChange={(event) =>
                                    setFormData(
                                        (current) => ({
                                            ...current,
                                            workTypeCode:
                                            event.target
                                                .value,
                                        }),
                                    )
                                }
                                placeholder="CROWN"
                                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs font-bold uppercase outline-none transition focus:border-violet-500 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Название
                            </label>

                            <input
                                required
                                type="text"
                                value={formData.workTypeName}
                                onChange={(event) =>
                                    setFormData(
                                        (current) => ({
                                            ...current,
                                            workTypeName:
                                            event.target
                                                .value,
                                        }),
                                    )
                                }
                                placeholder="Коронка"
                                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-500 focus:bg-white"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <textarea
                                value={formData.description}
                                onChange={(event) =>
                                    setFormData(
                                        (current) => ({
                                            ...current,
                                            description:
                                            event.target
                                                .value,
                                        }),
                                    )
                                }
                                placeholder="Описание типа работы"
                                className="min-h-16 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none transition focus:border-violet-500 focus:bg-white"
                            />
                        </div>
                    </section>

                    <section>
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-black text-slate-900">
                                    Стадии
                                </h3>

                                <p className="text-[11px] text-slate-400">
                                    Введите новый этап или выберите существующий по коду либо названию
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    addIntermediateStage
                                }
                                className="rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
                            >
                                + Добавить стадию
                            </button>
                        </div>

                        <div className="space-y-2">
                            <SystemStageRow
                                type="TODO"
                                requiredRole={
                                    systemRoles.TODO
                                }
                                roles={roles}
                                rolesLoading={
                                    rolesLoading
                                }
                                canCreate={isAdmin}
                                onCreateRequest={() =>
                                    setRoleCreationTarget({
                                        kind: 'system',
                                        type: 'TODO',
                                    })
                                }
                                onRoleChange={(
                                    requiredRole,
                                ) =>
                                    setSystemRoles(
                                        (current) => ({
                                            ...current,
                                            TODO: requiredRole,
                                        }),
                                    )
                                }
                            />

                            {intermediateStages.length >
                            0 ? (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={
                                        closestCenter
                                    }
                                    onDragEnd={
                                        handleDragEnd
                                    }
                                >
                                    <SortableContext
                                        items={intermediateStages.map(
                                            (stage) =>
                                                stage.clientId,
                                        )}
                                        strategy={
                                            verticalListSortingStrategy
                                        }
                                    >
                                        <div className="space-y-2">
                                            {intermediateStages.map(
                                                (
                                                    stage,
                                                    index,
                                                ) => (
                                                    <SortableStageRow
                                                        key={
                                                            stage.clientId
                                                        }
                                                        stage={
                                                            stage
                                                        }
                                                        index={
                                                            index
                                                        }
                                                        existingStatuses={
                                                            existingStatuses
                                                        }
                                                        statusesLoading={
                                                            statusesLoading
                                                        }
                                                        statusesError={
                                                            statusesError
                                                        }
                                                        roles={
                                                            roles
                                                        }
                                                        rolesLoading={
                                                            rolesLoading
                                                        }
                                                        canCreate={
                                                            isAdmin
                                                        }
                                                        onCreateRequest={() =>
                                                            setRoleCreationTarget({
                                                                kind: 'intermediate',
                                                                id: stage.clientId,
                                                            })
                                                        }
                                                        onChange={
                                                            updateIntermediateStage
                                                        }
                                                        onDelete={
                                                            deleteIntermediateStage
                                                        }
                                                        onUseExisting={
                                                            useExistingStage
                                                        }
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                <button
                                    type="button"
                                    onClick={
                                        addIntermediateStage
                                    }
                                    className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-xs font-medium text-slate-400 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
                                >
                                    Добавить промежуточную стадию
                                </button>
                            )}

                            <SystemStageRow
                                type="REVIEW"
                                requiredRole={
                                    systemRoles.REVIEW
                                }
                                roles={roles}
                                rolesLoading={
                                    rolesLoading
                                }
                                canCreate={isAdmin}
                                onCreateRequest={() =>
                                    setRoleCreationTarget({
                                        kind: 'system',
                                        type: 'REVIEW',
                                    })
                                }
                                onRoleChange={(
                                    requiredRole,
                                ) =>
                                    setSystemRoles(
                                        (current) => ({
                                            ...current,
                                            REVIEW:
                                            requiredRole,
                                        }),
                                    )
                                }
                            />

                            <SystemStageRow
                                type="DONE"
                                requiredRole={
                                    systemRoles.DONE
                                }
                                roles={roles}
                                rolesLoading={
                                    rolesLoading
                                }
                                canCreate={isAdmin}
                                onCreateRequest={() =>
                                    setRoleCreationTarget({
                                        kind: 'system',
                                        type: 'DONE',
                                    })
                                }
                                onRoleChange={(
                                    requiredRole,
                                ) =>
                                    setSystemRoles(
                                        (current) => ({
                                            ...current,
                                            DONE: requiredRole,
                                        }),
                                    )
                                }
                            />
                        </div>
                    </section>

                    {rolesError && (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                            Не удалось загрузить список ролей.
                        </p>
                    )}

                    {statusesError && (
                        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                Не удалось загрузить существующие этапы. Проверка дубликатов недоступна.
                            </span>
                            <button
                                type="button"
                                onClick={() => void refetchStatuses()}
                                disabled={statusesFetching}
                                className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
                            >
                                {statusesFetching ? 'Загружаем…' : 'Повторить'}
                            </button>
                        </div>
                    )}

                    {formError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                            {formError}
                        </p>
                    )}

                    {createError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                            Сервер не смог создать рабочий процесс.
                        </p>
                    )}
                </div>

                <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100"
                    >
                        Отмена
                    </button>

                    <button
                        type="submit"
                        disabled={
                            creating ||
                            rolesLoading ||
                            statusesLoading ||
                            statusesError
                        }
                        className="rounded-lg bg-violet-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {creating
                            ? 'Создание...'
                            : 'Создать процесс'}
                    </button>
                </footer>
            </form>
        </Modal>
        {roleCreationTarget && isAdmin && (
            <RoleCreateModal
                onClose={() => setRoleCreationTarget(null)}
                onCreated={(role) => {
                    if (roleCreationTarget.kind === 'system') {
                        const type = roleCreationTarget.type;
                        setSystemRoles((current) => ({
                            ...current,
                            [type]: role.code,
                        }));
                    } else {
                        updateIntermediateStage(roleCreationTarget.id, {
                            requiredRole: role.code,
                        });
                    }
                    setRoleCreationTarget(null);
                }}
            />
        )}
        </>
    );
}
