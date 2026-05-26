'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
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
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { updateOrderTasks, useOrders } from '@/src/lib/ordersStore';
import type { OrderTask } from '@/src/types/order.types';
import type { KanbanColumn } from '@/src/types/task.types';
import TaskCard from "@/src/components/ui/TaskCard";
import DroppableColumn from "@/src/components/ui/DroppableColumn";

const COLUMNS: KanbanColumn[] = [
    { id: 'TODO', title: 'Нужно сделать', color: 'border-t-slate-500' },
    { id: 'MODELING', title: 'Моделирование', color: 'border-t-blue-500' },
    { id: 'MILLING', title: 'Фрезеровка', color: 'border-t-purple-500' },
    { id: 'POST_PROCESSING', title: 'Обработка', color: 'border-t-orange-500' },
    { id: 'DONE', title: 'Готово', color: 'border-t-green-500' },
];



export default function OrderBoardPage() {
    const params = useParams<{ id: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const orders = useOrders();
    const order = orders.find((item) => item.id === id);
    const tasks = order?.tasks ?? [];
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const activeTask = tasks.find((task) => task.id === activeId);
    const primaryTask = tasks[0];
    const technicians = Array.from(new Set(tasks.map((task) => task.technicianId).filter(Boolean)));
    const operators = Array.from(new Set(tasks.map((task) => task.operatorId).filter(Boolean)));

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

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
            const updated = [...tasks];
            updated[activeIndex] = {
                ...updated[activeIndex],
                status: tasks[overIndex].status,
            };
            updateOrderTasks(order.id, arrayMove(updated, activeIndex, overIndex));
            setActiveId(null);
            return;
        }

        const targetColumn = COLUMNS.find((column) => column.id === overId);
        if (targetColumn) {
            const updated = [...tasks];
            updated[activeIndex] = {
                ...updated[activeIndex],
                status: targetColumn.id,
            };
            updateOrderTasks(order.id, updated);
        }

        setActiveId(null);
    };

    if (!order) {
        return (
            <div className="space-y-4">
                <Link
                    href="/orders"
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
                >
                    ← Реестр заказов
                </Link>

                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900">Заказ не найден</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Проверь ID заказа или вернись в реестр.
                    </p>
                </div>
            </div>
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
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            {order.status}
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            Срок: {order.deadline || '-'}
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
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
                            {primaryTask?.impressionQty ? <span className="bg-white/10 text-[9px] px-2 py-1 rounded font-bold">СЛЕПОК</span> : null}
                            {primaryTask?.transferQty ? <span className="bg-white/10 text-[9px] px-2 py-1 rounded font-bold">ТРАНСФЕР</span> : null}
                            {primaryTask?.biteQty ? <span className="bg-white/10 text-[9px] px-2 py-1 rounded font-bold">ПРИКУС</span> : null}
                            {primaryTask?.analogQty ? <span className="bg-white/10 text-[9px] px-2 py-1 rounded font-bold">АНАЛОГ</span> : null}
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

                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start pt-4">
                    {COLUMNS.map((column) => {
                        const tasksInColumn = tasks.filter((task) => task.status === column.id);

                        return (
                            <DroppableColumn key={column.id} id={column.id} column={column}>
                                <div className="p-4 flex justify-between items-center border-b border-slate-200 bg-white/50 rounded-t-xl">
                                    <h2 className="font-bold text-xs text-slate-800 uppercase tracking-widest">
                                        {column.title}
                                    </h2>
                                    <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded">
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
                                            <TaskCard key={task.id} task={task} />
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
                        <TaskCard task={activeTask} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
