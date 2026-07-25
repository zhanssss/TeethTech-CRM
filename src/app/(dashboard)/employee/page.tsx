'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import EmployeeMiniCalendar from '@/src/components/employee/EmployeeMiniCalendar';
import EmployeeTasksKanban from '@/src/components/employee/EmployeeTasksKanban';
import type { RootState } from '@/src/lib/store';

export default function EmployeePage() {
    const { name } = useSelector((state: RootState) => state.auth);

    const today = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
    return <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-10">
        <header className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"><div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-violet-100 blur-3xl dark:bg-violet-600/10"/><div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-600">{today}</p><h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white sm:text-4xl">Рабочая зона</h1><p className="mt-2 text-sm text-slate-500">{name}, здесь собраны ваши ближайшие задачи, этапы и расписание.</p></div><div className="flex gap-2"><Link href="/employee/calendar" className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs font-black text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">Большой календарь</Link><Link href="/settings" className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white dark:bg-violet-600">Личный кабинет</Link></div></div></header>
        <EmployeeMiniCalendar />
        <EmployeeTasksKanban />
    </div>;
}
