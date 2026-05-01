'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/lib/store';
import { useEffect, useState } from 'react';
import {
    DndContext,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {mockOrders} from "@/src/mock/orders";
import {mockTasks} from "@/src/mock/tasks";


// --- КОНСТАНТЫ ---
const COLUMNS = [
    {id: 'TODO', title: 'Нужно сделать', color: 'border-t-slate-500'},
    {id: 'MODELING', title: 'Моделирование', color: 'border-t-blue-500'},
    {id: 'MILLING', title: 'Фрезеровка', color: 'border-t-purple-500'},
    {id: 'POST_PROCESSING', title: 'Обработка', color: 'border-t-orange-500'},
    {id: 'DONE', title: 'Готово', color: 'border-t-green-500'},
];

// --- ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ (Без изменений) ---
const DroppableColumn = ({id, children, column}: any) => {
    const {setNodeRef} = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={`w-full min-w-[150px] bg-slate-100 rounded-xl flex flex-col max-h-full border border-slate-200 border-t-4 ${column.color} shadow-inner`}
        >
            {children}
        </div>
    );
};

const TaskCard = ({task}: { task: any, role: string | null }) => {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
        id: task.id,
        data: {type: 'Task', task}
    });
    const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-blue-400 cursor-grab active:cursor-grabbing transition flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{task.id}</span>
                <span className="text-slate-400 italic">Этап производства</span>
            </div>
            <h3 className="text-slate-900 font-semibold text-sm">{task.type}</h3>
            <div className="flex items-center gap-2 mt-2 border-t pt-2">
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">T{task.techId}</div>
                <span className="text-[10px] text-slate-500 font-medium">Исполнитель: {task.techId}</span>
            </div>
        </div>
    );
};

// --- СТРАНИЦА ЗАКАЗА ---
export default function OrderBoardPage() {
    const params = useParams<{ id: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const { role } = useSelector((state: RootState) => state.auth);
    const [isMounted, setIsMounted] = useState(false);
    const order = mockOrders.find((item) => item.id === id);
    const orderTasks = mockTasks.filter((task) => task.orderId === id);


    const [tasks, setTasks] = useState([
        { id: `${id}-step1`, type: 'CAD/CAM Моделирование', techId: '2', status: 'MODELING' },
        { id: `${id}-step2`, type: 'Спекание и глазуровка', techId: '3', status: 'TODO' }
    ]);

    useEffect(() => {
        setTasks([
            { id: `${id}-step1`, type: 'CAD/CAM Моделирование', techId: '2', status: 'MODELING' },
            { id: `${id}-step2`, type: 'Спекание и глазуровка', techId: '3', status: 'TODO' }
        ]);
    }, [id]);

    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => { setIsMounted(true); }, []);

    const sensors = useSensors(useSensor(PointerSensor, {activationConstraint: {distance: 8}}));
    const handleDragStart = (event: any) => setActiveId(event.active.id);
    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        if (!over) return;
        const activeId = active.id;
        const overId = over.id;
        setTasks((prev) => {
            const activeIndex = prev.findIndex((t) => t.id === activeId);
            const overIndex = prev.findIndex((t) => t.id === overId);
            if (overIndex !== -1) {
                const newStatus = prev[overIndex].status;
                const updated = [...prev];
                updated[activeIndex] = {...updated[activeIndex], status: newStatus};
                return arrayMove(updated, activeIndex, overIndex);
            }
            const isColumn = COLUMNS.some(col => col.id === overId);
            if (isColumn) {
                const updated = [...prev];
                updated[activeIndex] = {...updated[activeIndex], status: overId as string};
                return updated;
            }
            return prev;
        });
        setActiveId(null);
    };

    if (!isMounted) return null;

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
                        Проверь id заказа или вернись в реестр.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="h-full flex flex-col space-y-6">
                {/* 1. Навигация и заголовок */}
                <header className="flex justify-between items-start">
                    <div>
                        <Link href="/orders" className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 mb-2 uppercase tracking-wider">
                            ← Реестр заказов
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900">Заказ #{id}</h1>
                    </div>
                    <div className="flex gap-2">
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">В производстве</span>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Срок: {order.deadline}</span>
                    </div>
                </header>

                {/* 2. ПАНЕЛЬ ДАННЫХ ПАЦИЕНТА (ИНФО ИЗ EXCEL) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Основная инфо */}
                    <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Пациент</p>
                            <p className="font-bold text-slate-800 text-lg">{order.patient}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Клиника</p>
                            <p className="font-semibold text-blue-600 text-sm">{order.clinic}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Врач</p>
                            <p className="text-slate-700 text-sm font-medium">{order.doctor}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Вид работы</p>
                            <p className="text-slate-700 text-sm font-medium">{order.workType} — {order.units} ед.</p>
                        </div>
                    </div>

                    {/* Технические детали */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Цвет</p>
                                <p className="text-xl font-black text-orange-400">{order.color}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Абатмент</p>
                                <p className="text-sm font-bold italic">{order.abutment}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                            {order.impression && <span className="bg-white/10 text-[9px] px-2 py-1 rounded font-bold">СЛЕПОК</span>}
                            {order.bite && <span className="bg-white/10 text-[9px] px-2 py-1 rounded font-bold">ПРИКУС</span>}
                        </div>
                    </div>

                    {/* Команда */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 text-center border-b pb-1">Команда наряда</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">Т</div>
                                <div className="text-[11px]">
                                    <p className="text-slate-400 uppercase font-bold text-[8px]">Техник</p>
                                    <p className="font-bold text-slate-700">{order.technician}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">О</div>
                                <div className="text-[11px]">
                                    <p className="text-slate-400 uppercase font-bold text-[8px]">Оператор</p>
                                    <p className="font-bold text-slate-700">{order.operator}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. КАНБАН-ДОСКА (Ниже данных) */}
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start pt-4">
                    {COLUMNS.map((column) => {
                        const tasksInColumn = tasks.filter((t) => t.status === column.id);
                        return (
                            <DroppableColumn key={column.id} id={column.id} column={column}>
                                <div className="p-4 flex justify-between items-center border-b border-slate-200 bg-white/50 rounded-t-xl">
                                    <h2 className="font-bold text-xs text-slate-800 uppercase tracking-widest">{column.title}</h2>
                                    <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded">{tasksInColumn.length}</span>
                                </div>
                                <SortableContext id={column.id} items={tasksInColumn.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                    <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[150px]">
                                        {tasksInColumn.map((task) => (
                                            <TaskCard key={task.id} task={task} role={role}/>
                                        ))}
                                    </div>
                                </SortableContext>
                            </DroppableColumn>
                        );
                    })}
                </div>
            </div>

            <DragOverlay>
                {activeId && <div className="rotate-2 opacity-80 cursor-grabbing"><TaskCard task={tasks.find(t => t.id === activeId)} role={role} /></div>}
            </DragOverlay>
        </DndContext>
    );
}