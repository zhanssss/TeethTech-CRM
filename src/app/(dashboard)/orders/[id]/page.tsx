'use client';

import {useMemo, useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {useSelector} from 'react-redux';
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
import {updateOrderTasks, useOrders} from '@/src/lib/ordersStore';
import TaskCard from "@/src/components/ui/TaskCard";
import DroppableColumn from "@/src/components/ui/DroppableColumn";
import {
    canTaskMoveToColumn,
    filterKanbanColumnsByTaskTypes,
    getOrderTaskColumns,
    mergeDuplicateKanbanColumns,
} from '@/src/utils/orderUtils'
import ErrorModal from '@/src/components/ui/ErrorModal';
import {
    useGetOrderQuery,
    useGetOrderKanbanQuery,
    useGetOrdersQuery,
} from '@/src/services/api/ordersApi';
import type {RootState} from '@/src/lib/store';

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

function getOrderTaskTypes(order: ServerOrderInfo | undefined, columns: OrderKanbanColumn[]) {
    const detailTasks = getOrderDetailTasks(order);
    const kanbanTasks = getColumnsTasks(columns);

    return collectUnique([
        ...detailTasks.map((task) => task.taskType),
        ...kanbanTasks.map((task) => task.taskType),
    ]);
}

function getDisplayKanbanColumns(
    columns: OrderKanbanColumn[],
    order: ServerOrderInfo | undefined
) {
    const taskTypes = getOrderTaskTypes(order, columns);

    return filterKanbanColumnsByTaskTypes(
        mergeDuplicateKanbanColumns(columns),
        taskTypes
    );
}

export default function OrderBoardPage() {
    const params = useParams<{ id: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const userId = useSelector((state: RootState) => state.auth.id);
    const effectiveUserId = userId === 'dev-admin'
        ? '00000000-0000-4000-8000-000000000001'
        : userId;
    const orders = useOrders();
    const order = orders.find((item) => item.id === id);
    const {data: serverOrders, isLoading: isServerOrdersLoading} = useGetOrdersQuery(ORDER_LOOKUP_PARAMS);
    const {data: serverOrderDetails, isLoading: isServerOrderLoading} = useGetOrderQuery(
        id,
        {skip: !isUuid(id)}
    );
    const canLoadServerKanban = isUuid(id) && Boolean(effectiveUserId);
    const {data: serverKanbanColumns, isLoading: isKanbanLoading} = useGetOrderKanbanQuery(
        {id, userId: effectiveUserId ?? ''},
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

    if (!order && (isServerOrdersLoading || isServerOrderLoading || isKanbanLoading)) {
        return <div className="text-sm text-slate-500">Загрузка заказа...</div>;
    }

    if (hasServerKanban && serverKanbanColumns) {
        return (
            <ServerKanbanBoard
                orderId={id}
                order={serverOrder}
                columns={getDisplayKanbanColumns(serverKanbanColumns, serverOrder)}
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
            <div className="h-full flex flex-col space-y-6">
                <header className="flex justify-between items-start">
                    <div>
                        <Link
                            href="/orders"
                            className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 mb-2 uppercase tracking-wider"
                        >
                            ← Реестр заказов
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900">Заказ #{order.id}</h1>
                    </div>
                    <div className="flex gap-2">
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
                        className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
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

                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between">
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

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
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
                    className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-5 overflow-x-auto pb-4 items-start pt-4 ">
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
                                    <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[150px]">
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
                           }: {
    orderId: string;
    order?: ServerOrderInfo;
    columns: OrderKanbanColumn[];
}) {
    const taskCount = columns.reduce((sum, column) => sum + column.taskCount, 0);
    const [selectedHistoryTask, setSelectedHistoryTask] = useState<OrderKanbanTask | null>(null);
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
    const isActive = isRecord(order) && typeof order.isActive === 'boolean' ? order.isActive : true;

    return (
        <div className="h-full flex flex-col space-y-6">
            <header className="flex justify-between items-start">
                <div>
                    <Link
                        href="/orders"
                        className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 mb-2 uppercase tracking-wider"
                    >
                        ← Реестр заказов
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900">
                        Заказ #{order?.orderNumber ?? orderId}
                    </h1>
                </div>
                <div className="flex gap-2">
                    <span
                        className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                        {isActive ? 'Активен' : 'Закрыт'}
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div
                    className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
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
                    className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between">
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

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
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
                className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-x-10 gap-y-5 overflow-x-auto pb-4 items-start pt-4">
                {columns.map((column) => (
                    <section
                        key={`${column.statusName}-${column.title}`}
                        className="min-h-[280px] rounded-xl border border-slate-200 border-t-4 border-t-blue-500 bg-slate-50/60 shadow-sm"
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

                        <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[150px]">
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
    const taskAssignee = task.dentalTechnicianFullName || task.technician?.fullName || '-';

    return (
        <>
            <div
                onClick={onClose}
                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
            />

            <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[36rem] flex-col border-l border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Журнал задачи
                        </p>
                        <h2 className="mt-1 truncate text-xl font-black text-slate-900">
                            {taskTitle}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700">
                                {taskStatus}
                            </span>
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                                Техник: {taskAssignee}
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

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
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
