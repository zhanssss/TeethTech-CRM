'use client';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/lib/store';
import { mockTasks } from '@/src/mock/tasks';
import ErrorState from '@/src/components/ui/ErrorState';
import { useGetUsersQuery } from '@/src/services/api/usersApi';
import { mapUserToEmployee } from '@/src/utils/employeesUtils';

function StatCard({
                      title,
                      value,
                      hint,
                  }: {
    title: string;
    value: string | number;
    hint: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{value}</p>
            <p className="mt-2 text-xs text-slate-400">{hint}</p>
        </div>
    );
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

export default function EmployeeAnalyticsPage() {
    const { id, name } = useSelector((state: RootState) => state.auth);
    const {
        data: users = [],
        isLoading: isUsersLoading,
        isFetching: isUsersFetching,
        isError: isUsersError,
        refetch: refetchUsers,
    } = useGetUsersQuery();

    const currentEmployee = useMemo(() => {
        const user = users.find((employee) => employee.id === id);
        return user ? mapUserToEmployee(user) : undefined;
    }, [id, users]);

    const myTasks = useMemo(() => {
        return mockTasks.filter((task) => task.technicianId === id);
    }, [id]);

    const completedTasks = myTasks.filter((task) => task.status === 'DONE');
    const activeTasks = myTasks.filter((task) => task.status !== 'DONE');
    const overdueTasks = activeTasks.filter(
        (task) => new Date(task.deadline) < new Date()
    );

    const statusStats = [
        { key: 'TODO', count: myTasks.filter((task) => task.status === 'TODO').length },
        {
            key: 'MODELING',
            count: myTasks.filter((task) => task.status === 'MODELING').length,
        },
        {
            key: 'MILLING',
            count: myTasks.filter((task) => task.status === 'MILLING').length,
        },
        {
            key: 'POST_PROCESSING',
            count: myTasks.filter((task) => task.status === 'POST_PROCESSING').length,
        },
        { key: 'DONE', count: myTasks.filter((task) => task.status === 'DONE').length },
    ];

    const nearestDeadlines = [...activeTasks]
        .sort(
            (a, b) =>
                new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        )
        .slice(0, 5);

    const completionRate =
        myTasks.length > 0
            ? Math.round((completedTasks.length / myTasks.length) * 100)
            : 0;

    if (isUsersLoading) {
        return <div className="text-sm text-slate-500">Загрузка аналитики...</div>;
    }

    if (isUsersError) {
        return (
            <ErrorState
                title="Аналитика недоступна"
                onRetry={() => void refetchUsers()}
                isRetrying={isUsersFetching}
            >
                Не удалось загрузить данные текущего сотрудника.
            </ErrorState>
        );
    }

    if (!currentEmployee) {
        return (
            <ErrorState title="Сотрудник не найден">
                Проверьте, что учётная запись сотрудника активна.
            </ErrorState>
        );
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Моя аналитика</h1>
                <p className="text-sm text-slate-500">
                    Статистика сотрудника {name} по задачам и срокам
                </p>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard
                    title="Всего задач"
                    value={myTasks.length}
                    hint="Общее количество назначенных задач"
                />
                <StatCard
                    title="Завершено"
                    value={completedTasks.length}
                    hint="Закрытые этапы производства"
                />
                <StatCard
                    title="В работе"
                    value={activeTasks.length}
                    hint="Текущие незавершенные задачи"
                />
                <StatCard
                    title="Просрочено"
                    value={overdueTasks.length}
                    hint="Активные задачи с нарушением срока"
                />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Нагрузка по статусам
                        </h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase text-slate-600">
                            Completion {completionRate}%
                        </span>
                    </div>

                    <div className="mt-5 space-y-4">
                        {statusStats.map((item) => (
                            <div key={item.key}>
                                <div className="mb-2 flex items-center justify-between text-sm">
                                    <span className="font-semibold text-slate-700">
                                        {getStatusLabel(item.key)}
                                    </span>
                                    <span className="text-slate-400">{item.count}</span>
                                </div>

                                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-blue-600"
                                        style={{
                                            width: `${
                                                myTasks.length > 0
                                                    ? (item.count / myTasks.length) * 100
                                                    : 0
                                            }%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Эффективность
                    </h2>

                    <div className="mt-5 space-y-4">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase text-slate-400">
                                Выполнено вовремя
                            </p>
                            <p className="mt-2 text-2xl font-black text-slate-900">
                                {currentEmployee.stats.onTimeRate}%
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase text-slate-400">
                                Средний срок
                            </p>
                            <p className="mt-2 text-2xl font-black text-slate-900">
                                {currentEmployee.stats.averageDays} дн.
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase text-slate-400">
                                Специализация
                            </p>
                            <p className="mt-2 text-sm font-bold text-slate-900">
                                {currentEmployee.specialization}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Ближайшие дедлайны
                    </h2>
                </div>

                <div className="divide-y divide-slate-100">
                    {nearestDeadlines.length > 0 ? (
                        nearestDeadlines.map((task) => (
                            <div
                                key={task.id}
                                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
                            >
                                <div>
                                    <p className="text-sm font-bold text-slate-900">
                                        {task.title}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Пациент: {task.patient} · Заказ #{task.orderId}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${getStatusBadge(
                                            task.status
                                        )}`}
                                    >
                                        {getStatusLabel(task.status)}
                                    </span>

                                    <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase text-red-700">
                                        {task.deadline}
                   npm                 </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-5 py-8 text-sm text-slate-400">
                            Нет активных дедлайнов
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
