'use client';

import { useState } from 'react';
import type { Task, TaskAttachment, TaskImage } from '@/src/types/task.types';
import TaskHistoryTimeline from '@/src/components/tasks/TaskHistoryTimeline';

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

    const formatFileSize = (size: number) => {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
        return `${(size / 1024 / 1024).toFixed(1)} MB`;
    };

    const handleAddComment = () => {
        const trimmed = commentText.trim();

        if (!trimmed) return;

        onAddComment(trimmed);
        setCommentText('');
    };

    const handleAddAttachments = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);

        if (!files.length) return;

        const preparedFiles: TaskAttachment[] = files.map((file) => ({
            id: crypto.randomUUID(),
            name: file.name,
            url: URL.createObjectURL(file),
            size: formatFileSize(file.size),
            type: file.type || 'file',
        }));

        onAddAttachments(preparedFiles);
        event.target.value = '';
    };

    const handleAddImages = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? []);

        if (!files.length) return;

        const preparedImages: TaskImage[] = files.map((file) => ({
            id: crypto.randomUUID(),
            name: file.name,
            url: URL.createObjectURL(file),
            size: formatFileSize(file.size),
        }));

        onAddImages(preparedImages);
        event.target.value = '';
    };

    return (
        <>
            <div
                onClick={onClose}
                className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]"
            />

            <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[30rem] flex-col border-l border-slate-200 bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Детали задачи
                        </p>
                        <h2 className="mt-1 text-xl font-black text-slate-900">
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

                <div className="flex-1 space-y-6 overflow-y-auto p-5">
                    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Основная информация
                        </h3>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <InfoItem label="Цвет" value={task.color} />
                            <InfoItem label="Абатмент" value={task.abutment} />
                            <InfoItem label="Техник" value={task.technicianId} />
                            <InfoItem label="Оператор" value={task.operatorId} />
                        </div>
                    </section>

                    <TaskHistoryTimeline
                        taskId={task.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                    />

                    <section>
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Изображения
                            </h3>

                            <label className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-blue-700">
                                Добавить
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleAddImages}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {task.images?.length ? (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                {task.images.map((image) => (
                                    <a
                                        key={image.id}
                                        href={image.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                                    >
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="h-32 w-full object-cover"
                                        />
                                        <div className="border-t border-slate-200 bg-white p-2">
                                            <p className="truncate text-xs font-bold text-slate-700">
                                                {image.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {image.size}
                                            </p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <EmptyText text="Изображений пока нет" />
                        )}
                    </section>

                    <section>
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Прикрепленные файлы
                            </h3>

                            <label className="cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-slate-800">
                                Прикрепить
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleAddAttachments}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {task.attachments?.length ? (
                            <div className="mt-3 space-y-2">
                                {task.attachments.map((file) => (
                                    <a
                                        key={file.id}
                                        href={file.url}
                                        download={file.name}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-800">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {file.size}
                                            </p>
                                        </div>

                                        <span className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-black uppercase text-white">
                                            Скачать
                                        </span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <EmptyText text="Файлов пока нет" />
                        )}
                    </section>

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
