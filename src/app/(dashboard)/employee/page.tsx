'use client';

import Link from 'next/link';
import { type FormEvent, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import TaskDetailsSidebar from '@/src/components/layout/TaskDetailsSidebar';
import ErrorModal from '@/src/components/ui/ErrorModal';
import { RootState } from '@/src/lib/store';
import { mockEmployees } from '@/src/mock/employees';
import { mockTasks } from '@/src/mock/tasks';
import { useUpdateTaskStatusMutation } from '@/src/services/api/ordersApi';
import { useChangeUserPasswordMutation } from '@/src/services/api/usersApi';
import { useGetAvailableWorkflowTransitionsQuery } from '@/src/services/api/workflowApi';
import type {
    ProductionTask,
    Task,
    TaskAttachment,
    TaskComment,
    TaskHistoryItem,
    TaskImage,
    TaskStatus,
} from '@/src/types/task.types';
import type { WorkflowTransition } from '@/src/types/workflow.types';

const TASK_STAGES: Array<{
    id: TaskStatus;
    label: string;
    badgeClassName: string;
}> = [
    {
        id: 'TODO',
        label: 'Нужно сделать',
        badgeClassName: 'border-slate-200 bg-slate-100 text-slate-700',
    },
    {
        id: 'MODELING',
        label: 'Моделирование',
        badgeClassName: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
        id: 'MILLING',
        label: 'Фрезеровка',
        badgeClassName: 'border-violet-200 bg-violet-50 text-violet-700',
    },
    {
        id: 'POST_PROCESSING',
        label: 'Обработка',
        badgeClassName: 'border-orange-200 bg-orange-50 text-orange-700',
    },
    {
        id: 'DONE',
        label: 'Готово',
        badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
];
const TASK_STAGE_IDS = new Set<TaskStatus>(TASK_STAGES.map((stage) => stage.id));

const PRIORITY_LABELS: Record<ProductionTask['priority'], string> = {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    HIGH: 'Высокий',
    URGENT: 'Срочный',
};

const PRIORITY_CLASSES: Record<ProductionTask['priority'], string> = {
    LOW: 'bg-slate-100 text-slate-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
};

const EMPLOYEE_STATUS = {
    ACTIVE: {
        label: 'На смене',
        className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    },
    BUSY: {
        label: 'Занят',
        className: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    },
    OFFLINE: {
        label: 'Не в сети',
        className: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
    },
    FIRED: {
        label: 'Неактивен',
        className: 'border-red-400/30 bg-red-400/10 text-red-200',
    },
} as const;

function getRoleLabel(role: string | null | undefined) {
    switch (role) {
        case 'ADMIN':
            return 'Администратор';
        case 'DISPATCHER':
            return 'Диспетчер';
        case 'OPERATOR':
            return 'Оператор';
        case 'TECHNICIAN':
            return 'Зубной техник';
        default:
            return role ?? 'Сотрудник';
    }
}

function formatJoinedAt(value?: string) {
    if (!value) return 'Дата не указана';

    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function ProfileMetric({
                           label,
                           value,
                           hint,
                           accentClassName,
                       }: {
    label: string;
    value: string | number;
    hint: string;
    accentClassName: string;
}) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-4 h-1.5 w-10 rounded-full ${accentClassName}`} />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                {label}
            </p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {value}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p>
        </article>
    );
}

function ProfileLink({
                         href,
                         title,
                         description,
                     }: {
    href: string;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 transition hover:border-blue-400/40 hover:bg-white/[0.12]"
        >
            <span>
                <span className="block text-sm font-bold text-white">{title}</span>
                <span className="mt-1 block text-xs text-slate-400">{description}</span>
            </span>
            <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg text-blue-200 transition group-hover:translate-x-0.5 group-hover:bg-blue-500 group-hover:text-white"
            >
                →
            </span>
        </Link>
    );
}

function ChangePasswordCard({userId}: { userId: string | null }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [changeUserPassword, {isLoading}] = useChangeUserPasswordMutation();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError('');
        setSuccessMessage('');

        if (!userId) {
            setFormError('Не удалось определить пользователя.');
            return;
        }

        if (newPassword.trim().length < 6) {
            setFormError('Новый пароль должен быть не короче 6 символов.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setFormError('Пароли не совпадают.');
            return;
        }

        try {
            await changeUserPassword({
                id: userId,
                newPassword,
            }).unwrap();
            setNewPassword('');
            setConfirmPassword('');
            setSuccessMessage('Пароль обновлен.');
        } catch (error) {
            console.error('Password change failed:', error);
            setFormError('Не удалось сменить пароль. Попробуйте еще раз.');
        }
    };

    return (
        <section
            aria-labelledby="employee-password-title"
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                        Безопасность
                    </p>
                    <h2 id="employee-password-title" className="mt-1 text-lg font-black text-slate-900">
                        Смена пароля
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Обновите пароль для входа в личный кабинет.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-start">
                <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-500">
                        Новый пароль
                    </span>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        autoComplete="new-password"
                        className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-500">
                        Повторите пароль
                    </span>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        autoComplete="new-password"
                        className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                </label>

                <button
                    type="submit"
                    disabled={isLoading || !userId}
                    className="mt-0 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 lg:mt-6"
                >
                    {isLoading ? 'Сохранение...' : 'Сменить пароль'}
                </button>

                {(formError || successMessage) && (
                    <p
                        className={`text-sm font-semibold lg:col-span-3 ${
                            formError ? 'text-red-600' : 'text-emerald-600'
                        }`}
                    >
                        {formError || successMessage}
                    </p>
                )}
            </form>
        </section>
    );
}

function getStage(status: TaskStatus) {
    return TASK_STAGES.find((stage) => stage.id === status) ?? TASK_STAGES[0];
}

function getNextStage(status: TaskStatus) {
    const currentIndex = TASK_STAGES.findIndex((stage) => stage.id === status);

    if (currentIndex < 0 || currentIndex === TASK_STAGES.length - 1) {
        return null;
    }

    return TASK_STAGES[currentIndex + 1];
}

function isTaskStatus(value: string | null | undefined): value is TaskStatus {
    return TASK_STAGE_IDS.has(value as TaskStatus);
}

function getTransitionTaskStatus(transition: WorkflowTransition) {
    const normalizedCode = transition.code?.toUpperCase();

    return isTaskStatus(normalizedCode) ? normalizedCode : null;
}

function getTransitionLabel(transition: WorkflowTransition) {
    return transition.name || transition.code || transition.id;
}

function getTaskWorkflowType(task: ProductionTask) {
    return task.workTypeCode || task.workType || task.workTypeId || '';
}

function getTaskCurrentStatusId(task: ProductionTask) {
    return task.currentStatusId || '';
}

function canUserMoveTask(task: ProductionTask, userId: string | null | undefined) {
    if (!userId) return false;

    return [
        task.technicianId,
        task.assignedUserId,
        task.attachedUserId,
    ].some((value) => value === userId);
}

function formatDeadline(value: string) {
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
}

function createId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function getInitials(value: string | null) {
    return (value ?? 'Сотрудник')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function getInitialHistory(task: ProductionTask): TaskHistoryItem[] {
    return [
        {
            id: `${task.id}-created`,
            eventType: 'CREATED',
            changedAt: '2026-06-22T08:00:00+05:00',
            changedBy: {
                userId: 'dispatcher',
                fullName: 'Мария Диспетчер',
                initials: 'МД',
            },
        },
    ];
}

function TaskCard({
                      task,
                      variant,
                      currentUserId,
                      onOpen,
                      onMoveNext,
                  }: {
    task: ProductionTask;
    variant: 'active' | 'upcoming' | 'completed';
    currentUserId: string | null;
    onOpen: (taskId: string) => void;
    onMoveNext: (taskId: string, transition: WorkflowTransition) => void;
}) {
    const currentStage = getStage(task.status);
    const nextStage = getNextStage(task.status);
    const currentStageLabel = task.currentStatusName || currentStage.label;

    return (
        <article
            role="button"
            tabIndex={0}
            aria-label={`Открыть детали задачи ${task.title}`}
            onClick={() => onOpen(task.id)}
            onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onOpen(task.id);
                }
            }}
            className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 sm:p-5 ${
                variant === 'upcoming'
                    ? 'border-violet-200 hover:border-violet-300'
                    : 'border-slate-200 hover:border-blue-200'
            }`}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                            {task.id}
                        </span>
                        <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${PRIORITY_CLASSES[task.priority]}`}
                        >
                            {PRIORITY_LABELS[task.priority]}
                        </span>
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-slate-900">
                        {task.title}
                    </h2>
                </div>

                <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${currentStage.badgeClassName}`}
                >
                    {currentStageLabel}
                </span>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                    <dt className="text-xs text-slate-400">Пациент</dt>
                    <dd className="mt-1 font-semibold text-slate-700">{task.patient}</dd>
                </div>
                <div>
                    <dt className="text-xs text-slate-400">Заказ</dt>
                    <dd className="mt-1">
                        <Link
                            href={`/orders/${task.orderId}`}
                            onClick={(event) => event.stopPropagation()}
                            className="font-semibold text-blue-600 hover:underline"
                        >
                            #{task.orderId}
                        </Link>
                    </dd>
                </div>
                <div>
                    <dt className="text-xs text-slate-400">Срок</dt>
                    <dd className="mt-1 font-semibold text-slate-700">
                        {formatDeadline(task.deadline)}
                    </dd>
                </div>
            </dl>

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                {variant === 'upcoming' ? (
                    <>
                        <p className="text-xs text-violet-700">
                            Будет передана после этапа <span className="font-semibold">«{currentStageLabel}»</span>
                        </p>
                        <span className="inline-flex items-center text-xs font-bold text-slate-500">
                            Открыть детали <span aria-hidden="true" className="ml-1">→</span>
                        </span>
                    </>
                ) : variant === 'active' && nextStage ? (
                    <EmployeeTaskTransitionAction
                        task={task}
                        currentUserId={currentUserId}
                        fallbackNextStageLabel={nextStage.label}
                        onMoved={onMoveNext}
                    />
                ) : (
                    <p className="text-sm font-semibold text-emerald-700">
                        Задача завершена
                    </p>
                )}
            </div>
        </article>
    );
}

function EmployeeTaskTransitionAction({
                                          task,
                                          currentUserId,
                                          fallbackNextStageLabel,
                                          onMoved,
                                      }: {
    task: ProductionTask;
    currentUserId: string | null;
    fallbackNextStageLabel: string;
    onMoved: (taskId: string, transition: WorkflowTransition) => void;
}) {
    const workType = getTaskWorkflowType(task);
    const currentStatusId = getTaskCurrentStatusId(task);
    const canMoveTask = canUserMoveTask(task, currentUserId);
    const canLoadTransitions = canMoveTask && Boolean(workType && currentStatusId);
    const [selectedTransitionId, setSelectedTransitionId] = useState('');
    const [statusError, setStatusError] = useState('');
    const [updateTaskStatus, {isLoading: isUpdatingStatus}] = useUpdateTaskStatusMutation();
    const {
        data: transitions = [],
        isError,
        isFetching,
        isLoading,
        refetch,
    } = useGetAvailableWorkflowTransitionsQuery(
        {workType, currentStatusId},
        {skip: !canLoadTransitions}
    );
    const sortedTransitions = useMemo(
        () => [...transitions].sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0)),
        [transitions]
    );
    const nextTransitionId = selectedTransitionId || sortedTransitions[0]?.id || '';
    const nextTransition = sortedTransitions.find((transition) => transition.id === nextTransitionId);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!nextTransitionId || !nextTransition) return;

        setStatusError('');

        try {
            await updateTaskStatus({
                taskId: task.id,
                body: {
                    nextStatusId: nextTransitionId,
                    comment: `Завершен этап: ${task.currentStatusName || getStage(task.status).label}`,
                },
            }).unwrap();
            setSelectedTransitionId('');
            onMoved(task.id, nextTransition);
        } catch (error) {
            console.error('Task status update failed:', error);
            setStatusError('Не удалось передать задачу на следующий этап');
        }
    };

    if (!canMoveTask) {
        return (
            <p className="text-xs font-semibold text-slate-400">
                Передача доступна назначенному исполнителю
            </p>
        );
    }

    if (!workType || !currentStatusId) {
        return (
            <p className="text-xs font-semibold text-slate-400">
                Нет данных workflow для передачи
            </p>
        );
    }

    if (isLoading) {
        return (
            <p className="text-xs font-semibold text-slate-400">
                Загрузка доступных переходов...
            </p>
        );
    }

    if (isError) {
        return (
            <div
                onClick={(event) => event.stopPropagation()}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
                <p className="text-xs font-semibold text-red-600">
                    Не удалось загрузить переходы
                </p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-xs font-black uppercase text-red-700 hover:underline"
                >
                    Повторить
                </button>
            </div>
        );
    }

    if (sortedTransitions.length === 0) {
        return (
            <p className="text-sm font-semibold text-emerald-700">
                Нет доступных переходов
            </p>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
            className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
            {sortedTransitions.length > 1 ? (
                <label className="min-w-0 flex-1">
                    <span className="sr-only">Следующий этап</span>
                    <select
                        value={nextTransitionId}
                        onChange={(event) => setSelectedTransitionId(event.target.value)}
                        className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        {sortedTransitions.map((transition) => (
                            <option key={transition.id} value={transition.id}>
                                {getTransitionLabel(transition)}
                            </option>
                        ))}
                    </select>
                </label>
            ) : (
                <p className="text-xs text-slate-500">
                    Следующий этап: <span className="font-semibold text-slate-700">{nextTransition ? getTransitionLabel(nextTransition) : fallbackNextStageLabel}</span>
                </p>
            )}

            <button
                type="submit"
                disabled={isUpdatingStatus || isFetching || !nextTransitionId}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
                {isUpdatingStatus ? 'Передача...' : 'Завершить этап'}
                <span aria-hidden="true" className="ml-2">→</span>
            </button>

            {statusError && (
                <p className="text-xs font-semibold text-red-600 sm:basis-full">
                    {statusError}
                </p>
            )}
        </form>
    );
}

export default function EmployeePage() {
    const { id, name, role } = useSelector((state: RootState) => state.auth);
    const currentEmployee = useMemo(
        () => mockEmployees.find((employee) => employee.id === id),
        [id]
    );
    const visibleTasks = useMemo(
        () => mockTasks
            .filter((task) => canUserMoveTask(task, id) || task.nextTechnicianId === id)
            .map((task) => ({
                ...task,
                history: task.history ?? getInitialHistory(task),
            })),
        [id]
    );
    const [tasks, setTasks] = useState<ProductionTask[]>(visibleTasks);
    const [notification, setNotification] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    const activeTasks = tasks.filter(
        (task) => canUserMoveTask(task, id) && task.status !== 'DONE'
    );
    const upcomingTasks = tasks.filter(
        (task) => task.nextTechnicianId === id && !canUserMoveTask(task, id) && task.status !== 'DONE'
    );
    const completedTasks = tasks.filter(
        (task) => canUserMoveTask(task, id) && task.status === 'DONE'
    );
    const displayName = currentEmployee?.name ?? name ?? 'Сотрудник';
    const employeeStatus = EMPLOYEE_STATUS[currentEmployee?.status ?? 'ACTIVE'];
    const completedCount = currentEmployee?.stats.completed ?? completedTasks.length;
    const inProgressCount = currentEmployee?.stats.inProgress ?? activeTasks.length;
    const onTimeRate = currentEmployee?.stats.onTimeRate ?? 0;
    const averageDays = currentEmployee?.stats.averageDays ?? 0;
    const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
    const selectedSidebarTask: Task | null = selectedTask
        ? {
            id: selectedTask.id,
            title: selectedTask.title,
            status: selectedTask.currentStatusName || getStage(selectedTask.status).label,
            patient: selectedTask.patient,
            orderId: selectedTask.orderId,
            deadline: formatDeadline(selectedTask.deadline),
            priority: PRIORITY_LABELS[selectedTask.priority],
            technicianId: selectedTask.technicianId,
            units: 1,
            unitPrice: 0,
            discount: 0,
            comments: selectedTask.comments,
            attachments: selectedTask.attachments,
            images: selectedTask.images,
            history: selectedTask.history,
        }
        : null;

    const createHistoryItem = (
        eventType: string,
        fieldName?: string,
        oldValue?: string,
        newValue?: string
    ): TaskHistoryItem => ({
        id: createId(),
        eventType,
        fieldName,
        oldValue,
        newValue,
        changedAt: new Date().toISOString(),
        changedBy: {
            userId: id ?? 'employee',
            fullName: name ?? 'Сотрудник',
            initials: getInitials(name),
        },
    });

    const updateSelectedTask = (
        updater: (task: ProductionTask) => ProductionTask
    ) => {
        if (!selectedTaskId) return;

        setTasks((currentTasks) =>
            currentTasks.map((task) =>
                task.id === selectedTaskId ? updater(task) : task
            )
        );
    };

    const handleMoveNext = (taskId: string, transition: WorkflowTransition) => {
        const nextStatus = getTransitionTaskStatus(transition);
        const nextStatusLabel = getTransitionLabel(transition);

        setTasks((currentTasks) =>
            currentTasks.map((item) =>
                item.id === taskId
                    ? {
                        ...item,
                        ...(nextStatus ? { status: nextStatus } : {}),
                        currentStatusId: transition.id,
                        currentStatusCode: transition.code,
                        currentStatusName: nextStatusLabel,
                        history: [
                            createHistoryItem(
                                'STATUS_CHANGED',
                                'status',
                                item.currentStatusName || getStage(item.status).label,
                                nextStatusLabel
                            ),
                            ...(item.history ?? []),
                        ],
                    }
                    : item
            )
        );
        setNotification(`Задача ${taskId} передана на этап «${nextStatusLabel}»`);
    };

    const handleAddComment = (text: string) => {
        const comment: TaskComment = {
            id: createId(),
            author: name ?? 'Сотрудник',
            text,
            createdAt: new Date().toLocaleString('ru-RU'),
        };

        updateSelectedTask((task) => ({
            ...task,
            comments: [comment, ...(task.comments ?? [])],
            history: [
                createHistoryItem('COMMENT_ADDED'),
                ...(task.history ?? []),
            ],
        }));
    };

    const handleAddAttachments = (files: TaskAttachment[]) => {
        updateSelectedTask((task) => ({
            ...task,
            attachments: [...(task.attachments ?? []), ...files],
            history: [
                createHistoryItem('ATTACHMENT_ADDED'),
                ...(task.history ?? []),
            ],
        }));
    };

    const handleAddImages = (images: TaskImage[]) => {
        updateSelectedTask((task) => ({
            ...task,
            images: [...(task.images ?? []), ...images],
            history: [
                createHistoryItem('ATTACHMENT_ADDED'),
                ...(task.history ?? []),
            ],
        }));
    };

    if (role === 'ADMIN' || role === 'DISPATCHER') {
        return (
            <ErrorModal title="Раздел сотрудника" isDismissible={false}>
                Эта страница доступна только сотрудникам, которым назначаются задачи.
            </ErrorModal>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <section
                aria-labelledby="employee-profile-title"
                className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl"
            >
                <div className="relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
                    <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

                    <div className="relative grid gap-7 lg:grid-cols-[1fr_21rem] lg:items-end">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-black shadow-lg shadow-blue-950/40">
                                {getInitials(displayName)}
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${employeeStatus.className}`}
                                    >
                                        <span className="h-2 w-2 rounded-full bg-current" />
                                        {employeeStatus.label}
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-300">
                                        ID {id ?? '—'}
                                    </span>
                                </div>

                                <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                                    Профиль сотрудника
                                </p>
                                <h1
                                    id="employee-profile-title"
                                    className="mt-1 truncate text-3xl font-black tracking-tight sm:text-4xl"
                                >
                                    {displayName}
                                </h1>
                                <p className="mt-2 text-sm text-slate-300">
                                    {currentEmployee?.specialization ?? getRoleLabel(role)} ·{' '}
                                    {getRoleLabel(currentEmployee?.role ?? role)}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <ProfileLink
                                href="/employee/calendar"
                                title="Мой календарь"
                                description="Смена, задачи и дедлайны"
                            />
                            <ProfileLink
                                href="/employee/analytics"
                                title="Моя аналитика"
                                description="Результаты и эффективность"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-px border-t border-white/10 bg-white/10 sm:grid-cols-3">
                    <div className="bg-slate-900 px-5 py-4 sm:px-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Телефон
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-200">
                            {currentEmployee?.phone ?? 'Не указан'}
                        </p>
                    </div>
                    <div className="bg-slate-900 px-5 py-4 sm:px-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            Email
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-200">
                            {currentEmployee?.email ?? 'Не указан'}
                        </p>
                    </div>
                    <div className="bg-slate-900 px-5 py-4 sm:px-6">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                            В команде
                        </p>
                        <p className="mt-1 text-sm font-semibold capitalize text-slate-200">
                            с {formatJoinedAt(currentEmployee?.joinedAt)}
                        </p>
                    </div>
                </div>
            </section>

            <ChangePasswordCard userId={id} />

            <section aria-label="Показатели сотрудника" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <ProfileMetric
                    label="Выполнено"
                    value={completedCount}
                    hint="Работ за всё время"
                    accentClassName="bg-emerald-500"
                />
                <ProfileMetric
                    label="В процессе"
                    value={inProgressCount}
                    hint={`${activeTasks.length} в текущей очереди`}
                    accentClassName="bg-blue-500"
                />
                <ProfileMetric
                    label="В срок"
                    value={`${onTimeRate}%`}
                    hint="Задач без просрочки"
                    accentClassName="bg-violet-500"
                />
                <ProfileMetric
                    label="Средний цикл"
                    value={`${averageDays} дн.`}
                    hint="На выполнение работы"
                    accentClassName="bg-amber-500"
                />
            </section>

            <section className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                        Рабочая смена
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">Мои задачи</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Текущие работы и задачи, которые скоро будут переданы вам.
                    </p>
                </div>
                <div className="flex gap-2 text-xs font-bold">
                    <span className="rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
                        В работе: {activeTasks.length}
                    </span>
                    <span className="rounded-full bg-violet-100 px-3 py-1.5 text-violet-700">
                        Скоро: {upcomingTasks.length}
                    </span>
                </div>
            </section>

            <p className="sr-only" role="status" aria-live="polite">
                {notification}
            </p>

            <section aria-labelledby="active-tasks-title">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 id="active-tasks-title" className="text-lg font-bold text-slate-900">
                            Назначенные задачи
                        </h2>
                        <p className="text-sm text-slate-500">
                            Выполните работу и передайте задачу дальше.
                        </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                        {activeTasks.length}
                    </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {activeTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            variant="active"
                            currentUserId={id}
                            onOpen={setSelectedTaskId}
                            onMoveNext={handleMoveNext}
                        />
                    ))}
                </div>

                {activeTasks.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">
                            ✓
                        </div>
                        <h3 className="mt-4 font-bold text-slate-900">Активных задач нет</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Все назначенные задачи уже переданы дальше.
                        </p>
                    </div>
                )}
            </section>

            <section aria-labelledby="upcoming-tasks-title">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 id="upcoming-tasks-title" className="text-lg font-bold text-slate-900">
                            Скоро будут переданы вам
                        </h2>
                        <p className="text-sm text-slate-500">
                            Можно заранее ознакомиться с деталями и подготовиться к работе.
                        </p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                        {upcomingTasks.length}
                    </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {upcomingTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            variant="upcoming"
                            currentUserId={id}
                            onOpen={setSelectedTaskId}
                            onMoveNext={handleMoveNext}
                        />
                    ))}
                </div>

                {upcomingTasks.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
                        Пока нет задач, ожидающих передачи вам.
                    </div>
                )}
            </section>

            {completedTasks.length > 0 && (
                <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-slate-700">
                        Завершённые задачи ({completedTasks.length})
                    </summary>
                    <div className="grid gap-4 border-t border-slate-100 p-4 lg:grid-cols-2">
                        {completedTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                variant="completed"
                                currentUserId={id}
                                onOpen={setSelectedTaskId}
                                onMoveNext={handleMoveNext}
                            />
                        ))}
                    </div>
                </details>
            )}

            <TaskDetailsSidebar
                task={selectedSidebarTask}
                onClose={() => setSelectedTaskId(null)}
                onAddComment={handleAddComment}
                onAddAttachments={handleAddAttachments}
                onAddImages={handleAddImages}
            />
        </div>
    );
}
