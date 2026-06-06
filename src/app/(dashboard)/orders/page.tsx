'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import CreateOrderModal from '@/src/components/Modals/CreateOrderModal';
import type { CreateOrderDto, OrderApiListItem, OrderListItem } from '@/src/types/order.types';
import { addOrder, useOrders } from '@/src/lib/ordersStore';
import {
    useCreateOrderMutation,
    useDeleteOrderMutation,
    useGetOrdersQuery,
} from '@/src/services/api/ordersApi';

function mapApiOrderToListItem(order: OrderApiListItem): OrderListItem {
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        patient: order.patientFullName,
        doctor: '',
        work: order.summaryWorkType,
        workType: order.summaryWorkType,
        status: order.isActive ? 'Активен' : 'Закрыт',
        units: order.quantity,
        unitPrice: order.pricePerUnit,
        discount: order.discount,
        total: order.totalPrice,
        paid: 0,
        unpaid: order.totalPrice,
        date: new Date().toLocaleDateString('ru-RU'),
    };
}

export default function OrdersPage() {
    const localOrders = useOrders();
    const { data: serverOrders, isLoading: isOrdersLoading, isError: isOrdersError } = useGetOrdersQuery();
    const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
    const [deleteOrder, { isLoading: isDeletingOrder }] = useDeleteOrderMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [clinicFilter, setClinicFilter] = useState('all');
    const [deleteError, setDeleteError] = useState('');

    const orders = useMemo(
        () => (serverOrders ? serverOrders.map(mapApiOrderToListItem) : localOrders),
        [localOrders, serverOrders]
    );

    const statuses = Array.from(new Set(orders.map((order) => order.status)));
    const clinics = Array.from(
        new Set(
            orders
                .map((order) => order.clinic ?? order.clinicName)
                .filter((clinic): clinic is string => Boolean(clinic))
        )
    );

    const filteredOrders = orders.filter((order) => {
        const searchValue = search.toLowerCase();

        const matchesSearch =
            order.id.toLowerCase().includes(searchValue) ||
            (order.orderNumber ?? '').toLowerCase().includes(searchValue) ||
            order.patient.toLowerCase().includes(searchValue) ||
            (order.work ?? order.workType ?? '').toLowerCase().includes(searchValue) ||
            order.status.toLowerCase().includes(searchValue) ||
            (order.clinic ?? order.clinicName ?? '').toLowerCase().includes(searchValue);

        const matchesStatus =
            statusFilter === 'all' || order.status === statusFilter;

        const matchesClinic =
            clinicFilter === 'all' || (order.clinic ?? order.clinicName) === clinicFilter;

        return matchesSearch && matchesStatus && matchesClinic;
    });

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setClinicFilter('all');
    };

    const handleCreateOrder = async (payload: CreateOrderDto) => {
        const createdOrder = await createOrder(payload).unwrap();
        addOrder(mapApiOrderToListItem(createdOrder));
    };

    const handleDeleteOrder = async (orderId: string) => {
        const shouldDelete = window.confirm('Удалить заказ?');
        if (!shouldDelete) return;

        setDeleteError('');

        try {
            await deleteOrder(orderId).unwrap();
        } catch (error) {
            console.error('Ошибка удаления заказа:', error);
            setDeleteError('Не удалось удалить заказ');
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Реестр заказов</h1>
                    <p className="text-slate-500 text-sm">Управление производственным потоком лаборатории</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    + Новый заказ
                </button>
            </div>

            {(isOrdersError || deleteError) && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-800">
                    {deleteError || 'Не удалось загрузить заказы с сервера, показаны локальные данные.'}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск: ID, пациент, работа, статус"
                        className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="all">Все статусы</option>
                        {statuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                    <select
                        value={clinicFilter}
                        onChange={(e) => setClinicFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="all">Все клиники</option>
                        {clinics.map((clinic) => (
                            <option key={clinic} value={clinic}>
                                {clinic}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                        Найдено: <span className="font-bold text-slate-700">{filteredOrders.length}</span>
                        {isOrdersLoading && <span className="ml-2 text-blue-600">Загрузка...</span>}
                    </p>

                    <button
                        onClick={resetFilters}
                        className="text-xs font-bold text-slate-500 hover:text-blue-600 transition"
                    >
                        Сбросить фильтры
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-widest">
                        <tr>
                            <th className="p-4 font-bold">ID</th>
                            <th className="p-4 font-bold">Пациент</th>
                            <th className="p-4 font-bold">Вид работы</th>
                            <th className="p-4 font-bold">Статус</th>
                            <th className="p-4 font-bold">Кол-во</th>
                            <th className="p-4 font-bold">Цена за ед.</th>
                            <th className="p-4 font-bold">Скидка</th>
                            <th className="p-4 font-bold">Итого</th>
                            <th className="p-4 font-bold text-right">Действия</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-blue-50/30 transition group">
                                <td className="p-4 text-sm font-mono text-slate-400">
                                    #{order.orderNumber ?? order.id}
                                </td>
                                <td className="p-4 text-sm font-bold text-slate-800">{order.patient}</td>
                                <td className="p-4 text-sm text-slate-600">{order.work}</td>
                                <td className="p-4">
                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-sm">{order.units}</td>
                                <td className="p-4 text-sm">{order.unitPrice?.toLocaleString('ru-RU')} ₸</td>
                                <td className="p-4 text-sm">{order.discount?.toLocaleString('ru-RU')}%</td>
                                <td className="p-4 text-sm font-bold">{order.total?.toLocaleString('ru-RU')} ₸</td>
                                <td className="p-4">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/orders/${order.id}`}
                                            className="text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                        >
                                            Открыть
                                        </Link>
                                        <button
                                            type="button"
                                            disabled={isDeletingOrder}
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="text-red-600 hover:bg-red-600 hover:text-white border border-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {filteredOrders.length === 0 && (
                            <tr>
                                <td colSpan={9} className="p-10 text-center text-sm text-slate-400">
                                    Заказы не найдены
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateOrderModal
                isOpen={isModalOpen}
                isSubmitting={isCreatingOrder}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateOrder}
            />
        </div>
    );
}
