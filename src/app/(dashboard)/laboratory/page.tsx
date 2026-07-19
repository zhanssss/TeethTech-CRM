'use client';

import Link from 'next/link';
import { useGetColorsQuery } from '@/src/services/api/laboratory/colorsApi';
import { useGetWorkTypesQuery } from '@/src/services/api/laboratory/workTypesApi';
import { useGetUsersQuery } from '@/src/services/api/usersApi';

const modules = [
    { title: 'Сотрудники', description: 'Команда, роли, специализации и загрузка', href: '/laboratory/employees', icon: '👥', tone: 'from-violet-600 to-purple-500' },
    { title: 'Цвета', description: 'Справочник оттенков для лабораторных работ', href: '/laboratory/colors', icon: '◉', tone: 'from-fuchsia-600 to-pink-500' },
    { title: 'Типы работ', description: 'Каталог выполняемых лабораторных работ', href: '/laboratory/work-types', icon: '◇', tone: 'from-blue-600 to-cyan-500' },
    { title: 'Workflow', description: 'Этапы производства и маршруты задач', href: '/laboratory/workflows', icon: '⌁', tone: 'from-emerald-600 to-teal-500' },
];

export default function LaboratoryPage() {
    const usersQuery = useGetUsersQuery();
    const colorsQuery = useGetColorsQuery(false);
    const workTypesQuery = useGetWorkTypesQuery();
    const users = usersQuery.data ?? [];
    const colors = colorsQuery.data ?? [];
    const workTypes = workTypesQuery.data ?? [];
    const activeUsers = users.filter((user) => user.status?.toUpperCase() === 'ACTIVE').length;
    const tasksInProgress = users.reduce((sum, user) => sum + (user.stats?.inProgress ?? 0), 0);
    const overdueTasks = users.reduce((sum, user) => sum + (user.stats?.overdue ?? 0), 0);

    return (
        <div className="space-y-5">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    ['Сотрудники', users.length, `${activeUsers} активных`, 'bg-violet-500'],
                    ['Задачи в работе', tasksInProgress, 'по всей команде', 'bg-blue-500'],
                    ['Просрочено', overdueTasks, 'требуют внимания', 'bg-red-500'],
                    ['Типы работ', workTypes.length, `${colors.length} цветов в справочнике`, 'bg-fuchsia-500'],
                ].map(([label, value, note, color]) => <article key={String(label)} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><span className={`h-2.5 w-2.5 rounded-full ${color}`} /></div><p className="mt-5 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-2 text-[11px] text-slate-400">{note}</p></article>)}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div><h1 className="text-xl font-black text-slate-950">Управление лабораторией</h1><p className="mt-1 text-sm text-slate-500">Выберите рабочий раздел — вся навигация также доступна в боковом меню.</p></div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {modules.map((module) => <Link key={module.href} href={module.href} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-violet-300 hover:bg-white hover:shadow-xl hover:shadow-violet-950/10"><span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-xl text-white shadow-md ${module.tone}`}>{module.icon}</span><h2 className="mt-5 text-base font-black text-slate-900 group-hover:text-violet-700">{module.title}</h2><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{module.description}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-violet-600">Открыть раздел <span className="transition-transform group-hover:translate-x-1">→</span></span></Link>)}
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold text-slate-900">Загрузка команды</h2><p className="mt-1 text-xs text-slate-400">Активные задачи сотрудников</p></div><Link href="/laboratory/employees" className="text-xs font-bold text-violet-600">Все сотрудники →</Link></div><div className="mt-5 max-h-80 space-y-3 overflow-y-auto pr-1 [scrollbar-color:#8b5cf6_transparent]">{users.slice(0, 8).map((user) => { const load = (user.stats?.inProgress ?? 0) + (user.stats?.overdue ?? 0); const max = Math.max(1, ...users.map((item) => (item.stats?.inProgress ?? 0) + (item.stats?.overdue ?? 0))); return <div key={user.id} className="grid grid-cols-[minmax(110px,180px)_minmax(0,1fr)_32px] items-center gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-700">{user.fullName || user.name}</p><p className="text-[9px] text-slate-400">{user.specialization || user.role || 'Сотрудник'}</p></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${user.stats?.overdue ? 'bg-gradient-to-r from-violet-600 to-red-400' : 'bg-gradient-to-r from-violet-600 to-fuchsia-400'}`} style={{width: `${load / max * 100}%`}} /></div><span className="text-right text-xs font-black text-slate-700">{load}</span></div>;})}{!usersQuery.isLoading && users.length === 0 && <p className="py-12 text-center text-sm text-slate-400">Сотрудников пока нет</p>}</div></div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold text-slate-900">Готовность справочников</h2><p className="mt-1 text-xs text-slate-400">Данные для создания заказов</p><div className="mt-6 space-y-4">{[['Цвета', colors.length, '/laboratory/colors'], ['Типы работ', workTypes.length, '/laboratory/work-types']].map(([label, count, href]) => <Link key={String(label)} href={String(href)} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50"><span className="text-xs font-semibold text-slate-600">{label}</span><span className="rounded-lg bg-violet-50 px-2.5 py-1 text-sm font-black text-violet-700">{count}</span></Link>)}</div></div>
            </section>
        </div>
    );
}
