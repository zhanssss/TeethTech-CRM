'use client';

import Link from 'next/link';
import {useParams} from 'next/navigation';

import {useAppFormatters} from '@/src/i18n/provider';
import {mockPatients} from '@/src/mock/patients.mock';
import type {PatientFile} from '@/src/types/patient.type';

type TimelineItem = {
    id: string;
    date: string;
    title: string;
    description: string;
    tone: 'violet' | 'blue' | 'emerald' | 'amber';
};

const fileTypeConfig: Record<PatientFile['type'], {label: string; icon: string; className: string}> = {
    FILE: {label: 'Документ', icon: 'PDF', className: 'bg-rose-50 text-rose-700 ring-rose-100'},
    IMAGE: {label: 'Изображение', icon: 'IMG', className: 'bg-sky-50 text-sky-700 ring-sky-100'},
    VIDEO: {label: 'Видео', icon: 'VID', className: 'bg-violet-50 text-violet-700 ring-violet-100'},
};

const timelineToneClasses: Record<TimelineItem['tone'], string> = {
    violet: 'border-violet-200 bg-violet-500 ring-violet-100',
    blue: 'border-blue-200 bg-blue-500 ring-blue-100',
    emerald: 'border-emerald-200 bg-emerald-500 ring-emerald-100',
    amber: 'border-amber-200 bg-amber-500 ring-amber-100',
};

function getInitials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toLocaleUpperCase();
}

function getTimeline(patient: typeof mockPatients[number]): TimelineItem[] {
    const orderItems = patient.orders.map((order, index) => ({
        id: `order-${order.id}`,
        date: order.createdAt,
        title: index === 0 ? 'Создан новый заказ' : 'Заказ добавлен в карточку',
        description: `${order.orderNumber} · ${order.workType}`,
        tone: index === 0 ? 'violet' : 'blue',
    } satisfies TimelineItem));
    const fileItems = patient.files.map((file) => ({
        id: `file-${file.id}`,
        date: file.createdAt,
        title: 'Файл добавлен в хранилище',
        description: file.name,
        tone: 'emerald',
    } satisfies TimelineItem));
    const noteItems = patient.notes.map((note) => ({
        id: `note-${note.id}`,
        date: note.createdAt,
        title: note.title,
        description: note.description,
        tone: 'amber',
    } satisfies TimelineItem));

    return [...orderItems, ...fileItems, ...noteItems]
        .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
}

export default function PatientDetailsPage() {
    const params = useParams<{id: string | string[]}>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const patient = mockPatients.find((item) => item.id === id);
    const {date: formatDate} = useAppFormatters();

    if (!patient) {
        return (
            <div className="mx-auto max-w-3xl py-12 text-center">
                <p className="text-sm font-bold text-slate-900">Карточка пациента не найдена</p>
                <p className="mt-2 text-sm text-slate-500">Проверьте ссылку или вернитесь к реестру пациентов.</p>
                <Link href="/clinics/patients" className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700">
                    К реестру пациентов
                </Link>
            </div>
        );
    }

    const timeline = getTimeline(patient);
    const latestActivityDate = timeline[0]?.date;
    const statusClass = patient.status === 'ACTIVE'
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
        : 'bg-slate-100 text-slate-600 ring-slate-200';

    return (
        <div className="mx-auto max-w-[1440px] space-y-5 pb-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <Link href="/clinics/patients" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-violet-600 hover:underline">
                        ← Реестр пациентов
                    </Link>
                    <div className="mt-3 flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-black text-white shadow-lg shadow-violet-500/20">
                            {getInitials(patient.fullName)}
                        </span>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{patient.fullName}</h1>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ring-1 ${statusClass}`}>
                                    {patient.status === 'ACTIVE' ? 'Активен' : 'В архиве'}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">Карточка пациента · ID {patient.id}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Последняя активность</p>
                    <p className="mt-1 text-sm font-black text-violet-900">{latestActivityDate ? formatDate(latestActivityDate) : 'Нет записей'}</p>
                </div>
            </header>

            <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500" />
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(310px,.75fr)] lg:p-6">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Профиль пациента</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <InfoCard label="Клиника" value={patient.clinicName} icon="clinic" />
                            <InfoCard label="Лечащий врач" value={patient.doctorName} icon="doctor" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                        <Metric value={patient.orders.length} label="заказа" tone="violet" />
                        <Metric value={patient.files.length} label="файлов" tone="blue" />
                        <Metric value={patient.notes.length} label="заметок" tone="amber" />
                    </div>
                </div>
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.22fr)_minmax(360px,.78fr)]">
                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-black text-slate-900">Журнал пациента</p>
                            <p className="mt-1 text-xs text-slate-400">События отображаются с датой; редактирование и история будут подключены позже.</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">UI</span>
                    </div>

                    {timeline.length ? (
                        <div className="relative mt-6 space-y-5 before:absolute before:bottom-4 before:left-[5.4rem] before:top-4 before:w-px before:bg-slate-200 sm:before:left-[6.5rem]">
                            {timeline.map((item) => (
                                <article key={item.id} className="relative grid grid-cols-[4.4rem_1rem_minmax(0,1fr)] gap-3 sm:grid-cols-[5.5rem_1rem_minmax(0,1fr)]">
                                    <time dateTime={item.date} className="pt-0.5 text-right text-[11px] font-bold text-slate-400">
                                        {formatDate(item.date, {day: '2-digit', month: 'short', year: 'numeric'})}
                                    </time>
                                    <span className={`relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full border-2 ring-4 ${timelineToneClasses[item.tone]}`} />
                                    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-violet-200 hover:shadow-sm">
                                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="В журнале пока нет событий." />
                    )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-black text-slate-900">Хранилище файлов</p>
                                <p className="mt-1 text-xs text-slate-400">Файлы, прикреплённые к карточке пациента</p>
                            </div>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5"><path d="M3.5 7.5h5l1.8 2H20a1 1 0 0 1 1 1v7.8a1.7 1.7 0 0 1-1.7 1.7H4.7A1.7 1.7 0 0 1 3 18.3V9.2a1.7 1.7 0 0 1 .5-1.2Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                        </div>
                        <p className="mt-4 truncate rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[10px] text-slate-500" title={`Пациенты / ${patient.fullName} / Материалы`}>
                            Пациенты / {patient.fullName} / Материалы
                        </p>
                    </div>

                    <div className="space-y-2 p-4 sm:p-5">
                        {patient.files.length ? patient.files.map((file) => {
                            const config = fileTypeConfig[file.type];
                            return (
                                <article key={file.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-violet-200 hover:bg-violet-50/30">
                                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[9px] font-black ring-1 ${config.className}`}>{config.icon}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-bold text-slate-800" title={file.name}>{file.name}</p>
                                        <p className="mt-1 text-[10px] text-slate-400">{config.label} · {formatDate(file.createdAt)}</p>
                                    </div>
                                </article>
                            );
                        }) : <EmptyState text="Файлы ещё не добавлены." />}
                    </div>

                    <div className="border-t border-dashed border-slate-200 px-5 py-3 text-[11px] text-slate-400 sm:px-6">
                        Загрузка, предпросмотр и права доступа появятся после подключения логики.
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <p className="text-sm font-black text-slate-900">Связанные заказы</p>
                        <p className="mt-1 text-xs text-slate-400">Заказы пациента в текущей карточке</p>
                    </div>
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">{patient.orders.length} шт.</span>
                </div>
                {patient.orders.length ? (
                    <div className="divide-y divide-slate-100">
                        {patient.orders.map((order) => (
                            <article key={order.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6">
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-900">{order.orderNumber}</p>
                                    <p className="mt-1 truncate text-xs text-slate-500">{order.workType}</p>
                                </div>
                                <div className="text-xs text-slate-500"><span className="text-slate-400">Создан: </span>{formatDate(order.createdAt)}</div>
                                <span className="justify-self-start rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 sm:justify-self-end">{order.status}</span>
                            </article>
                        ))}
                    </div>
                ) : <div className="p-5"><EmptyState text="Связанных заказов пока нет." /></div>}
            </section>
        </div>
    );
}

function InfoCard({label, value, icon}: {label: string; value: string; icon: 'clinic' | 'doctor'}) {
    const icons = {
        clinic: <><path d="M4 20V6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5V20" /><path d="M8 20v-4h8v4M8 9h2m4 0h2m-8 3h2m4 0h2" /></>,
        doctor: <><circle cx="12" cy="7" r="3" /><path d="M5 20a7 7 0 0 1 14 0M19 6l1 1.5L22 8l-2 1-1 2-1-2-2-1 2-.5L19 6Z" /></>,
    };

    return (
        <div className="flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm ring-1 ring-slate-100">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4" strokeLinecap="round" strokeLinejoin="round">{icons[icon]}</svg>
            </span>
            <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-bold text-slate-800" title={value}>{value}</p></div>
        </div>
    );
}

function Metric({value, label, tone}: {value: number; label: string; tone: 'violet' | 'blue' | 'amber'}) {
    const tones = {
        violet: 'bg-violet-50 text-violet-800',
        blue: 'bg-blue-50 text-blue-800',
        amber: 'bg-amber-50 text-amber-800',
    };

    return <div className={`flex min-w-0 flex-col justify-between rounded-xl p-3 ${tones[tone]}`}><p className="text-xl font-black">{value}</p><p className="mt-2 text-[10px] font-bold opacity-70">{label}</p></div>;
}

function EmptyState({text}: {text: string}) {
    return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs font-medium text-slate-400">{text}</div>;
}
