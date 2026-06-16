'use client';

import {useMemo, useState} from 'react';
import Section from '@/src/components/ui/Section';
import CreateClinicModal from '@/src/components/Modals/CreateClinicModal';
import Link from 'next/link';
import ErrorModal from '@/src/components/ui/ErrorModal';
import {useGetClinicsQuery} from "@/src/services/api/clinicsApi";

type ClinicTableRow = {
    id: string | number;
    name: string;
    address: string;
    phone: string;
    ordersCount: number;
    activeOrders: number;
    completedOrders: number;
};

export default function ClinicsPage() {

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [sort, setSort] = useState('name,ASC');

    const {data, isLoading, isError} = useGetClinicsQuery({
        page,
        size,
        sort
    });


    const clinics = useMemo<ClinicTableRow[]>(() => {
        const apiClinics = data?.content.map((clinic) => ({
            id: clinic.id,
            name: clinic.name,
            address: clinic.address,
            phone: clinic.phone,
            ordersCount: clinic.totalOrders,
            activeOrders: clinic.activeOrders,
            completedOrders: clinic.completedOrders,
        })) ?? [];

        return apiClinics;

    }, [ data]);

    if (isLoading) return <p>Загрузка...</p>
    if (isError) {
        return (
            <ErrorModal isDismissible={false}>
                Ошибка в загрузке клиник...
            </ErrorModal>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Клиники</h1>
                    <p className="text-sm text-slate-500">
                        Добавьте, редактируйте и просматривайте данные по клиникам
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 md:w-auto"
                >
                    + Добавить клинику
                </button>
            </header>

            <Section style="py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-5">
                    <input
                        type="text"
                        placeholder="Название клиники"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white sm:max-w-sm"
                    />

                    <select
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-1 text-sm outline-none transition focus:border-blue-500 focus:bg-white sm:w-56">
                        <option value="ordersCount">По кол-ву заказов</option>
                    </select>
                </div>
            </Section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Реестр клиник
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left lg:min-w-[900px]">
                        <thead
                            className="border-b border-slate-200 bg-slate-50 text-[.7rem] uppercase tracking-widest text-slate-400">
                        <tr>
                            <th className="p-4 font-bold">Название</th>
                            <th className="p-4 font-bold">Адрес</th>
                            <th className="p-4 font-bold">Телефон</th>
                            <th className="p-4 font-bold">Кол-во заказов</th>
                            <th className="p-4 font-bold">Активные заказы</th>
                            <th className="p-4 font-bold">Завершенные заказы</th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                        {clinics.map((clinic) => (
                            <tr
                                key={clinic.id}
                                className="transition hover:bg-blue-50/30"
                            >
                                <td className="p-4 font-bold text-slate-800">
                                    <Link
                                        href={`/clinics/${clinic.id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {clinic.name}
                                    </Link>
                                </td>
                                <td className="p-4">{clinic.address}</td>
                                <td className="p-4">{clinic.phone}</td>
                                <td className="p-4">{clinic.ordersCount}</td>
                                <td className="p-4">{clinic.activeOrders}</td>
                                <td className="p-4">{clinic.completedOrders}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <CreateClinicModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
