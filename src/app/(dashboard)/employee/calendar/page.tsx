'use client';

import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/lib/store';
import { mockTasks } from '@/src/mock/tasks';

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

function getStatusBadge(status: string) {
    switch (status) {
        case 'TODO':
            return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'MODELING':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'MILLING':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'POST_PROCESSING':
            return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'DONE':
            return 'bg-green-50 text-green-700 border-green-200';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'TODO':
            return 'Нужно сделать';
        case 'MODELING':
            return 'Моделирование';
        case 'MILLING':
            return 'Фрезеровка';
        case 'POST_PROCESSING':
            return 'Обработка';
        case 'DONE':
            return 'Готово';
        default:
            return status;
    }
}

function formatDateKey(date: Date) {
    return date.toISOString().split('T')[0];
}

function isSameDay(dateA: Date, dateB: Date) {
    return formatDateKey(dateA) === formatDateKey(dateB);
}

export default function EmployeeCalendarPage() {
    const { id, name } = useSelector((state: RootState) => state.auth);

    const myTasks = useMemo(() => {
        return mockTasks.filter((task) => task.technicianId === id);
    }, [id]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const monthLabel = currentDate.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
    });

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startDay = startOfMonth.getDay() === 0 ? 7 : startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const calendarDays = [];

    for (let i = 1; i < startDay; i++) {
        calendarDays.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(new Date(currentYear, currentMonth, day));
    }

    const selectedDateTasks = myTasks.filter(
        (task) => task.deadline === formatDateKey(selectedDate)
    );

    const getTasksByDate = (date: Date) => {
        const key = formatDateKey(date);
        return myTasks.filter((task) => task.deadline === key);
    };

    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Мой календарь</h1>
                    <p className="text-sm text-slate-500">
                        План задач и дедлайнов сотрудника {name}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevMonth}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        ← Назад
                    </button>

                    <div className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-bold text-slate-800 shadow-sm capitalize">
                        {monthLabel}
                    </div>

                    <button
                        onClick={goToNextMonth}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Вперед →
                    </button>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                            <div key={day} className="p-4">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {calendarDays.map((date, index) => {
                            if (!date) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        className="min-h-[120px] border-b border-r border-slate-100 bg-slate-50/50"
                                    />
                                );
                            }

                            const tasks = getTasksByDate(date);
                            const isSelected = isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());

                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => setSelectedDate(date)}
                                    className={`min-h-[120px] border-b border-r border-slate-100 p-2 text-left align-top transition ${
                                        isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span
                                            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                                                isToday
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-slate-700'
                                            }`}
                                        >
                                            {date.getDate()}
                                        </span>

                                        {tasks.length > 0 && (
                                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-700">
                                                {tasks.length}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-2 space-y-1">
                                        {tasks.slice(0, 2).map((task) => (
                                            <div
                                                key={task.id}
                                                className="truncate rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700"
                                            >
                                                {task.title}
                                            </div>
                                        ))}

                                        {tasks.length > 2 && (
                                            <div className="text-[10px] font-bold text-blue-600">
                                                + ещё {tasks.length - 2}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Задачи на{' '}
                            {selectedDate.toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                            })}
                        </h2>
                    </div>

                    <div className="space-y-4 p-5">
                        {selectedDateTasks.length > 0 ? (
                            selectedDateTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-center justify-between gap-2">
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

                                    <h3 className="mt-3 text-sm font-bold text-slate-900">
                                        {task.title}
                                    </h3>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Пациент: {task.patient}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Заказ: #{task.orderId}
                                    </p>

                                    <div className="mt-4 flex items-center justify-between gap-2">
                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusBadge(
                                                task.status
                                            )}`}
                                        >
                                            {getStatusLabel(task.status)}
                                        </span>

                                        <Link
                                            href={`/orders/${task.orderId}`}
                                            className="text-xs font-bold text-blue-600 hover:underline"
                                        >
                                            Открыть заказ
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400">
                                На выбранный день задач нет
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}