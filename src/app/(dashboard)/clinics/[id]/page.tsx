'use client';

import {useParams} from 'next/navigation';
import Link from 'next/link';
import {useState} from 'react';
import EditClinicModal from '@/src/components/Modals/EditClinicModal';
import {
    useGetClinicDoctorsQuery,
    useGetClinicOrdersQuery,
    useGetClinicPatientsQuery,
    useGetClinicsByIdQuery,
} from '@/src/services/api/clinicsApi';
import InfoItem from '@/src/components/ui/InfoItem'
import DeleteClinicApproval from "@/src/components/Modals/DeleteClinicApproval";
import ErrorState from '@/src/components/ui/ErrorState';
import QueryErrorNotice from '@/src/components/ui/QueryErrorNotice';

const DEFAULT_RELATED_PAGE_SIZE = 10;
const DOCTORS_SORT = 'fullName,ASC';
const ORDERS_SORT = 'createdAt,DESC';
const PATIENTS_SORT = 'fullName,ASC';

function formatMoney(value?: number) {
    return `${(value ?? 0).toLocaleString('ru-RU')} ₸`;
}

function getOrderStatusLabel(isActive: boolean) {
    return isActive ? 'Активен' : 'Закрыт';
}

function getOrderStatusClass(isActive: boolean) {
    return isActive
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-100 text-slate-600';
}

function RelatedPager({
                          pageInfo,
                          isLoading,
                          onPrevious,
                          onNext,
                      }: {
    pageInfo?: {
        number: number;
        totalPages?: number;
        first: boolean;
        last: boolean;
    };
    isLoading: boolean;
    onPrevious: () => void;
    onNext: () => void;
}) {
    return (
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <button
                type="button"
                disabled={isLoading || !pageInfo || pageInfo.first}
                onClick={onPrevious}
                className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Назад
            </button>
            <span className="min-w-20 text-center">
                Стр. {(pageInfo?.number ?? 0) + 1}
                {pageInfo?.totalPages ? ` из ${pageInfo.totalPages}` : ''}
            </span>
            <button
                type="button"
                disabled={isLoading || !pageInfo || pageInfo.last}
                onClick={onNext}
                className="rounded-lg border border-slate-200 px-3 py-1.5 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
                Вперёд
            </button>
        </div>
    );
}

export default function ClinicDetailsPage() {
    const params = useParams();
    const id = params.id as string;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [doctorsPage, setDoctorsPage] = useState(0);
    const [ordersPage, setOrdersPage] = useState(0);
    const [patientsPage, setPatientsPage] = useState(0);

    const {
        data: clinic,
        isLoading,
        isFetching,
        isError,
        refetch: refetchClinic,
    } = useGetClinicsByIdQuery(id);
    const {
        data: doctorsData,
        isFetching: isDoctorsLoading,
        isError: isDoctorsError,
        refetch: refetchDoctors,
    } = useGetClinicDoctorsQuery({
        id,
        page: doctorsPage,
        size: DEFAULT_RELATED_PAGE_SIZE,
        sort: DOCTORS_SORT,
    }, {skip: !id});
    const {
        data: ordersData,
        isFetching: isOrdersLoading,
        isError: isOrdersError,
        refetch: refetchOrders,
    } = useGetClinicOrdersQuery({
        id,
        page: ordersPage,
        size: DEFAULT_RELATED_PAGE_SIZE,
        sort: ORDERS_SORT,
    }, {skip: !id});
    const {
        data: patientsData,
        isFetching: isPatientsLoading,
        isError: isPatientsError,
        refetch: refetchPatients,
    } = useGetClinicPatientsQuery({
        id,
        page: patientsPage,
        size: DEFAULT_RELATED_PAGE_SIZE,
        sort: PATIENTS_SORT,
    }, {skip: !id});

    if (isLoading) return <p>Загрузка клиники...</p>;
    if (isError) {
        return (
            <ErrorState
                onRetry={() => void refetchClinic()}
                isRetrying={isFetching}
            >
                Ошибка загрузки клиники
            </ErrorState>
        );
    }


    if (!clinic) {
        return (
            <ErrorState title="Клиника не найдена">
                <div className="space-y-4">
                    <p>Проверь ID клиники или повтори попытку позже.</p>
                    <Link
                        href="/clinics"
                        className="text-sm font-bold text-blue-600 hover:underline"
                    >
                        ← Назад к клиникам
                    </Link>
                </div>
            </ErrorState>
        );
    }

    const doctors = doctorsData?.content ?? [];
    const clinicOrders = ordersData?.content ?? [];
    const patients = patientsData?.content ?? [];
    const totalOrdersCount = clinic.totalOrdersCount ?? ordersData?.numberOfElements ?? 0;
    const totalOrdersSum = clinic.totalAmount ?? 0;
    const totalPaidSum = clinic.totalPaid ?? 0;
    const debt = clinic.totalDebt ?? totalOrdersSum - totalPaidSum;

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
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95 sm:w-auto"
                    >
                        Редактировать данные
                    </button>
                    <button
                        onClick={() => setIsApproveModalOpen(true)}
                        className="w-full rounded-xl bg-red-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-500 active:scale-95 sm:w-auto"
                    >
                        Удалить клинику
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-bold uppercase text-slate-400">
                        Всего заказов
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">
                        {totalOrdersCount}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-bold uppercase text-slate-400">
                        Общая сумма
                    </p>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                        {formatMoney(totalOrdersSum)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-bold uppercase text-slate-400">
                        Оплачено
                    </p>
                    <p className="mt-2 text-2xl font-black text-green-600">
                        {formatMoney(totalPaidSum)}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-bold uppercase text-slate-400">
                        Долг
                    </p>
                    <p className="mt-2 text-2xl font-black text-red-600">
                        {formatMoney(debt)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
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
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Врачи клиники
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                            На странице: {doctors.length}
                        </p>
                    </div>

                    <RelatedPager
                        pageInfo={doctorsData}
                        isLoading={isDoctorsLoading}
                        onPrevious={() => setDoctorsPage((currentPage) => Math.max(currentPage - 1, 0))}
                        onNext={() => setDoctorsPage((currentPage) => currentPage + 1)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">
                    {isDoctorsError && (
                        <QueryErrorNotice
                            className="md:col-span-2"
                            message="Не удалось загрузить врачей клиники."
                            onRetry={() => void refetchDoctors()}
                            isRetrying={isDoctorsLoading}
                        />
                    )}

                    {isDoctorsLoading && !doctorsData && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400 md:col-span-2">
                            Загрузка врачей...
                        </div>
                    )}

                    {!isDoctorsLoading && !isDoctorsError && doctors.length === 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400 md:col-span-2">
                            Врачи не найдены
                        </div>
                    )}

                    {doctors.map((doctor) => (
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

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Пациенты клиники
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                            На странице: {patients.length}
                        </p>
                    </div>

                    <RelatedPager
                        pageInfo={patientsData}
                        isLoading={isPatientsLoading}
                        onPrevious={() => setPatientsPage((currentPage) => Math.max(currentPage - 1, 0))}
                        onNext={() => setPatientsPage((currentPage) => currentPage + 1)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2">
                    {isPatientsError && (
                        <QueryErrorNotice
                            className="md:col-span-2"
                            message="Не удалось загрузить пациентов клиники."
                            onRetry={() => void refetchPatients()}
                            isRetrying={isPatientsLoading}
                        />
                    )}

                    {isPatientsLoading && !patientsData && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400 md:col-span-2">
                            Загрузка пациентов...
                        </div>
                    )}

                    {!isPatientsLoading && !isPatientsError && patients.length === 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400 md:col-span-2">
                            Пациенты не найдены
                        </div>
                    )}

                    {patients.map((patient) => (
                        <div
                            key={patient.fullName}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                            <p className="font-bold text-slate-900">
                                {patient.fullName}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                            Заказы клиники
                        </h2>
                        <p className="mt-1 text-xs text-slate-400">
                            На странице: {clinicOrders.length}
                        </p>
                    </div>

                    <RelatedPager
                        pageInfo={ordersData}
                        isLoading={isOrdersLoading}
                        onPrevious={() => setOrdersPage((currentPage) => Math.max(currentPage - 1, 0))}
                        onNext={() => setOrdersPage((currentPage) => currentPage + 1)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left lg:min-w-[800px]">
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
                        {isOrdersError && (
                            <tr>
                                <td colSpan={7} className="p-4">
                                    <QueryErrorNotice
                                        message="Не удалось загрузить заказы клиники."
                                        onRetry={() => void refetchOrders()}
                                        isRetrying={isOrdersLoading}
                                    />
                                </td>
                            </tr>
                        )}

                        {isOrdersLoading && !ordersData && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-sm text-slate-400">
                                    Загрузка заказов...
                                </td>
                            </tr>
                        )}

                        {!isOrdersLoading && !isOrdersError && clinicOrders.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-sm text-slate-400">
                                    Заказы не найдены
                                </td>
                            </tr>
                        )}

                        {clinicOrders.map((order) => (
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
                                            className={`${getOrderStatusClass(order.isActive)} rounded-lg px-2 py-1 text-[10px] font-bold uppercase`}>
                                            {getOrderStatusLabel(order.isActive)}
                                        </span>
                                </td>

                                <td className="p-4 text-sm font-bold text-slate-700">
                                    {formatMoney(order.totalAmount)}
                                </td>

                                <td className="p-4 text-sm font-bold text-green-600">
                                    {formatMoney(order.paidAmount)}
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

