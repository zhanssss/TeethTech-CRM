'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';

import {mockPatients} from '@/src/mock/patients.mock';
import type {PatientStatus} from '@/src/types/patient.type';

const statusLabels: Record<PatientStatus, string> = {
    ACTIVE: 'Активен',
    ARCHIVED: 'В архиве',
};

const statusClasses: Record<PatientStatus, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    ARCHIVED: 'bg-slate-100 text-slate-600',
};

function formatDate(value?: string) {
    if (!value) return '-';

    return new Intl.DateTimeFormat('ru-RU').format(new Date(value));
}

export default function ClinicPatientsPage() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'ALL' | PatientStatus>('ALL');

    const filteredPatients = useMemo(() => {
        const searchValue = search.trim().toLowerCase();

        return mockPatients.filter((patient) => {
            const matchesStatus = status === 'ALL' || patient.status === status;
            const matchesSearch =
                !searchValue ||
                patient.fullName.toLowerCase().includes(searchValue) ||
                patient.clinicName.toLowerCase().includes(searchValue) ||
                patient.doctorName.toLowerCase().includes(searchValue) ||
                patient.phone?.toLowerCase().includes(searchValue);

            return matchesStatus && matchesSearch;
        });
    }, [search, status]);

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <Link
                        href="/clinics"
                        className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
                    >
                        ← Реестр клиник
                    </Link>

                    <h1 className="text-2xl font-bold text-slate-900">Пациенты</h1>
                    <p className="text-sm text-slate-500">
                        Общий список пациентов по клиникам и лечащим врачам
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                    <span className="font-bold text-slate-900">{filteredPatients.length}</span>
                    <span className="ml-1 text-slate-500">в реестре</span>
                </div>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Поиск: пациент, клиника, врач, телефон"
                        className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white md:max-w-md"
                    />

                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as 'ALL' | PatientStatus)}
                        className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white md:w-56"
                    >
                        <option value="ALL">Все статусы</option>
                        <option value="ACTIVE">Активные</option>
                        <option value="ARCHIVED">В архиве</option>
                    </select>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Реестр пациентов
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left lg:min-w-[900px]">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[.7rem] uppercase tracking-widest text-slate-400">
                        <tr>
                            <th className="p-4 font-bold">Пациент</th>
                            <th className="p-4 font-bold">Телефон</th>
                            <th className="p-4 font-bold">Клиника</th>
                            <th className="p-4 font-bold">Врач</th>
                            <th className="p-4 font-bold">Дата рождения</th>
                            <th className="p-4 font-bold">Заказы</th>
                            <th className="p-4 font-bold">Файлы</th>
                            <th className="p-4 font-bold">Статус</th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                        {filteredPatients.length === 0 && (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-sm text-slate-400">
                                    Пациенты не найдены
                                </td>
                            </tr>
                        )}

                        {filteredPatients.map((patient) => (
                            <tr key={patient.id} className="transition hover:bg-blue-50/30">
                                <td className="p-4 font-bold text-slate-800">
                                    {patient.fullName}
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                    {patient.phone ?? '-'}
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                    {patient.clinicName}
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                    {patient.doctorName}
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                    {formatDate(patient.birthDate)}
                                </td>
                                <td className="p-4 text-sm font-bold text-slate-700">
                                    {patient.orders.length}
                                </td>
                                <td className="p-4 text-sm font-bold text-slate-700">
                                    {patient.files.length}
                                </td>
                                <td className="p-4">
                                    <span className={`${statusClasses[patient.status]} rounded-lg px-2 py-1 text-[10px] font-bold uppercase`}>
                                        {statusLabels[patient.status]}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
