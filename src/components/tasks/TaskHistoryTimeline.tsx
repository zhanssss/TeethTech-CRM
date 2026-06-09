'use client';

import {useMemo, useState} from 'react';
import {useGetTaskHistoryQuery} from '@/src/services/api/ordersApi';
import type {TaskHistoryItem} from '@/src/types/task.types';

const HISTORY_PAGE_SIZE = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FIELD_LABELS: Record<string, string> = {
    status: 'статус',
    currentStatus: 'статус',
    currentStatusCode: 'статус',
    currentStatusFormName: 'статус',
    technicianId: 'техник',
    dentalTechnicianId: 'техник',
    dentalTechnicianFullName: 'техник',
    operatorId: 'оператор',
    cadCamOperatorId: 'оператор',
    patientFullName: 'пациент',
    doctorFullName: 'врач',
    deadline: 'срок сдачи',
    quantity: 'количество',
    toothNumbers: 'зубы',
    workTypeId: 'тип работы',
    workTypeName: 'тип работы',
    materialId: 'материал',
    materialName: 'материал',
    colorId: 'цвет',
    colorCode: 'цвет',
    pricePerUnit: 'цена за единицу',
    unitPrice: 'цена за единицу',
    discount: 'скидка',
    discountPercent: 'скидка',
    totalPrice: 'итоговая сумма',
    totalAmount: 'итоговая сумма',
    comment: 'комментарий',
};

const EVENT_LABELS: Record<string, string> = {
    CREATED: 'Задача создана',
    UPDATED: 'Задача обновлена',
    FIELD_CHANGED: 'Поле изменено',
    VALUE_CHANGED: 'Поле изменено',
    STATUS_CHANGED: 'Статус изменён',
    STATUS_UPDATED: 'Статус изменён',
    ASSIGNED: 'Назначен исполнитель',
    TECHNICIAN_ASSIGNED: 'Назначен техник',
    OPERATOR_ASSIGNED: 'Назначен оператор',
    COMMENT_ADDED: 'Добавлен комментарий',
    ATTACHMENT_ADDED: 'Добавлен файл',
    DELETED: 'Задача удалена',
};

const EVENT_DOT_CLASSES: Record<string, string> = {
    CREATED: 'border-green-200 bg-green-500 ring-green-100',
    STATUS_CHANGED: 'border-blue-200 bg-blue-500 ring-blue-100',
    STATUS_UPDATED: 'border-blue-200 bg-blue-500 ring-blue-100',
    ASSIGNED: 'border-violet-200 bg-violet-500 ring-violet-100',
    TECHNICIAN_ASSIGNED: 'border-violet-200 bg-violet-500 ring-violet-100',
    OPERATOR_ASSIGNED: 'border-violet-200 bg-violet-500 ring-violet-100',
    DELETED: 'border-red-200 bg-red-500 ring-red-100',
};

type TaskHistoryTimelineProps = {
    taskId?: string | null;
    className?: string;
};

export default function TaskHistoryTimeline({taskId, className = ''}: TaskHistoryTimelineProps) {
    const activeTaskId = taskId ?? '';
    const [pagination, setPagination] = useState({taskId: '', page: 0});
    const canLoadHistory = Boolean(taskId && UUID_PATTERN.test(taskId));
    const page = pagination.taskId === activeTaskId ? pagination.page : 0;
    const changePage = (updater: (currentPage: number) => number) => {
        setPagination((currentPagination) => {
            const currentPage = currentPagination.taskId === activeTaskId
                ? currentPagination.page
                : 0;

            return {
                taskId: activeTaskId,
                page: Math.max(updater(currentPage), 0),
            };
        });
    };

    const {
        data,
        isError,
        isFetching,
        isLoading,
        refetch,
    } = useGetTaskHistoryQuery(
        {taskId: taskId ?? '', page, size: HISTORY_PAGE_SIZE},
        {skip: !canLoadHistory}
    );

    const events = useMemo(() => data?.content ?? [], [data?.content]);
    const participantCount = useMemo(() => {
        return new Set(
            events
                .map((event) => event.changedBy?.userId ?? event.changedBy?.fullName)
                .filter(Boolean)
        ).size;
    }, [events]);

    if (!taskId) {
        return (
            <section className={className}>
                <HistoryHeader eventCount={0} participantCount={0} />
                <EmptyState text="Выберите задачу, чтобы увидеть журнал изменений." />
            </section>
        );
    }

    if (!canLoadHistory) {
        return (
            <section className={className}>
                <HistoryHeader eventCount={0} participantCount={0} />
                <EmptyState text="Журнал доступен для задач, сохранённых на сервере." />
            </section>
        );
    }

    return (
        <section className={className}>
            <div className="flex items-start justify-between gap-3">
                <HistoryHeader eventCount={events.length} participantCount={participantCount} />

                <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                >
                    Обновить
                </button>
            </div>

            {isLoading ? (
                <div className="mt-4 space-y-3">
                    {Array.from({length: 3}).map((_, index) => (
                        <div
                            key={index}
                            className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                        />
                    ))}
                </div>
            ) : null}

            {isError ? (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-700">
                        Не удалось загрузить журнал задачи.
                    </p>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-red-700"
                    >
                        Повторить
                    </button>
                </div>
            ) : null}

            {!isLoading && !isError && events.length === 0 ? (
                <EmptyState text="По этой задаче пока нет событий." />
            ) : null}

            {!isError && events.length > 0 ? (
                <>
                    <div className="mt-5 space-y-4">
                        {events.map((event, index) => (
                            <HistoryEventCard
                                key={event.id}
                                event={event}
                                isLast={index === events.length - 1}
                            />
                        ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => changePage((currentPage) => currentPage - 1)}
                            disabled={page === 0 || isFetching}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Назад
                        </button>

                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Страница {(data?.page ?? page) + 1}
                        </span>

                        <button
                            type="button"
                            onClick={() => changePage((currentPage) => currentPage + 1)}
                            disabled={!data?.hasNext || isFetching}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Далее
                        </button>
                    </div>
                </>
            ) : null}
        </section>
    );
}

function HistoryHeader({
                           eventCount,
                           participantCount,
                       }: {
    eventCount: number;
    participantCount: number;
}) {
    return (
        <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                История изменений
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="Событий" value={eventCount} />
                <Metric label="Участников" value={participantCount || '-'} />
            </div>
        </div>
    );
}

function Metric({label, value}: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-black uppercase text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-lg font-black text-slate-900">
                {value}
            </p>
        </div>
    );
}

function HistoryEventCard({event, isLast}: { event: TaskHistoryItem; isLast: boolean }) {
    const {dateLabel, timeLabel} = formatChangedAt(event.changedAt);
    const title = getEventTitle(event);
    const dotClassName = EVENT_DOT_CLASSES[event.eventType] ?? 'border-amber-200 bg-amber-500 ring-amber-100';
    const fullName = event.changedBy?.fullName ?? 'Неизвестный пользователь';
    const initials = event.changedBy?.initials || getInitials(fullName);

    return (
        <article className="grid grid-cols-[4.75rem_1.25rem_minmax(0,1fr)] gap-3">
            <time className="pt-1 text-right" dateTime={event.changedAt}>
                <span className="block text-xs font-black text-slate-700">
                    {dateLabel}
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-400">
                    {timeLabel}
                </span>
            </time>

            <div className="relative flex justify-center">
                {!isLast ? (
                    <span className="absolute bottom-[-1rem] top-4 w-px bg-slate-200" />
                ) : null}
                <span className={`relative mt-1 h-3.5 w-3.5 rounded-full border-2 ring-4 ${dotClassName}`} />
            </div>

            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-slate-900">
                            {title}
                        </h4>
                        <HistoryValueChange event={event} />
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-black text-indigo-700">
                            {initials}
                        </span>
                        <span className="hidden max-w-28 truncate text-xs font-bold text-slate-500 sm:block">
                            {fullName}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
}

function HistoryValueChange({event}: { event: TaskHistoryItem }) {
    const oldValue = normalizeHistoryValue(event.oldValue);
    const newValue = normalizeHistoryValue(event.newValue);
    const fieldName = event.fieldName ? getFieldLabel(event.fieldName) : null;

    if (!oldValue && !newValue) {
        return fieldName ? (
            <p className="mt-2 text-sm font-semibold text-slate-500">
                Поле: {fieldName}
            </p>
        ) : null;
    }

    if (!oldValue) {
        return (
            <p className="mt-2 text-sm text-slate-600">
                {fieldName ? `${capitalize(fieldName)}: ` : ''}
                <span className="font-bold text-slate-900">{newValue}</span>
            </p>
        );
    }

    return (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-400 line-through">
                {oldValue}
            </span>
            {newValue ? (
                <>
                    <span className="font-bold text-slate-400">→</span>
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-black text-blue-700">
                        {newValue}
                    </span>
                </>
            ) : null}
        </div>
    );
}

function EmptyState({text}: { text: string }) {
    return (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-400">
            {text}
        </div>
    );
}

function getEventTitle(event: TaskHistoryItem) {
    if (isStatusField(event.fieldName)) {
        return 'Статус изменён';
    }

    if (event.eventType === 'CREATED') {
        return EVENT_LABELS.CREATED;
    }

    if (event.fieldName) {
        return `Поле изменено: ${getFieldLabel(event.fieldName)}`;
    }

    return EVENT_LABELS[event.eventType] ?? humanizeEventType(event.eventType);
}

function isStatusField(fieldName?: string | null) {
    return Boolean(fieldName && ['status', 'currentStatus', 'currentStatusCode', 'currentStatusFormName'].includes(fieldName));
}

function getFieldLabel(fieldName: string) {
    return FIELD_LABELS[fieldName] ?? fieldName;
}

function normalizeHistoryValue(value?: string | null) {
    if (value === undefined || value === null) return '';

    const trimmedValue = String(value).trim();

    return trimmedValue || '';
}

function formatChangedAt(value: string) {
    const changedAt = new Date(value);

    if (Number.isNaN(changedAt.getTime())) {
        return {
            dateLabel: '-',
            timeLabel: '',
        };
    }

    return {
        dateLabel: changedAt.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
        }),
        timeLabel: changedAt.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
        }),
    };
}

function getInitials(fullName: string) {
    return fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('') || '?';
}

function humanizeEventType(eventType: string) {
    return eventType
        .toLowerCase()
        .split('_')
        .map(capitalize)
        .join(' ');
}

function capitalize(value: string) {
    if (!value) return value;

    return value[0].toUpperCase() + value.slice(1);
}
