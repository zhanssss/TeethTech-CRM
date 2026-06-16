'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/lib/store';
import { mockTasks } from '@/src/mock/tasks';
import {
    DndContext,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanColumn, ProductionTask } from '@/src/types/task.types';

const COLUMNS: KanbanColumn[] = [
    { id: 'TODO', title: 'Нужно сделать', color: 'border-t-slate-500' },
    { id: 'MODELING', title: 'Моделирование', color: 'border-t-blue-500' },
    { id: 'MILLING', title: 'Фрезеровка', color: 'border-t-purple-500' },
    { id: 'POST_PROCESSING', title: 'Обработка', color: 'border-t-orange-500' },
    { id: 'DONE', title: 'Готово', color: 'border-t-green-500' },
];

function getPriorityBadge(priority: string) {
    switch (priority) {
        case 'LOW':
            return 'bg-slate-100 text-slate-600';
        case 'MEDIUM':
            return 'bg-blue-100 text-blue-700';
        case 'HIGH':
            return 'bg-orange-100 text-orange-700';
        case 'URGENT':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-slate-100 text-slate-600';
    }
}

type DroppableColumnProps = {
    id: KanbanColumn['id'];
    column: KanbanColumn;
    children: React.ReactNode;
};

function DroppableColumn({ id, column, children }: DroppableColumnProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`w-[18rem] shrink-0 rounded-xl border border-slate-200 border-t-4 bg-slate-100 shadow-inner sm:w-80 ${column.color}`}
        >
            {children}
        </div>
    );
}

function TaskCard({ task }: { task: ProductionTask }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({
            id: task.id,
            data: { type: 'Task', task },
        });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-400 cursor-grab active:cursor-grabbing"
        >
            <div className="flex items-center justify-between">
                <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
                    {task.id}
                </span>

                <span
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${getPriorityBadge(
                        task.priority
                    )}`}
                >
                    {task.priority}
                </span>
            </div>

            <div className="mt-3">
                <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                <p className="mt-1 text-xs text-slate-500">Пациент: {task.patient}</p>
                <p className="mt-1 text-xs text-slate-500">Заказ: #{task.orderId}</p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">Срок: {task.deadline}</span>

                <Link
                    href={`/orders/${task.orderId}`}
                    className="text-xs font-bold text-blue-600 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    Открыть
                </Link>
            </div>
        </div>
    );
}

export default function EmployeeBoardPage() {
    const { id, name } = useSelector((state: RootState) => state.auth);

    const initialTasks = useMemo(() => {
        return mockTasks.filter((task) => task.technicianId === id);
    }, [id]);

    const [tasks, setTasks] = useState(initialTasks);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const activeTask = tasks.find((task) => task.id === activeId);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = String(active.id);
        const overId = String(over.id);

        if (activeId === overId) {
            setActiveId(null);
            return;
        }

        setTasks((prev) => {
            const activeIndex = prev.findIndex((task) => task.id === activeId);
            const overIndex = prev.findIndex((task) => task.id === overId);

            if (overIndex !== -1) {
                const newStatus = prev[overIndex].status;
                const updated = [...prev];
                updated[activeIndex] = { ...updated[activeIndex], status: newStatus };
                return arrayMove(updated, activeIndex, overIndex);
            }

            const targetColumn = COLUMNS.find((column) => column.id === overId);
            if (targetColumn) {
                const updated = [...prev];
                updated[activeIndex] = { ...updated[activeIndex], status: targetColumn.id };
                return updated;
            }

            return prev;
        });

        setActiveId(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex min-h-[calc(100dvh-8rem)] flex-col space-y-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Моя доска</h1>
                        <p className="text-sm text-slate-500">
                            Задачи сотрудника {name} по этапам производства
                        </p>
                    </div>
                </header>

                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex min-h-full items-start gap-4">
                        {COLUMNS.map((column) => {
                            const tasksInColumn = tasks.filter(
                                (task) => task.status === column.id
                            );

                            return (
                                <DroppableColumn key={column.id} id={column.id} column={column}>
                                    <div className="flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-white/60 p-4">
                                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                                            {column.title}
                                        </h2>
                                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-black text-slate-700">
                                            {tasksInColumn.length}
                                        </span>
                                    </div>

                                    <SortableContext
                                        id={column.id}
                                        items={tasksInColumn.map((task) => task.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="min-h-[180px] space-y-3 p-3">
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
            </div>

            <DragOverlay>
                {activeTask ? (
                    <div className="rotate-2 opacity-80">
                        <TaskCard task={activeTask} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
