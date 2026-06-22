'use client';

import {type FormEvent, useMemo, useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {
    DndContext,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskDetailsSidebar from '@/src/components/layout/TaskDetailsSidebar';
import TaskFilesPanel from '@/src/components/tasks/TaskFilesPanel';
import TaskHistoryTimeline from '@/src/components/tasks/TaskHistoryTimeline';
import type {TaskAttachment, TaskComment, TaskImage} from '@/src/types/task.types';
import type {OrderApiListItem, OrderDetails, OrderKanbanColumn, OrderKanbanTask} from '@/src/types/order.types';
import type {User} from '@/src/types/user.types';
import {updateOrderTasks, useOrders} from '@/src/lib/ordersStore';
import TaskCard from "@/src/components/ui/TaskCard";
import DroppableColumn from "@/src/components/ui/DroppableColumn";
import {
    canTaskMoveToColumn,
    getOrderTaskColumns,
} from '@/src/utils/orderUtils'
import ErrorModal from '@/src/components/ui/ErrorModal';
import {
    useGetOrderQuery,
    useGetOrderKanbanQuery,
    useGetOrdersQuery,
    useUpdateOrderMutation,
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

function getTaskTechnicianName(task: OrderKanbanTask) {
    return task.dentalTechnicianFullName || task.technician?.fullName || '';
}

function getTaskOperatorName(task: OrderKanbanTask) {
    return task.cadCamOperatorFullName || task.operator?.fullName || '';
}

function getTaskColor(task: OrderKanbanTask) {
    return task.colorCode || getStringValue(task, ['colorName', 'color']);
}

function normalizeRoleValue(value: string | undefined | null) {
    return (value ?? '').toLowerCase().replace(/[-_/]+/g, ' ');
}

function getUserRoleValues(user: User) {
    return [
        user.role,
        ...(user.roles ?? []),
        user.specialization,
    ].filter((value): value is string => Boolean(value));
}

function filterUsersByRole(users: User[], tokens: string[]) {
    const normalizedTokens = tokens.map(normalizeRoleValue);

    return users.filter((user) => {
        const normalizedUserRoles = getUserRoleValues(user)
            .map(normalizeRoleValue)
            .join(' ');

        return normalizedTokens.some((token) =>
            normalizedUserRoles.includes(token)
        );
    });
}

function getUserLabel(user: User) {
    const meta = getUserRoleValues(user).join(' / ');
    return meta ? `${user.fullName} (${meta})` : user.fullName;
}

function getAssigneeId(value: unknown) {
    if (!isRecord(value)) return '';

    return typeof value.id === 'string' ? value.id : '';
}

function getAssigneeIdValue(source: unknown, keys: string[]) {
    if (!isRecord(source)) return '';

    for (const key of keys) {
        const id = getAssigneeId(source[key]);

        if (id) return id;
    }

    return '';
}

function getTaskTechnicianId(task: OrderKanbanTask) {
    return task.technician?.id || getStringValue(task, ['dentalTechnicianId', 'technicianId']);
}

function getTaskOperatorId(task: OrderKanbanTask) {
    return task.operator?.id || getStringValue(task, ['cadCamOperatorId', 'operatorId']);
}

export default function OrderBoardPage() {
    const params = useParams<{ id: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const orders = useOrders();
    const order = orders.find((item) => item.id === id);
    const {data: serverOrders, isLoading: isServerOrdersLoading} = useGetOrdersQuery(ORDER_LOOKUP_PARAMS);
    const {data: serverOrderDetails, isLoading: isServerOrderLoading} = useGetOrderQuery(
        id,
        {skip: !isUuid(id)}
    );
    const {data: users = [], isLoading: isUsersLoading} = useGetUsersQuery(undefined, {skip: !isUuid(id)});
    const temporaryKanbanUserId = useMemo(
        () => users.find((user) => isUuid(user.id))?.id,
        [users]
    );
    const canLoadServerKanban = isUuid(id) && Boolean(temporaryKanbanUserId);
    const {data: serverKanbanColumns, isLoading: isKanbanLoading} = useGetOrderKanbanQuery(
        {id, userId: temporaryKanbanUserId ?? ''},
        {skip: !canLoadServerKanban}
    );
    const serverOrder = serverOrderDetails ?? serverOrders?.content.find((item) => item.id === id);
    const hasServerKanban = Boolean(serverKanbanColumns?.length);
    const tasks = useMemo(() => order?.tasks ?? [], [order?.tasks]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
    const COLUMNS = useMemo(() => getOrderTaskColumns(tasks), [tasks]);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 8}})
    );

    const activeTask = tasks.find((task) => task.id === activeId);
    const primaryTask = tasks[0];
    const technicians = Array.from(new Set(tasks.map((task) => task.technicianId).filter(Boolean)));
    const operators = Array.from(new Set(tasks.map((task) => task.operatorId).filter(Boolean)));

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;

        if (!order || !over) {
            setActiveId(null);
            return;
        }

        const activeTaskId = String(active.id);
        const overId = String(over.id);
        const activeIndex = tasks.findIndex((task) => task.id === activeTaskId);
        const overIndex = tasks.findIndex((task) => task.id === overId);

        if (activeIndex === -1) {
            setActiveId(null);
            return;
        }

        if (overIndex !== -1) {
            const targetStatus = tasks[overIndex].status;

            if (!canTaskMoveToColumn(tasks[activeIndex], targetStatus)) {
                setActiveId(null);
                return;
            }

            const updated = [...tasks];
            updated[activeIndex] = {
                ...updated[activeIndex],
                status: targetStatus,
            };
            updateOrderTasks(order.id, arrayMove(updated, activeIndex, overIndex));
            setActiveId(null);
            return;
        }

        const targetColumn = COLUMNS.find((column) => column.id === overId);
        if (targetColumn && canTaskMoveToColumn(tasks[activeIndex], targetColumn.id)) {
            const updated = [...tasks];
            updated[activeIndex] = {
                ...updated[activeIndex],
                status: targetColumn.id,
            };
            updateOrderTasks(order.id, updated);
        }

        setActiveId(null);
    };

    const updateSelectedTask = (
        updater: (task: typeof selectedTask) => typeof selectedTask
    ) => {
        if (!order || !selectedTask) return;

        const updatedTasks = tasks.map((task) => {
            if (task.id !== selectedTask.id) return task;

            const updatedTask = updater(task);

            return updatedTask ?? task;
        });

        updateOrderTasks(order.id, updatedTasks);
    };

    const handleAddComment = (text: string) => {
        const newComment: TaskComment = {
            id: crypto.randomUUID(),
            author: 'Вы',
            text,
            createdAt: new Date().toLocaleString('ru-RU'),
        };

        updateSelectedTask((task) => {
            if (!task) return task;

            return {
                ...task,
                comments: [newComment, ...(task.comments ?? [])],
            };
        });
    };

    const handleAddAttachments = (files: TaskAttachment[]) => {
        updateSelectedTask((task) => {
            if (!task) return task;

            return {
                ...task,
                attachments: [...(task.attachments ?? []), ...files],
            };
        });
    };

    const handleAddImages = (images: TaskImage[]) => {
        updateSelectedTask((task) => {
            if (!task) return task;

            return {
                ...task,
                images: [...(task.images ?? []), ...images],
            };
        });
    };

    if (!order && (isServerOrdersLoading || isServerOrderLoading || isUsersLoading || isKanbanLoading)) {
        return <div className="text-sm text-slate-500">Загрузка заказа...</div>;
    }

    if (hasServerKanban && serverKanbanColumns) {
        return (
            <ServerKanbanBoard
                orderId={id}
                order={serverOrder}
                columns={serverKanbanColumns}
                users={users}
                isUsersLoading={isUsersLoading}
            />
        );
    }

    if (!order) {
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

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className="flex min-h-[calc(100dvh-8rem)] flex-col space-y-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Link
                            href="/orders"
                            className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 mb-2 uppercase tracking-wider"
                        >
                            ← Реестр заказов
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Заказ #{order.id}</h1>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span
                            className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            {order.status}
                        </span>
                        <span
                            className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            Срок: {order.deadline || '-'}
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div
                        className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5 md:col-span-2">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Пациент</p>
                            <p className="font-bold text-slate-800 text-lg">{order.patient}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Клиника</p>
                            <p className="font-semibold text-blue-600 text-sm">
                                {order.clinic ?? order.clinicName ?? '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Врач</p>
                            <p className="text-slate-700 text-sm font-medium">{order.doctor}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Вид работы</p>
                            <p className="text-slate-700 text-sm font-medium">
                                {order.work ?? order.workType ?? '-'} · {order.units ?? 0} ед.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl bg-slate-900 p-4 text-white shadow-lg sm:p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Цвет</p>
                                <p className="text-xl font-black text-orange-400">
                                    {primaryTask?.color || order.color || '-'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Абатмент</p>
                                <p className="text-sm font-bold italic">
                                    {primaryTask?.abutment || order.abutment || '-'}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                            {primaryTask?.impressionQty ? <span
                                className="bg-white/10 text-[9px] px-2 py-1 rounded font-bold">СЛЕПОК</span> : null}
                            {primaryTask?.transferQty ? <span
                                className="bg-white/10 text-[9px] px-2 py-1 rounded font-bold">ТРАНСФЕР</span> : null}
                            {primaryTask?.biteQty ? <span
                                className="bg-white/10 text-[9px] px-2 py-1 rounded font-bold">ПРИКУС</span> : null}
                            {primaryTask?.analogQty ? <span
                                className="bg-white/10 text-[9px] px-2 py-1 rounded font-bold">АНАЛОГ</span> : null}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 text-center border-b pb-1">
                            Команда наряда
                        </p>
                        <div className="space-y-3">
                            <div>
                                <p className="text-slate-400 uppercase font-bold text-[8px]">Техники</p>
                                <p className="font-bold text-slate-700 text-xs">
                                    {technicians.length ? technicians.join(', ') : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 uppercase font-bold text-[8px]">Операторы</p>
                                <p className="font-bold text-slate-700 text-xs">
                                    {operators.length ? operators.join(', ') : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="grid grid-cols-1 items-start gap-x-10 gap-y-10 pb-8 pt-4 lg:grid-cols-3">
                    {COLUMNS.map((column) => {
                        const tasksInColumn = tasks.filter((task) => task.status === column.id);

                        return (
                            <DroppableColumn key={column.id} id={column.id} column={column}>
                                <div
                                    className={`p-4 flex  justify-between items-center border-b border-slate-200 bg-white/50 rounded-t-xl`}>
                                    <h2 className="font-bold text-xs text-slate-800 uppercase tracking-widest">
                                        {column.title}
                                    </h2>
                                    <span
                                        className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded">
                                        {tasksInColumn.length}
                                    </span>
                                </div>
                                <SortableContext
                                    id={column.id}
                                    items={tasksInColumn.map((task) => task.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="min-h-[150px] space-y-3 p-3">
                                        {tasksInColumn.map((task) => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                isSelected={selectedTaskId === task.id}
                                                onClick={() => setSelectedTaskId(task.id)}
                                            />
                                        ))}
                                        {tasksInColumn.length === 0 && (
                                            <div className="py-8 text-center text-xs italic text-slate-400">
                                                Пусто
                                            </div>
                                        )}
                                    </div>
                                </SortableContext>
                            </DroppableColumn>
                        );
                    })}
                </div>
            </div>

            <DragOverlay>
                {activeTask ? (
                    <div className="rotate-2 opacity-80 cursor-grabbing">
                        <TaskCard task={activeTask}/>
                    </div>
                ) : null}
            </DragOverlay>
            <TaskDetailsSidebar
                task={selectedTask}
                onClose={() => setSelectedTaskId(null)}
                onAddComment={handleAddComment}
                onAddAttachments={handleAddAttachments}
                onAddImages={handleAddImages}
            />
        </DndContext>
    );
}

function ServerKanbanBoard({
                               orderId,
                               order,
                               columns,
                               users,
                               isUsersLoading,
                           }: {
    orderId: string;
    order?: ServerOrderInfo;
    columns: OrderKanbanColumn[];
    users: User[];
    isUsersLoading: boolean;
}) {
    const taskCount = columns.reduce((sum, column) => sum + column.taskCount, 0);
    const [selectedHistoryTask, setSelectedHistoryTask] = useState<OrderKanbanTask | null>(null);
    const [assignmentForm, setAssignmentForm] = useState({
        dentalTechnicianId: '',
        cadCamOperatorId: '',
    });
    const [assignmentError, setAssignmentError] = useState('');
    const [updateOrder, {isLoading: isUpdatingAssignments}] = useUpdateOrderMutation();
    const allTasks = [...getColumnsTasks(columns), ...getOrderDetailTasks(order)];
    const patientName = getStringValue(order, ['patientFullName', 'patientName', 'patient']);
    const clinicName = getStringValue(order, ['clinicName', 'clinic']);
    const doctorName = getStringValue(order, ['doctorFullName', 'doctorName', 'doctor']);
    const workTypeName = getStringValue(order, ['summaryWorkType', 'workTypeName', 'workType', 'work']);
    const quantity = getNumberValue(order, ['quantity']) || allTasks.reduce((sum, task) => sum + Number(task.quantity || 0), 0);
    const totalPrice = getNumberValue(order, ['totalPrice', 'totalAmount']) || allTasks.reduce((sum, task) => sum + Number(task.totalAmount ?? task.totalPrice ?? 0), 0);
    const colors = collectUnique(allTasks.map(getTaskColor));
    const technicians = collectUnique([
        getStringValue(order, ['dentalTechnicianFullName', 'dentalTechnician', 'technician']),
        ...allTasks.map(getTaskTechnicianName),
    ]);
    const operators = collectUnique([
        getStringValue(order, ['cadCamOperatorFullName', 'operatorFullName', 'cadCamOperator', 'operator']),
        ...allTasks.map(getTaskOperatorName),
    ]);
    const currentTechnicianId = getAssigneeIdValue(order, ['dentalTechnician', 'technician'])
        || allTasks.map(getTaskTechnicianId).find(Boolean)
        || '';
    const currentOperatorId = getAssigneeIdValue(order, ['cadCamOperator', 'operator'])
        || allTasks.map(getTaskOperatorId).find(Boolean)
        || '';
    const selectedTechnicianId = assignmentForm.dentalTechnicianId || currentTechnicianId;
    const selectedOperatorId = assignmentForm.cadCamOperatorId || currentOperatorId;
    const filteredTechnicianOptions = filterUsersByRole(users, ['керамист', 'зуб техник', 'technician', 'ceramist', 'dental technician', 'ROLE_CERAMIST']);
    const selectedTechnician = users.find((user) => user.id === selectedTechnicianId);
    const technicianOptions = selectedTechnician && !filteredTechnicianOptions.some((user) => user.id === selectedTechnician.id)
        ? [selectedTechnician, ...filteredTechnicianOptions]
        : filteredTechnicianOptions;
    const filteredOperatorOptions = filterUsersByRole(users, ['cad', 'cam', 'оператор', 'operator', 'моделировщик', 'modeler', 'ROLE_OPERATOR']);
    const selectedOperator = users.find((user) => user.id === selectedOperatorId);
    const operatorOptions = selectedOperator && !filteredOperatorOptions.some((user) => user.id === selectedOperator.id)
        ? [selectedOperator, ...filteredOperatorOptions]
        : filteredOperatorOptions;
    const hasAssignmentChanges =
        selectedTechnicianId !== currentTechnicianId ||
        selectedOperatorId !== currentOperatorId;
    const isActive = isRecord(order) && typeof order.isActive === 'boolean' ? order.isActive : true;

    const handleAssignmentSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setAssignmentError('');

        try {
            await updateOrder({
                id: orderId,
                body: {
                    dentalTechnicianId: selectedTechnicianId,
                    cadCamOperatorId: selectedOperatorId,
                },
            }).unwrap();
        } catch (error) {
            console.error('Order assignment update failed:', error);
            setAssignmentError('Не удалось обновить команду заказа');
        }
    };

    return (
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
                <div className="flex flex-wrap gap-2">
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

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 text-center border-b pb-1">
                        Команда наряда
                    </p>
                    <form onSubmit={handleAssignmentSubmit} className="space-y-3">
                        <div>
                            <p className="text-slate-400 uppercase font-bold text-[8px]">Текущий керамист</p>
                            <p className="font-bold text-slate-700 text-xs">
                                {technicians.length ? technicians.join(', ') : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-400 uppercase font-bold text-[8px]">Текущий оператор</p>
                            <p className="font-bold text-slate-700 text-xs">
                                {operators.length ? operators.join(', ') : '-'}
                            </p>
                        </div>

                        <div className="space-y-2 border-t border-slate-100 pt-3">
                            <label className="block">
                                <span className="mb-1 block text-[8px] font-bold uppercase text-slate-400">
                                    Керамист
                                </span>
                                <select
                                    required
                                    value={selectedTechnicianId}
                                    onChange={(event) =>
                                        setAssignmentForm((prev) => ({
                                            ...prev,
                                            dentalTechnicianId: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500"
                                >
                                    <option value="">
                                        {isUsersLoading ? 'Загрузка...' : 'Выбрать'}
                                    </option>
                                    {technicianOptions.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {getUserLabel(user)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-[8px] font-bold uppercase text-slate-400">
                                    CAD/CAM оператор
                                </span>
                                <select
                                    required
                                    value={selectedOperatorId}
                                    onChange={(event) =>
                                        setAssignmentForm((prev) => ({
                                            ...prev,
                                            cadCamOperatorId: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500"
                                >
                                    <option value="">
                                        {isUsersLoading ? 'Загрузка...' : 'Выбрать'}
                                    </option>
                                    {operatorOptions.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {getUserLabel(user)}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {assignmentError && (
                                <p className="rounded-lg bg-red-50 px-2 py-1.5 text-[10px] font-semibold text-red-600">
                                    {assignmentError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={
                                    isUpdatingAssignments ||
                                    isUsersLoading ||
                                    !hasAssignmentChanges ||
                                    !selectedTechnicianId ||
                                    !selectedOperatorId
                                }
                                className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                                {isUpdatingAssignments ? 'Сохранение...' : 'Сохранить команду'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div
                className="grid grid-cols-1 items-start gap-x-10 gap-y-10 pb-8 pt-4 lg:grid-cols-3">
                {columns.map((column) => (
                    <section
                        key={`${column.statusName}-${column.title}`}
                        className="h-fit min-h-[280px] rounded-xl border border-slate-200 border-t-4 border-t-blue-500 bg-slate-50/60 shadow-sm"
                    >
                        <div
                            className="p-4 flex justify-between items-center border-b border-slate-200 bg-white/50 rounded-t-xl">
                            <h2 className="font-bold text-xs text-slate-800 uppercase tracking-widest">
                                {column.title || column.statusName}
                            </h2>
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded">
                                {column.taskCount}
                            </span>
                        </div>

                        <div className="min-h-[150px] space-y-3 p-3">
                            {column.tasks.map((task) => (
                                <button
                                    type="button"
                                    key={task.id}
                                    onClick={() => setSelectedHistoryTask(task)}
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
            <TaskHistorySidebar
                task={selectedHistoryTask}
                onClose={() => setSelectedHistoryTask(null)}
            />
        </div>
    );
}

function TaskHistorySidebar({
                                task,
                                onClose,
                            }: {
    task: OrderKanbanTask | null;
    onClose: () => void;
}) {
    if (!task) return null;

    const taskTitle = task.workTypeName || task.taskNumber || task.id;
    const taskStatus = task.currentStatusFormName || task.currentStatusCode || '-';

    return (
        <>
            <div
                onClick={onClose}
                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
            />

            <aside className="fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] w-full flex-col rounded-t-2xl border-l border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-0 sm:top-0 sm:h-dvh sm:max-w-[36rem] sm:rounded-none">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-5">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Журнал задачи
                        </p>
                        <h2 className="mt-1 truncate text-lg font-black text-slate-900 sm:text-xl">
                            {taskTitle}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">
                                {taskStatus}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100"
                    >
                        Закрыть
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
                    <TaskFilesPanel
                        taskId={task.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                    />

                    <TaskHistoryTimeline
                        taskId={task.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                    />
                </div>
            </aside>
        </>
    );
}
