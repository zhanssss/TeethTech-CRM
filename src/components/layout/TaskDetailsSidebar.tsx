'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ReturnTaskForReworkModal from '@/src/components/Modals/ReturnTaskForReworkModal';
import Modal from '@/src/components/ui/Modal';
import QualityIncidentsPanel from '@/src/components/tasks/QualityIncidentsPanel';
import TaskFilesPanel from '@/src/components/tasks/TaskFilesPanel';
import TaskHistoryTimeline from '@/src/components/tasks/TaskHistoryTimeline';
import MaterialChips from '@/src/components/tasks/MaterialChips';
import TaskMaterialAccountingPanel from '@/src/components/tasks/TaskMaterialAccountingPanel';
import { RootState } from '@/src/lib/store';
import type { Task, TaskAttachment, TaskImage } from '@/src/types/task.types';

type TaskDetailsSidebarProps = {
    task: Task | null;
    onClose: () => void;
    onAddComment?: (text: string) => void;
    onAddAttachments?: (files: TaskAttachment[]) => void;
    onAddImages?: (images: TaskImage[]) => void;
};

export default function TaskDetailsSidebar({
                                               task: selectedTask,
                                               onClose,
                                               onAddComment,
                                               onAddAttachments,
                                           onAddImages,
                                           }: TaskDetailsSidebarProps) {
    const [commentText, setCommentText] = useState('');
    const [reworkModalTaskId, setReworkModalTaskId] = useState('');
    const [renderedTask, setRenderedTask] = useState<Task | null>(selectedTask);
    const [isVisible, setIsVisible] = useState(false);
    const [isHistoryDetailsOpen, setIsHistoryDetailsOpen] = useState(false);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        let animationFrame: number | undefined;
        let visibilityFrame: number | undefined;
        let removalTimeout: number | undefined;

        if (selectedTask) {
            animationFrame = window.requestAnimationFrame(() => {
                setRenderedTask(selectedTask);
                setIsHistoryDetailsOpen(false);
                visibilityFrame = window.requestAnimationFrame(() => setIsVisible(true));
            });
        } else {
            animationFrame = window.requestAnimationFrame(() => {
                setIsVisible(false);
                const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                removalTimeout = window.setTimeout(
                    () => setRenderedTask(null),
                    shouldReduceMotion ? 0 : SIDEBAR_ANIMATION_DURATION
                );
            });
        }

        return () => {
            if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
            if (visibilityFrame !== undefined) window.cancelAnimationFrame(visibilityFrame);
            if (removalTimeout !== undefined) window.clearTimeout(removalTimeout);
        };
    }, [selectedTask]);

    if (!renderedTask) return null;

    const task = renderedTask;

    const canReturnForRework = isAuthenticated && isTaskEligibleForRework(task);

    const handleAddComment = () => {
        const trimmed = commentText.trim();

        if (!trimmed || !onAddComment) return;

        onAddComment(trimmed);
        setCommentText('');
    };

    return (
        <>
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
                    isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />

            <aside
                inert={!isVisible}
                aria-hidden={!isVisible}
                className={`fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] w-full flex-col rounded-t-2xl border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none sm:inset-x-auto sm:right-0 sm:top-0 sm:h-dvh sm:max-w-[30rem] sm:rounded-none ${
                    isVisible
                        ? 'translate-y-0 sm:translate-x-0'
                        : 'pointer-events-none translate-y-full sm:translate-x-full sm:translate-y-0'
                }`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-5">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Детали задачи
                        </p>
                        <h2 className="mt-1 truncate text-lg font-black text-slate-900 sm:text-xl">
                            {task.title ?? `Задача #${task.id}`}
                        </h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                            Статус: {task.status}
                        </p>
                        {canReturnForRework ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setReworkModalTaskId(task.id);
                                }}
                                className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 transition hover:border-amber-400 hover:bg-amber-100"
                            >
                                Вернуть на переделку
                            </button>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100"
                    >
                        Закрыть
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:space-y-6 sm:p-5">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Основная информация
                        </h3>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {task.patient && <InfoItem label="Пациент" value={task.patient} />}
                            {task.orderId && <InfoItem label="Заказ" value={`#${task.orderId}`} />}
                            {task.deadline && <InfoItem label="Срок" value={task.deadline} />}
                            {task.priority && <InfoItem label="Приоритет" value={task.priority} />}
                            {task.type && <InfoItem label="Вид работы" value={task.type} />}
                            {task.materialNames ? (
                                <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2">
                                    <p className="text-[10px] font-black uppercase text-slate-400">Материалы задачи</p>
                                    <MaterialChips materialNames={task.materialNames} className="mt-2" />
                                </div>
                            ) : null}
                            <InfoItem label="Кол-во" value={task.units} />
                            {task.unitPrice ? <InfoItem label="Цена" value={task.unitPrice.toLocaleString('ru-RU')} /> : null}
                            {task.discount ? <InfoItem label="Скидка" value={task.discount.toLocaleString('ru-RU')} /> : null}
                        </div>
                    </section>

                    {UUID_PATTERN.test(task.id) && task.materialIds && task.materialNames ? (
                        <TaskMaterialAccountingPanel
                            key={task.id}
                            taskId={task.id}
                            materialIds={task.materialIds}
                            materialNames={task.materialNames}
                        />
                    ) : null}

                    {UUID_PATTERN.test(task.id) ? (
                        <QualityIncidentsPanel
                            taskId={task.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                        />
                    ) : null}

                    <TaskHistoryTimeline
                        taskId={task.id}
                        fallbackItems={task.history}
                        compact
                        onOpenDetails={() => setIsHistoryDetailsOpen(true)}
                        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                    />

                    <TaskFilesPanel
                        taskId={task.id}
                        fallbackImages={task.images}
                        fallbackAttachments={task.attachments}
                        onAddImages={onAddImages}
                        onAddAttachments={onAddAttachments}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                    />

                    <section>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Комментарии
                        </h3>

                        {onAddComment ? (
                            <div className="mt-3 space-y-3">
                                <textarea
                                    value={commentText}
                                    onChange={(event) => setCommentText(event.target.value)}
                                    placeholder="Написать комментарий..."
                                    className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />

                                <button
                                    type="button"
                                    onClick={handleAddComment}
                                    className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                    disabled={!commentText.trim()}
                                >
                                    Добавить комментарий
                                </button>
                            </div>
                        ) : null}

                        {task.comments?.length ? (
                            <div className="mt-4 space-y-3">
                                {task.comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className="rounded-xl border border-slate-200 bg-white p-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-bold text-slate-800">
                                                {comment.author}
                                            </p>
                                            <p className="text-[10px] font-semibold text-slate-400">
                                                {comment.createdAt}
                                            </p>
                                        </div>

                                        <p className="mt-2 text-sm leading-5 text-slate-600">
                                            {comment.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyText text="Комментариев пока нет" />
                        )}
                    </section>
                </div>
            </aside>

            {isHistoryDetailsOpen ? (
                <Modal contentClassName="max-w-6xl overflow-hidden p-0">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-violet-50/60 p-5 dark:border-slate-700 dark:from-slate-900 dark:to-violet-950/30 sm:p-6">
                        <div className="flex min-w-0 items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6"><path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round"/><path d="M3 4v5h5M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                            <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-600 dark:text-violet-300">Журнал задачи</p><h2 className="mt-1 truncate text-xl font-black text-slate-950 dark:text-white sm:text-2xl">История изменений</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.title ?? `Задача #${task.id}`} · статусы, назначения и контроль качества</p></div>
                        </div>
                        <button type="button" onClick={() => setIsHistoryDetailsOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800" aria-label="Закрыть историю"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round"/></svg></button>
                    </div>

                    <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950 sm:p-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]">
                        <TaskHistoryTimeline taskId={task.id} fallbackItems={task.history} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900" />
                        <div className="space-y-5">
                            {UUID_PATTERN.test(task.id) ? <QualityIncidentsPanel taskId={task.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900" /> : <section className="rounded-[24px] border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">Контроль качества доступен после сохранения задачи.</section>}
                            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Сводка задачи</p>
                                <div className="mt-4 grid grid-cols-2 gap-2"><HistorySummaryItem label="Статус" value={task.status} /><HistorySummaryItem label="Приоритет" value={task.priority} /><HistorySummaryItem label="Пациент" value={task.patient} /><HistorySummaryItem label="Срок" value={task.deadline} /></div>
                            </section>
                        </div>
                    </div>
                </Modal>
            ) : null}

            {reworkModalTaskId === task.id ? (
                <ReturnTaskForReworkModal
                    taskId={task.id}
                    onClose={() => setReworkModalTaskId('')}
                    onSuccess={() => {
                        setReworkModalTaskId('');
                    }}
                />
            ) : null}
        </>
    );
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SIDEBAR_ANIMATION_DURATION = 300;

const NON_PRODUCTION_STATUSES = new Set([
    'TODO',
    'NEW',
    'CREATED',
    'DONE',
    'COMPLETED',
    'CANCELLED',
    'CANCELED',
    'CLOSED',
    'RESOLVED',
    'FINISHED',
    'DELIVERED',
]);

function isTaskEligibleForRework(task: Task) {
    if (!UUID_PATTERN.test(task.id) || task.hasAccess === false || task.isCompleted === true) {
        return false;
    }

    const normalizedStatus = (task.currentStatusCode || task.status || '')
        .trim()
        .toUpperCase()
        .replace(/[\s/-]+/gu, '_');

    if (!normalizedStatus || NON_PRODUCTION_STATUSES.has(normalizedStatus)) return false;

    return !normalizedStatus.includes('НОВАЯ_ЗАДАЧА')
        && !normalizedStatus.includes('ЗАВЕРШ')
        && normalizedStatus !== 'ГОТОВО';
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
    const displayValue = value === undefined || value === null || value === '' ? '-' : value;

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-black uppercase text-slate-400">
                {label}
            </p>
            <p className="mt-1 truncate text-sm font-bold text-slate-800">
                {displayValue}
            </p>
        </div>
    );
}

function EmptyText({ text }: { text: string }) {
    return (
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-400">
            {text}
        </div>
    );
}

function HistorySummaryItem({ label, value }: { label: string; value?: string | number | null }) {
    return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-bold text-slate-800 dark:text-slate-100">{value || '—'}</p></div>;
}
