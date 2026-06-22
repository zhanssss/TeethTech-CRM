'use client';

import { useState } from 'react';
import TaskFilesPanel from '@/src/components/tasks/TaskFilesPanel';
import TaskHistoryTimeline from '@/src/components/tasks/TaskHistoryTimeline';
import type { Task, TaskAttachment, TaskImage } from '@/src/types/task.types';

type TaskDetailsSidebarProps = {
    task: Task | null;
    onClose: () => void;
    onAddComment: (text: string) => void;
    onAddAttachments: (files: TaskAttachment[]) => void;
    onAddImages: (images: TaskImage[]) => void;
};

export default function TaskDetailsSidebar({
                                               task,
                                               onClose,
                                               onAddComment,
                                               onAddAttachments,
                                               onAddImages,
                                           }: TaskDetailsSidebarProps) {
    const [commentText, setCommentText] = useState('');

    if (!task) return null;

    const handleAddComment = () => {
        const trimmed = commentText.trim();

        if (!trimmed) return;

        onAddComment(trimmed);
        setCommentText('');
    };

    return (
        <>
            <div
                onClick={onClose}
                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
            />

            <aside className="fixed inset-x-0 bottom-0 z-50 flex h-[92dvh] w-full flex-col rounded-t-2xl border-l border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:right-0 sm:top-0 sm:h-dvh sm:max-w-[30rem] sm:rounded-none">
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
                            <InfoItem label="Цвет" value={task.color} />
                            <InfoItem label="Абатмент" value={task.abutment} />
                            <InfoItem label="Техник" value={task.technicianId} />
                            <InfoItem label="Оператор" value={task.operatorId} />
                        </div>
                    </section>

                    <TaskHistoryTimeline
                        taskId={task.id}
                        fallbackItems={task.history}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
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
        </>
    );
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-black uppercase text-slate-400">
                {label}
            </p>
            <p className="mt-1 truncate text-sm font-bold text-slate-800">
                {value || '-'}
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
