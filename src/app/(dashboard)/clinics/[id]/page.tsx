'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import EditClinicModal from '@/src/components/Modals/CreateClinicEditModal';
import type { ClinicDetails } from '@/src/types/clinic.types';

const mockClinics: ClinicDetails[] = [
    {
        id: '1',
        name: 'Клиника 1',
        address: 'г. Астана, ул. Кабанбай батыра 10',
        phone: '+7 777 000 00 00',
        email: 'clinic@mail.com',
        contactPerson: 'Администратор Айжан',
        discount: 10,
        priceType: 'Индивидуальный прайс',
        comment: 'Постоянная клиника. Часто заказывает цирконий и E-max.',
        doctors: [
            {
                id: 'd1',
                name: 'Смирнов А.В.',
                phone: '+7 701 111 22 33',
                specialization: 'Ортопед',
            },
            {
                id: 'd2',
                name: 'Иванова М.К.',
                phone: '+7 702 444 55 66',
                specialization: 'Терапевт',
            },
        ],
        orders: [
            {
                id: '101',
                patient: 'Алиев К.',
                workType: 'Коронка цирконий',
                status: 'В работе',
                total: 25000,
                paid: 0,
            },
        ],
    },
];

export default function ClinicDetailsPage() {
    const { id } = useParams();

    const [clinic, setClinic] = useState(() =>
        mockClinics.find((item) => item.id === id) || null
    );

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleUpdateClinic = (updatedClinic: ClinicDetails) => {
        setClinic(updatedClinic);
    };

    if (!clinic) {
        return (
            <div className="space-y-4">
                <Link
                    href="/clinics"
                    className="text-sm font-bold text-blue-600 hover:underline"
                >
                    ← Назад к клиникам
                </Link>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                    <h1 className="text-xl font-bold text-red-700">
                        Клиника не найдена
                    </h1>
                    <p className="mt-2 text-sm text-red-500">
                        Проверь ID клиники или данные в mockClinics.
                    </p>
                </div>
            </div>
        );
    }

    const totalOrdersSum = clinic.orders.reduce(
        (sum, order) => sum + order.total,
        0
    );

    const totalPaidSum = clinic.orders.reduce(
        (sum, order) => sum + order.paid,
        0
    );

    const debt = totalOrdersSum - totalPaidSum;

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <Link
                        href="/clinics"
                        className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline"
                    >
                        ← Реестр клиник
                    </Link>

                    <h1 className="text-3xl font-black text-slate-900">
                        {clinic.name}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Карточка клиники, контакты, врачи, заказы и финансовая информация
                    </p>
                </div>

                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
                >
                    Редактировать данные
                </button>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-400">
                        Всего заказов
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                        {clinic.orders.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-400">
                        Общая сумма
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                        {totalOrdersSum.toLocaleString('ru-RU')} ₸
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-400">
                        Оплачено
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-600">
                        {totalPaidSum.toLocaleString('ru-RU')} ₸
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase text-slate-400">
                        Долг
                    </p>
                    <p className="mt-2 text-2xl font-black text-red-600">
                        {debt.toLocaleString('ru-RU')} ₸
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                    <h2 className="text-lg font-bold text-slate-900">
                        Основные данные
                    </h2>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <InfoItem label="Название" value={clinic.name} />
                        <InfoItem label="Контактное лицо" value={clinic.contactPerson} />
                        <InfoItem label="Телефон" value={clinic.phone} />
                        <InfoItem label="Email" value={clinic.email} />
                        <InfoItem label="Адрес" value={clinic.address} />
                        <InfoItem label="Тип прайса" value={clinic.priceType} />
                        <InfoItem label="Скидка" value={`${clinic.discount}%`} />
                    </div>
                </section>

                {/*<section className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">*/}
                {/*    <h2 className="text-lg font-bold">Комментарий</h2>*/}

                {/*    <p className="mt-4 text-sm leading-6 text-slate-300">*/}
                {/*        {clinic.comment}*/}
                {/*    </p>*/}
                {/*</section>*/}
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Врачи клиники
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                    {clinic.doctors.map((doctor) => (
                        <div
                            key={doctor.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                            <p className="font-bold text-slate-900">
                                {doctor.name}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {doctor.specialization}
                            </p>

                            <p className="mt-3 text-sm font-semibold text-blue-600">
                                {doctor.phone}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Заказы клиники
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] border-collapse text-left">
                        <thead className="border-b border-slate-200 bg-slate-50 text-[.7rem] uppercase tracking-widest text-slate-400">
                        <tr>
                            <th className="p-4 font-bold">ID</th>
                            <th className="p-4 font-bold">Пациент</th>
                            <th className="p-4 font-bold">Вид работы</th>
                            <th className="p-4 font-bold">Статус</th>
                            <th className="p-4 font-bold">Сумма</th>
                            <th className="p-4 font-bold">Оплачено</th>
                            <th className="p-4 font-bold text-right">Действие</th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                        {clinic.orders.map((order) => (
                            <tr
                                key={order.id}
                                className="transition hover:bg-blue-50/30"
                            >
                                <td className="p-4 font-mono text-sm text-slate-400">
                                    #{order.id}
                                </td>

                                <td className="p-4 font-bold text-slate-800">
                                    {order.patient}
                                </td>

                                <td className="p-4 text-sm text-slate-600">
                                    {order.workType}
                                </td>

                                <td className="p-4">
                                        <span className="rounded-lg bg-yellow-100 px-2 py-1 text-[10px] font-bold uppercase text-yellow-700">
                                            {order.status}
                                        </span>
                                </td>

                                <td className="p-4 text-sm font-bold text-slate-700">
                                    {order.total.toLocaleString('ru-RU')} ₸
                                </td>

                                <td className="p-4 text-sm font-bold text-green-600">
                                    {order.paid.toLocaleString('ru-RU')} ₸
                                </td>

                                <td className="p-4 text-right">
                                    <Link
                                        href={`/orders/${order.id}`}
                                        className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white"
                                    >
                                        Открыть заказ
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>
            <EditClinicModal
                isOpen={isEditModalOpen}
                clinic={clinic}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdateClinic}
            />
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
                {value}
            </p>
        </div>
    );
}
