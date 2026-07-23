'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import type { RootState } from '@/src/lib/store';

type ActionIconName = 'menu' | 'close' | 'chat' | 'note';

function ActionIcon({ name }: { name: ActionIconName }) {
    const paths = {
        menu: (
            <>
                <path d="M5 7h14M5 12h14M5 17h14" />
            </>
        ),
        close: <path d="m18 6-12 12M6 6l12 12" />,
        chat: (
            <>
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.6-4.8A8 8 0 1 1 21 15Z" />
                <path d="M8 11h.01M12 11h.01M16 11h.01" />
            </>
        ),
        note: (
            <>
                <path d="M6 3h9l4 4v14H6z" />
                <path d="M15 3v5h4M9 12h6M9 16h6" />
            </>
        ),
    };

    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
        >
            {paths[name]}
        </svg>
    );
}

export default function QuickActionsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const totalUnreadCount = useSelector(
        (state: RootState) => state.chat.totalUnreadCount
    );

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, []);

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

    return (
        <div className="fixed bottom-5 right-4 z-[90] sm:right-6">
            {isOpen ? (
                <div className="absolute bottom-[4.5rem] right-0 flex flex-col items-end gap-2">
                    <button
                        type="button"
                        onClick={openChat}
                        className="group flex h-12 items-center gap-3 rounded-2xl border border-violet-200 bg-white pl-4 pr-3 text-sm font-black text-slate-700 shadow-xl transition hover:-translate-y-0.5 hover:border-violet-300 dark:border-violet-500/30 dark:bg-slate-900 dark:text-white"
                    >
                        <span>Чат</span>
                        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
                            <ActionIcon name="chat" />
                            {totalUnreadCount > 0 ? (
                                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] text-white dark:border-slate-900">
                                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                                </span>
                            ) : null}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={openNotes}
                        className="flex h-12 items-center gap-3 rounded-2xl border border-amber-200 bg-white pl-4 pr-3 text-sm font-black text-slate-700 shadow-xl transition hover:-translate-y-0.5 hover:border-amber-300 dark:border-amber-500/30 dark:bg-slate-900 dark:text-white"
                    >
                        <span>Заметки</span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                            <ActionIcon name="note" />
                        </span>
                    </button>
                </div>
            ) : null}

            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                aria-label={isOpen ? 'Закрыть быстрые действия' : 'Открыть быстрые действия'}
                aria-expanded={isOpen}
                className="relative flex h-15 w-15 items-center justify-center rounded-[22px] bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-[0_16px_35px_-10px_rgba(15,23,42,.7)] transition hover:-translate-y-1 hover:scale-105 dark:from-violet-600 dark:to-indigo-600"
            >
                <ActionIcon name={isOpen ? 'close' : 'menu'} />
                {!isOpen && totalUnreadCount > 0 ? (
                    <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-black dark:border-slate-900">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                    </span>
                ) : null}
            </button>
        </div>
    );
}
