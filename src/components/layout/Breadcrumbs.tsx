'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const segmentLabels: Record<string, string> = {
    orders: 'Заказы',
    analytics: 'Аналитика',
    warehouse: 'Склад',
    clinics: 'Клиники',
    patients: 'Пациенты',
    laboratory: 'Лаборатория',
    employees: 'Сотрудники',
    employee: 'Рабочая зона',
    calendar: 'Календарь',
    accounting: 'Финансы',
    payroll: 'Зарплатные планы',
    invoices: 'Счета',
    documents: 'Документы',
    'completed-work-acts': 'Акты выполненных работ',
    settings: 'Личный кабинет',
    integrations: 'Интеграции',
    chats: 'Сообщения',
    tasks: 'Задачи',
    notes: 'Заметки',
    'work-types': 'Типы работ',
    roles: 'Роли',
    colors: 'Цвета',
    'knowledge-base': 'База знаний',
    'tv-dashboard': 'ТВ-экран',
};

const warehouseTabLabels: Record<string, string> = {
    overview: 'Обзор',
    procurement: 'Закупки',
    nomenclature: 'Номенклатура',
    inventory: 'Инвентаризация',
};

function humanizeSegment(segment: string, previousSegment?: string) {
    if (segmentLabels[segment]) return segmentLabels[segment];
    if (previousSegment === 'orders') return 'Карточка заказа';
    if (previousSegment === 'employees') return 'Карточка сотрудника';
    if (previousSegment === 'chats') return 'Диалог';

    const decoded = decodeURIComponent(segment);
    if (/^[0-9a-f-]{16,}$/iu.test(decoded)) return 'Подробнее';

    return decoded
        .replace(/[-_]+/gu, ' ')
        .replace(/^./u, (letter) => letter.toLocaleUpperCase('ru-RU'));
}

export default function Breadcrumbs() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const segments = pathname.split('/').filter(Boolean);
    const crumbs = [
        { label: 'Главная', href: '/' },
        ...segments.map((segment, index) => ({
            label: humanizeSegment(segment, segments[index - 1]),
            href: `/${segments.slice(0, index + 1).join('/')}`,
        })),
    ];

    if (pathname === '/warehouse') {
        const tab = searchParams.get('tab') || 'overview';
        if (tab !== 'overview' && warehouseTabLabels[tab]) {
            crumbs.push({
                label: warehouseTabLabels[tab],
                href: `/warehouse?tab=${tab}`,
            });
        }
    }

    return (
        <nav
            aria-label="Навигационный путь"
            className="relative z-30 flex h-10 shrink-0 items-center border-b border-slate-200/80 bg-[var(--app-background)] px-4 dark:border-slate-800 sm:px-6 lg:px-8"
        >
            <ol className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
                {crumbs.map((crumb, index) => {
                    const isCurrent = index === crumbs.length - 1;

                    return (
                        <li key={`${crumb.href}-${index}`} className="flex min-w-0 items-center gap-1.5">
                            {index > 0 && (
                                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden="true">
                                    <path d="m7 4 6 6-6 6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            {isCurrent ? (
                                <span aria-current="page" className="max-w-52 truncate rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link href={crumb.href} className="max-w-44 truncate rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
                                    {index === 0 ? (
                                        <span className="flex items-center gap-1.5">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                                                <path d="m3 11 9-8 9 8v10h-6v-6H9v6H3V11Z" strokeWidth="1.8" strokeLinejoin="round" />
                                            </svg>
                                            {crumb.label}
                                        </span>
                                    ) : crumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
