'use client';

import {useMemo, useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {useSelector} from 'react-redux';
import TaskDetailsSidebar from '@/src/components/layout/TaskDetailsSidebar';
import TaskAssignmentModal from '@/src/components/Modals/TaskAssignmentModal';
import {RootState} from '@/src/lib/store';
import type {Task} from '@/src/types/task.types';
import type {OrderApiListItem, OrderDetails, OrderKanbanColumn, OrderKanbanTask} from '@/src/types/order.types';
import type {User} from '@/src/types/user.types';
import ErrorModal from '@/src/components/ui/ErrorModal';
import {
    useAssignTaskMutation,
    useGetOrderQuery,
    useGetOrderKanbanQuery,
    useGetOrdersQuery,
    useGetTaskAssignmentQuery,
    useUpdateTaskStatusMutation,
} from '@/src/services/api/ordersApi';
import {useGetUsersQuery} from '@/src/services/api/usersApi';

const ORDER_LOOKUP_PARAMS = {
    page: 0,
    size: 100,
    sort: 'deadline,ASC',
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined) {
    return Boolean(value && UUID_PATTERN.test(value));
}

type ServerOrderInfo = OrderApiListItem | OrderDetails;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getNameValue(value: unknown) {
    if (typeof value === 'string') return value;

    if (!isRecord(value)) return '';

    const name = value.name ?? value.fullName;

    return typeof name === 'string' ? name : '';
}

function getStringValue(source: unknown, keys: string[]) {
    if (!isRecord(source)) return '';

    for (const key of keys) {
        const value = source[key];
        const nameValue = getNameValue(value);

        if (nameValue) return nameValue;
    }

    return '';
}

function getNumberValue(source: unknown, keys: string[]) {
    if (!isRecord(source)) return 0;

    for (const key of keys) {
        const value = source[key];

        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const numericValue = Number(value);

            if (Number.isFinite(numericValue)) {
                return numericValue;
            }
        }
    }

    return 0;
}

function collectUnique(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

function getOrderDetailTasks(order?: ServerOrderInfo) {
    if (!isRecord(order) || !Array.isArray(order.tasks)) return [];

    return order.tasks.filter(isRecord) as unknown as OrderKanbanTask[];
}

function getColumnsTasks(columns: OrderKanbanColumn[]) {
    return columns.flatMap((column) => column.tasks);
}

function getTaskColor(task: OrderKanbanTask) {
    return task.colorCode || getStringValue(task, ['colorName', 'color']);
}

function normalizeStageValue(value: string | undefined | null) {
    return (value ?? '').toLowerCase().replace(/[-_/]+/g, ' ').trim();
}

function isNewTaskStage(column: OrderKanbanColumn, task: OrderKanbanTask) {
    const value = normalizeStageValue([
        column.statusName,
        column.title,
        task.currentStatusCode,
        task.currentStatusFormName,
    ].filter(Boolean).join(' '));

    return value.includes('новая задач')
        || value.includes('new task')
        || value.split(' ').includes('todo');
}

function StartTaskButton({
    orderId,
    task,
    nextColumnStatusId,
    nextColumnStatusName,
    onConfigureAssignments,
}: {
    orderId: string;
    task: OrderKanbanTask;
    nextColumnStatusId?: string;
    nextColumnStatusName?: string;
    onConfigureAssignments: () => void;
}) {
    const {
        data: assignment,
        isFetching: isAssignmentFetching,
        isError: isAssignmentError,
        refetch,
    } = useGetTaskAssignmentQuery(task.id);
    const [assignTask, { isLoading: isAssigning }] = useAssignTaskMutation();
    const [updateTaskStatus, { isLoading: isUpdatingStatus }] = useUpdateTaskStatusMutation();
    const [startError, setStartError] = useState('');
    const nextColumnAssignee = assignment?.statusAssignees.find((assignee) => {
        const expectedName = normalizeStageValue(nextColumnStatusName);
        return Boolean(expectedName) && [assignee.statusName, assignee.statusCode]
            .map(normalizeStageValue)
            .includes(expectedName);
    });
    const fallbackAssignee = nextColumnAssignee ?? assignment?.statusAssignees[0];
    const nextStatusId = task.allowedNextStatusIds?.[0]
        || nextColumnStatusId
        || fallbackAssignee?.statusId
        || '';
    const nextAssignee = assignment?.statusAssignees.find(
        (assignee) => assignee.statusId === nextStatusId
    ) ?? (!task.allowedNextStatusIds?.length && !nextColumnStatusId ? fallbackAssignee : undefined);
    const isStarting = isAssigning || isUpdatingStatus;

    const handleStart = async () => {
        if (!nextStatusId || !nextAssignee?.userId) return;

        setStartError('');

        try {
            await assignTask({
                taskId: task.id,
                userId: nextAssignee.userId,
                orderId,
            }).unwrap();

            await updateTaskStatus({
                taskId: task.id,
                body: {
                    nextStatusId,
                    comment: 'Задача запущена',
                },
            }).unwrap();
        } catch (error) {
            console.error('Task start failed:', error);
            setStartError('Не удалось запустить задачу.');
        }
    };

    if (isAssignmentFetching) {
        return (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-center text-[10px] font-bold text-blue-600">
                Проверяем ответственного следующего этапа...
            </p>
        );
    }

    if (isAssignmentError) {
        return (
            <button
                type="button"
                onClick={() => void refetch()}
                className="w-full rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
            >
                Не удалось загрузить назначения · Повторить
            </button>
        );
    }

    if (!nextStatusId) {
        return (
            <p className="rounded-lg bg-slate-100 px-3 py-2 text-center text-[10px] font-bold text-slate-500">
                Следующий этап недоступен
            </p>
        );
    }

    if (!nextAssignee?.userId) {
        return (
            <button
                type="button"
                onClick={onConfigureAssignments}
                className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
            >
                Выбрать ответственного следующего этапа
            </button>
        );
    }

    return (
        <div className="space-y-1.5">
            <button
                type="button"
                disabled={isStarting}
                onClick={() => void handleStart()}
                className="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
                {isStarting ? 'Запускаем...' : 'Начать задачу'}
            </button>
            <p className="truncate text-center text-[10px] font-semibold text-slate-500">
                Следующий ответственный: {nextAssignee.userFullName || nextAssignee.userId}
            </p>
            {startError && (
                <p className="text-center text-[10px] font-semibold text-red-600">{startError}</p>
            )}
        </div>
    );
}

function mapOrderKanbanTaskToDetailsTask(task: OrderKanbanTask, order?: ServerOrderInfo): Task {
    const quantity = Number(task.quantity || 0);
    const total = Number(task.totalAmount ?? task.totalPrice ?? 0);

    return {
        id: task.id,
        orderId: task.orderId,
        title: task.workTypeName || task.taskNumber || task.workTypeCode || task.id,
        status: task.currentStatusFormName || task.currentStatusCode || '-',
        currentStatusId: task.currentStatusId,
        currentStatusCode: task.currentStatusCode,
        isCompleted: task.isCompleted,
        hasAccess: task.hasAccess,
        patient: getStringValue(order, ['patientFullName', 'patientName', 'patient']),
        deadline: getStringValue(order, ['deadline']),
        type: task.workTypeName || task.workTypeCode,
        material: task.materialName,
        color: task.colorCode,
        taskType: task.taskType,
        technicianId: task.dentalTechnicianFullName || task.technician?.fullName || '',
        operatorId: task.cadCamOperatorFullName || task.operator?.fullName || '',
        units: quantity,
        unitPrice: Number(task.pricePerUnit ?? (quantity ? total / quantity : 0)),
        discount: 0,
    };
}

export default function OrderBoardPage() {
    const params = useParams<{ id: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const {id: currentUserId, role, roles} = useSelector((state: RootState) => state.auth);
    const canAssignTasks = role === 'ADMIN'
        || role === 'DISPATCHER'
        || roles.some((userRole) => ['ROLE_ADMIN', 'ROLE_DISPATCHER'].includes(userRole));
    const {data: serverOrders, isLoading: isServerOrdersLoading} = useGetOrdersQuery(ORDER_LOOKUP_PARAMS);
    const {data: serverOrderDetails, isLoading: isServerOrderLoading} = useGetOrderQuery(
        id,
        {skip: !isUuid(id)}
    );
    const {data: users = [], isLoading: isUsersLoading} = useGetUsersQuery(undefined, {skip: !isUuid(id)});
    const kanbanUserId = useMemo(
        () => isUuid(currentUserId)
            ? currentUserId ?? undefined
            : users.find((user) => isUuid(user.id))?.id,
        [currentUserId, users]
    );
    const canLoadServerKanban = isUuid(id) && Boolean(kanbanUserId);
    const {data: serverKanbanColumns, isLoading: isKanbanLoading} = useGetOrderKanbanQuery(
        {id, userId: kanbanUserId ?? ''},
        {skip: !canLoadServerKanban}
    );
    const serverOrder = serverOrderDetails ?? serverOrders?.content.find((item) => item.id === id);
    const isPageLoading = isServerOrdersLoading || isServerOrderLoading || isUsersLoading || isKanbanLoading;

    if (isPageLoading) {
        return <div className="text-sm text-slate-500">Загрузка заказа...</div>;
    }

    if (serverOrder || serverKanbanColumns) {
        return (
            <ServerKanbanBoard
                orderId={id}
                order={serverOrder}
                columns={serverKanbanColumns ?? []}
                users={users}
                isUsersLoading={isUsersLoading}
                canAssignTasks={canAssignTasks}
            />
        );
    }

    return (
        <ErrorModal title="Заказ не найден" isDismissible={false}>
            <div className="space-y-4">
                <p>Проверь ID заказа или вернись в реестр.</p>
                <Link
                    href="/orders"
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
                >
                    ← Реестр заказов
                </Link>
            </div>
        </ErrorModal>
    );
}

function ServerKanbanBoard({
                               orderId,
                               order,
                               columns,
                               users,
                               isUsersLoading,
                               canAssignTasks,
                           }: {
    orderId: string;
    order?: ServerOrderInfo;
    columns: OrderKanbanColumn[];
    users: User[];
    isUsersLoading: boolean;
    canAssignTasks: boolean;
}) {
    const taskCount = columns.reduce((sum, column) => sum + column.taskCount, 0);
    const [selectedTask, setSelectedTask] = useState<OrderKanbanTask | null>(null);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [assignmentModalTaskId, setAssignmentModalTaskId] = useState('');
    const allTasks = [...getColumnsTasks(columns), ...getOrderDetailTasks(order)];
    const patientName = getStringValue(order, ['patientFullName', 'patientName', 'patient']);
    const clinicName = getStringValue(order, ['clinicName', 'clinic']);
    const doctorName = getStringValue(order, ['doctorFullName', 'doctorName', 'doctor']);
    const workTypeName = getStringValue(order, ['summaryWorkType', 'workTypeName', 'workType', 'work']);
    const quantity = getNumberValue(order, ['quantity']) || allTasks.reduce((sum, task) => sum + Number(task.quantity || 0), 0);
    const totalPrice = getNumberValue(order, ['totalPrice', 'totalAmount']) || allTasks.reduce((sum, task) => sum + Number(task.totalAmount ?? task.totalPrice ?? 0), 0);
    const colors = collectUnique(allTasks.map(getTaskColor));
    const isActive = isRecord(order) && typeof order.isActive === 'boolean' ? order.isActive : true;
    const refreshedSelectedTask = selectedTask
        ? allTasks.find((task) => task.id === selectedTask.id) ?? selectedTask
        : null;
    const selectedDetailsTask = refreshedSelectedTask
        ? mapOrderKanbanTaskToDetailsTask(refreshedSelectedTask, order)
        : null;
    const openAssignmentModal = (taskId = '') => {
        setAssignmentModalTaskId(taskId);
        setIsAssignmentModalOpen(true);
    };
    const closeAssignmentModal = () => {
        setIsAssignmentModalOpen(false);
        setAssignmentModalTaskId('');
    };

    return (
        <>
            <div className="flex min-h-[calc(100dvh-8rem)] flex-col space-y-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Link
                            href="/orders"
                            className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 mb-2 uppercase tracking-wider"
                        >
                            ← Реестр заказов
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                            Заказ #{order?.orderNumber ?? orderId}
                        </h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => openAssignmentModal()}
                            disabled={allTasks.length === 0}
                            className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                            Ответственные по этапам
                        </button>
                        <span
                            className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            {isActive ? 'Активен' : 'Закрыт'}
                        </span>
                    </div>
                </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div
                    className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5 md:col-span-2">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Пациент</p>
                        <p className="font-bold text-slate-800 text-lg">{patientName || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Клиника</p>
                        <p className="text-blue-600 text-sm font-semibold">{clinicName || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Врач</p>
                        <p className="text-slate-700 text-sm font-medium">{doctorName || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Вид работы</p>
                        <p className="text-slate-700 text-sm font-medium">{workTypeName || '-'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Кол-во</p>
                        <p className="text-slate-700 text-sm font-medium">{quantity} ед.</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Итого</p>
                        <p className="font-black text-slate-900 text-lg">
                            {totalPrice.toLocaleString('ru-RU')} ₸
                        </p>
                    </div>
                </div>

                <div
                    className="flex flex-col justify-between rounded-2xl bg-slate-900 p-4 text-white shadow-lg sm:p-5">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Цвет</p>
                        <p className="mt-2 text-xl font-black text-orange-400">
                            {colors.length ? colors.join(', ') : '-'}
                        </p>
                    </div>
                    <p className="mt-4 border-t border-slate-800 pt-4 text-sm font-semibold text-slate-100">
                        {taskCount} задач на доске
                    </p>
                </div>
            </div>

            <div
                className="grid grid-cols-1 items-start gap-x-10 gap-y-10 pb-8 pt-4 lg:grid-cols-3">
                {columns.map((column, columnIndex) => (
                    <section
                        key={`${column.statusName}-${column.title}`}
                        className="h-fit min-h-[280px] rounded-xl border border-slate-200 border-t-4 border-t-blue-500 bg-slate-50/60 shadow-sm"
                    >
                        <div className="rounded-t-xl border-b border-slate-200 bg-white/50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="font-bold text-xs text-slate-800 uppercase tracking-widest">
                                    {column.title || column.statusName}
                                </h2>
                                <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded">
                                    {column.taskCount}
                                </span>
                            </div>
                        </div>

                        <div className="min-h-[150px] space-y-3 p-3">
                            {column.tasks.map((task) => (
                                <div key={task.id} className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTask(task)}
                                        className="w-full bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3 text-left transition hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                            {task.taskNumber ?? task.workTypeCode ?? task.id.slice(0, 8)}
                                        </span>
                                        <span className="text-slate-400 italic">{task.quantity} ед.</span>
                                    </div>

                                    <div>
                                        <h3 className="text-slate-900 font-semibold text-sm">
                                            {task.workTypeName}
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {task.materialName || 'Материал не указан'}
                                            {task.colorCode ? ` · цвет ${task.colorCode}` : ''}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                                        <div>
                                            <p className="font-bold uppercase text-slate-400">Техник</p>
                                            <p className="font-semibold text-slate-700">
                                                {task.dentalTechnicianFullName || task.technician?.fullName || '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-bold uppercase text-slate-400">Статус</p>
                                            <p className="font-semibold text-slate-700">
                                                {task.currentStatusFormName || task.currentStatusCode || task.operator?.fullName || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                        <span className="text-[10px] text-slate-400">
                                            {task.toothNumbers?.length ? `Зубы: ${task.toothNumbers.join(', ')}` : 'Зубы не указаны'}
                                        </span>
                                        <span className="text-xs font-black text-slate-800">
                                            {(task.totalAmount ?? task.totalPrice ?? 0).toLocaleString('ru-RU')} ₸
                                        </span>
                                    </div>
                                    </button>

                                    {canAssignTasks && isNewTaskStage(column, task) && (
                                        <StartTaskButton
                                            orderId={orderId}
                                            task={task}
                                            nextColumnStatusId={columns[columnIndex + 1]?.statusId}
                                            nextColumnStatusName={
                                                columns[columnIndex + 1]?.statusName
                                                || columns[columnIndex + 1]?.title
                                            }
                                            onConfigureAssignments={() => openAssignmentModal(task.id)}
                                        />
                                    )}
                                </div>
                            ))}

                            {column.tasks.length === 0 && (
                                <div className="py-8 text-center text-xs italic text-slate-400">
                                    Пусто
                                </div>
                            )}
                        </div>
                    </section>
                ))}
            </div>
        </div>

        <TaskAssignmentModal
            key={assignmentModalTaskId || 'order-assignment'}
            isOpen={isAssignmentModalOpen}
            initialTaskId={assignmentModalTaskId}
            tasks={allTasks}
            users={users}
            isUsersLoading={isUsersLoading}
            canEdit={canAssignTasks}
            onClose={closeAssignmentModal}
        />

        <TaskDetailsSidebar
            task={selectedDetailsTask}
            onClose={() => setSelectedTask(null)}
        />
        </>
    );
}
