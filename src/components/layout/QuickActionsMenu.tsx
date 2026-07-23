'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from '@/src/lib/store';

function ActionIcon({ name }: { name: 'launcher' | 'close' | 'chat' | 'note' }) {
    const paths = {
        launcher: <><circle cx="7" cy="7" r="1.5" /><circle cx="17" cy="7" r="1.5" /><circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" /></>,
        close: <path d="m18 6-12 12M6 6l12 12" />,
        chat: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.6-4.8A8 8 0 1 1 21 15Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></>,
        note: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v5h4M9 12h6M9 16h6" /></>,
    };

    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            {paths[name]}
        </svg>
    );
}

export default function QuickActionsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const totalUnreadCount = useSelector(
        (state: RootState) => state.chat.totalUnreadCount
    );

    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const openChat = () => {
        window.dispatchEvent(new Event('teethtech:request-close-notes'));
        window.dispatchEvent(new Event('teethtech:toggle-chat'));
        setIsOpen(false);
    };

    const openNotes = () => {
        window.dispatchEvent(new Event('teethtech:close-chat'));
        window.dispatchEvent(new Event('teethtech:open-notes'));
        setIsOpen(false);
    };

    const actionClass = 'group relative flex h-10 w-10 items-center justify-center rounded-xl border bg-white text-slate-500 shadow-sm transition duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:bg-slate-900';

    return (
        <div ref={containerRef} className="fixed bottom-5 right-4 z-[90] flex flex-col items-center gap-2 sm:right-6">
            <div
                aria-hidden={!isOpen}
                className={`grid transition-[grid-template-rows,opacity,transform] duration-200 ease-out ${
                    isOpen
                        ? 'grid-rows-[1fr] translate-y-0 opacity-100'
                        : 'pointer-events-none grid-rows-[0fr] translate-y-2 opacity-0'
                }`}
            >
                <div className="min-h-0 overflow-visible">
                    <div className="flex flex-col gap-1.5 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-lg backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/80">
                        <button
                            type="button"
                            onClick={openChat}
                            tabIndex={isOpen ? 0 : -1}
                            title="Быстрый чат"
                            aria-label={totalUnreadCount > 0 ? `Открыть чат, непрочитанных: ${totalUnreadCount}` : 'Открыть быстрый чат'}
                            className={`${actionClass} border-slate-200 hover:border-violet-200 hover:text-violet-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-violet-300`}
                        >
                            <ActionIcon name="chat" />
                            {totalUnreadCount > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black text-white dark:border-slate-900">
                                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                                </span>
                            )}
                            <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xl group-hover:block group-focus-visible:block">Быстрый чат</span>
                        </button>

                        <button
                            type="button"
                            onClick={openNotes}
                            tabIndex={isOpen ? 0 : -1}
                            title="Личные заметки"
                            aria-label="Открыть личные заметки"
                            className={`${actionClass} border-slate-200 hover:border-amber-200 hover:text-amber-600 dark:border-slate-700 dark:text-slate-400 dark:hover:text-amber-300`}
                        >
                            <ActionIcon name="note" />
                            <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xl group-hover:block group-focus-visible:block">Личные заметки</span>
                        </button>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-label={isOpen ? 'Закрыть быстрые инструменты' : 'Открыть чат и заметки'}
                aria-expanded={isOpen}
                title={isOpen ? 'Закрыть' : 'Чат и заметки'}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl border shadow-[0_8px_24px_-14px_rgba(15,23,42,.45)] backdrop-blur transition duration-200 hover:border-violet-200 hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${
                    isOpen
                        ? 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200'
                        : 'border-slate-200/90 bg-white/90 text-slate-500 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-400'
                }`}
            >
                <span className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                    <ActionIcon name={isOpen ? 'close' : 'launcher'} />
                </span>
                {!isOpen && totalUnreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black text-white dark:border-slate-900">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                )}
                {!isOpen && <span className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xl group-hover:block group-focus-visible:block">Чат и заметки</span>}
            </button>
        </div>
    );
}
