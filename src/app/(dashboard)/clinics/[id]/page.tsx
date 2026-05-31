'use client';

import {useParams} from 'next/navigation';
import Link from 'next/link';
import {useState} from 'react';
import EditClinicModal from '@/src/components/Modals/EditClinicModal';
import {useGetClinicsByIdQuery} from '@/src/services/api/clinicsApi';
import InfoItem from '@/src/components/ui/InfoItem'
import DeleteClinicApproval from "@/src/components/Modals/DeleteClinicApproval";
import ErrorModal from '@/src/components/ui/ErrorModal';

type ClinicPageProps = {
    params: Promise<{
        id: string;
    }>;
};


export default function ClinicDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

    const {
        data: clinic,
        isLoading,
        isError,

    } = useGetClinicsByIdQuery(id);

    if (isLoading) return <p>Загрузка клиники...</p>;
    if (isError) {
        return (
            <ErrorModal isDismissible={false}>
                Ошибка загрузки клиники
            </ErrorModal>
        );
    }


    if (!clinic) {
        return (
            <ErrorModal title="Клиника не найдена" isDismissible={false}>
                <div className="space-y-4">
                    <p>Проверь ID клиники или данные в mockClinics.</p>
                    <Link
                        href="/clinics"
                        className="text-sm font-bold text-blue-600 hover:underline"
                    >
                        ← Назад к клиникам
                    </Link>
                </div>
            </ErrorModal>
        );
    }

    const totalOrdersSum = clinic.orders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
    );

    const totalPaidSum = clinic.orders.reduce(
        (sum, order) => sum + order.paidAmount,
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
            <div className="flex gap-3">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
                    >
                        Редактировать данные
                    </button>
                    <button
                        onClick={() => setIsApproveModalOpen(true)}
                        className="rounded-xl bg-red-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-500 active:scale-95"
                    >
                        Удалить клинику
                    </button>
                </div>
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
                        <InfoItem label="Название" value={clinic.name}/>
                        <InfoItem label="Контактное лицо" value={clinic.contactPerson}/>
                        <InfoItem label="Телефон" value={clinic.phone}/>
                        <InfoItem label="Email" value={clinic.email}/>
                        <InfoItem label="Адрес" value={clinic.address}/>
                        <InfoItem label="Тип прайса" value={clinic.priceType}/>
                    </div>
                </section>
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
                            key={doctor.fullName}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                            <p className="font-bold text-slate-900">
                                {doctor.fullName}
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
                        <thead
                            className="border-b border-slate-200 bg-slate-50 text-[.7rem] uppercase tracking-widest text-slate-400">
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
                                    {order.patientName}
                                </td>

                                <td className="p-4 text-sm text-slate-600">
                                    {order.summaryWork}
                                </td>

                                <td className="p-4">
                                        <span
                                            className="rounded-lg bg-yellow-100 px-2 py-1 text-[10px] font-bold uppercase text-yellow-700">
                                            {order.status}
                                        </span>
                                </td>

                                <td className="p-4 text-sm font-bold text-slate-700">
                                    {order.totalAmount.toLocaleString('ru-RU')} ₸
                                </td>

                                <td className="p-4 text-sm font-bold text-green-600">
                                    {order.paidAmount.toLocaleString('ru-RU')} ₸
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
            />

            <DeleteClinicApproval
                clinicId={id}
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
            />
        </div>
    );
}

