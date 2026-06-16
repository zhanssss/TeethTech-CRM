'use client';

import { useMemo, useState } from 'react';

type OrderType = 'PHYSICAL_COPY' | 'DIGITAL_COPY' | 'PROSTHESIS';

type TaskStage =
    | 'todo'
    | 'plaster'
    | 'prosthetist'
    | 'scanner'
    | 'operator'
    | 'ceramist'
    | 'review'
    | 'done';

type TaskStatus =
    | 'active'
    | 'waiting_for_approval'
    | 'remake'
    | 'done';

type Priority = 'low' | 'medium' | 'high';

export type OrderTask = {
    id: string;
    orderId: string;
    orderNumber?: string;
    title: string;

    orderType: OrderType;
    stage: TaskStage;
    status: TaskStatus;

    patientName?: string;
    clinicName?: string;
    doctorName?: string;

    assignedTo?: {
        id: string;
        name: string;
        role: string;
    } | null;

    dueDate?: string | null;
    units?: number;
    color?: string;
    priority?: Priority;
    isOverdue?: boolean;
};

const tasks: OrderTask[] = [];

const stages: {
    id: TaskStage;
    title: string;
    subtitle: string;
    border: string;
}[] = [
    {
        id: 'todo',
        title: 'Нужно сделать',
        subtitle: 'Новые задачи',
        border: 'border-t-slate-500',
    },
    {
        id: 'plaster',
        title: 'Гипсовщик',
        subtitle: 'Физический слепок / протез',
        border: 'border-t-yellow-500',
    },
    {
        id: 'scanner',
        title: 'Сканировщик',
        subtitle: 'Физическая копия',
        border: 'border-t-orange-500',
    },
    {
        id: 'prosthetist',
        title: 'Протезист',
        subtitle: 'Протезы',
        border: 'border-t-cyan-500',
    },
    {
        id: 'operator',
        title: 'Оператор',
        subtitle: 'Моделирование',
        border: 'border-t-emerald-500',
    },
    {
        id: 'ceramist',
        title: 'Керамист',
        subtitle: 'Финальная работа',
        border: 'border-t-blue-600',
    },
    {
        id: 'review',
        title: 'На проверке',
        subtitle: 'waiting_for_approval / remake',
        border: 'border-t-purple-500',
    },
];

const orderTypeLabels: Record<OrderType, string> = {
    PHYSICAL_COPY: 'Физическая копия',
    DIGITAL_COPY: 'Электронная копия',
    PROSTHESIS: 'Протез',
};

const statusLabels: Record<TaskStatus, string> = {
    active: 'В работе',
    waiting_for_approval: 'На подтверждении',
    remake: 'Переделка',
    done: 'Готово',
};

const priorityLabels: Record<Priority, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Срочный',
};

function getStatusClass(status: TaskStatus) {
    switch (status) {
        case 'waiting_for_approval':
            return 'bg-purple-50 text-purple-700 border-purple-100';
        case 'remake':
            return 'bg-red-50 text-red-700 border-red-100';
        case 'done':
            return 'bg-green-50 text-green-700 border-green-100';
        default:
            return 'bg-blue-50 text-blue-700 border-blue-100';
    }
}

function getPriorityClass(priority?: Priority) {
    switch (priority) {
        case 'high':
            return 'bg-red-50 text-red-700 border-red-100';
        case 'medium':
            return 'bg-yellow-50 text-yellow-700 border-yellow-100';
        case 'low':
            return 'bg-slate-50 text-slate-600 border-slate-100';
        default:
            return 'bg-slate-50 text-slate-400 border-slate-100';
    }
}

export default function Dashboard() {
    const [search, setSearch] = useState('');
    const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | OrderType>('all');
    const [stageFilter, setStageFilter] = useState<'all' | TaskStage>('all');

    const filteredTasks = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        return tasks.filter((task) => {
            const matchesSearch =
                !searchValue ||
                task.title.toLowerCase().includes(searchValue) ||
                task.orderNumber?.toLowerCase().includes(searchValue) ||
                task.patientName?.toLowerCase().includes(searchValue) ||
                task.clinicName?.toLowerCase().includes(searchValue) ||
                task.doctorName?.toLowerCase().includes(searchValue);

            const matchesOrderType =
                orderTypeFilter === 'all' || task.orderType === orderTypeFilter;

            const matchesStage =
                stageFilter === 'all' || task.stage === stageFilter;

            return matchesSearch && matchesOrderType && matchesStage;
        });
    }, [search, orderTypeFilter, stageFilter]);

    const activeTasks = filteredTasks.filter((task) => task.stage !== 'done');
    const completedTasks = filteredTasks
        .filter((task) => task.stage === 'done')
        .slice(0, 6);

    const reviewCount = tasks.filter((task) => task.stage === 'review').length;
    const overdueCount = tasks.filter((task) => task.isOverdue).length;
    const completedCount = tasks.filter((task) => task.stage === 'done').length;

    const visibleStages =
        stageFilter === 'all'
            ? stages
            : stages.filter((stage) => stage.id === stageFilter);

    const groupedStages = visibleStages.map((stage) => ({
        ...stage,
        tasks: activeTasks.filter((task) => task.stage === stage.id),
    }));

    const resetFilters = () => {
        setSearch('');
        setOrderTypeFilter('all');
        setStageFilter('all');
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Дэшборд задач заказов
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Этапы показывают, где сейчас находятся задачи внутри заказов.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                    Активных задач:{' '}
                    <span className="font-bold text-slate-900">{activeTasks.length}</span>
                </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Всего задач</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{tasks.length}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-blue-500 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">В работе</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{activeTasks.length}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-purple-500 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">На проверке</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{reviewCount}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 border-l-4 border-l-red-500 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Просрочено</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{overdueCount}</p>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Поиск: заказ, пациент, клиника, врач, задача"
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 lg:col-span-2"
                    />

                    <select
                        value={orderTypeFilter}
                        onChange={(event) =>
                            setOrderTypeFilter(event.target.value as 'all' | OrderType)
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500"
                    >
                        <option value="all">Все типы заказов</option>
                        <option value="PHYSICAL_COPY">Физическая копия</option>
                        <option value="DIGITAL_COPY">Электронная копия</option>
                        <option value="PROSTHESIS">Протез</option>
                    </select>

                    <select
                        value={stageFilter}
                        onChange={(event) =>
                            setStageFilter(event.target.value as 'all' | TaskStage)
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500"
                    >
                        <option value="all">Все этапы</option>
                        {stages.map((stage) => (
                            <option key={stage.id} value={stage.id}>
                                {stage.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                        Найдено задач:{' '}
                        <span className="font-bold text-slate-800">{filteredTasks.length}</span>
                    </p>

                    <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-bold text-slate-500 transition hover:text-blue-600"
                    >
                        Сбросить фильтры
                    </button>
                </div>
            </section>
            <section className="overflow-x-auto pb-3">
                <div className="flex min-w-max gap-4">
                    {groupedStages.map((stage) => (
                        <div
                            key={stage.id}
                            className={`flex h-[min(640px,72dvh)] w-[18rem] shrink-0 flex-col rounded-2xl border border-slate-200 border-t-4 bg-white shadow-sm sm:w-80 ${stage.border}`}
                        >
                            <div className="border-b border-slate-100 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="font-bold text-slate-900">{stage.title}</h2>
                                    </div>

                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                                        {stage.tasks.length}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto p-3">
                                {stage.tasks.length === 0 ? (
                                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-400">
                                        Нет задач на этом этапе
                                    </div>
                                ) : (
                                    stage.tasks.map((task) => (
                                        <article
                                            key={task.id}
                                            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                                                    {orderTypeLabels[task.orderType]}
                                                </span>

                                                <span
                                                    className={`rounded-full border px-2 py-1 text-[10px] font-bold ${getPriorityClass(task.priority)}`}
                                                >
                                                    {task.priority ? priorityLabels[task.priority] : 'Без приоритета'}
                                                </span>
                                            </div>

                                            <h3 className="mt-3 line-clamp-2 text-sm font-bold text-slate-900">
                                                {task.title}
                                            </h3>

                                            <div className="mt-3 space-y-1 text-xs text-slate-500">
                                                <p>
                                                    Заказ:{' '}
                                                    <span className="font-semibold text-slate-700">
                                                        {task.orderNumber || task.orderId}
                                                    </span>
                                                </p>

                                                {task.patientName && (
                                                    <p>
                                                        Пациент:{' '}
                                                        <span className="font-semibold text-slate-700">
                                                            {task.patientName}
                                                        </span>
                                                    </p>
                                                )}

                                                {task.clinicName && (
                                                    <p>
                                                        Клиника:{' '}
                                                        <span className="font-semibold text-slate-700">
                                                            {task.clinicName}
                                                        </span>
                                                    </p>
                                                )}

                                                {task.assignedTo && (
                                                    <p>
                                                        Исполнитель:{' '}
                                                        <span className="font-semibold text-slate-700">
                                                            {task.assignedTo.name}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-center justify-between gap-2">
                                                <span
                                                    className={`rounded-full border px-2 py-1 text-[10px] font-bold ${getStatusClass(task.status)}`}
                                                >
                                                    {statusLabels[task.status]}
                                                </span>

                                                {task.dueDate && (
                                                    <span
                                                        className={`text-xs font-medium ${
                                                            task.isOverdue ? 'text-red-600' : 'text-slate-400'
                                                        }`}
                                                    >
                                                        {task.dueDate}
                                                    </span>
                                                )}
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-bold text-slate-900">Последние готовые задачи</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Показываем только последние 5–6, остальное лучше хранить в архиве заказов.
                        </p>
                    </div>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                        Всего готово: {completedCount}
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {completedTasks.length === 0 ? (
                        <div className="p-6 text-sm text-slate-400">
                            Пока нет готовых задач
                        </div>
                    ) : (
                        completedTasks.map((task) => (
                            <div
                                key={task.id}
                                className="grid grid-cols-1 gap-3 p-4 text-sm md:grid-cols-5 md:items-center"
                            >
                                <div className="md:col-span-2">
                                    <p className="font-bold text-slate-900">{task.title}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {task.orderNumber || task.orderId}
                                    </p>
                                </div>

                                <p className="text-slate-500">{orderTypeLabels[task.orderType]}</p>

                                <p className="text-slate-500">{task.patientName || 'Пациент не указан'}</p>

                                <div className="text-left md:text-right">
                                    <span className="rounded-full border border-green-100 bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                                        Готово
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
