'use client';

import { useState } from 'react';
import Link from 'next/link';
import CreateOrderModal from '@/src/components/Modals/CreateOrderModal'; // Убедись, что путь верный
import type { CreateOrderPayload, OrderListItem } from '@/src/types/order.types';
import { addOrder, useOrders } from '@/src/lib/ordersStore';

export default function OrdersPage() {
    const orders = useOrders();
    const [isModalOpen, setIsModalOpen] = useState(false);


    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [clinicFilter, setClinicFilter] = useState('all');

    const statuses = Array.from(new Set(orders.map(order => order.status)));
    const clinics = Array.from(
        new Set(
            orders
                .map(order => order.clinic ?? order.clinicName)
                .filter((clinic): clinic is string => Boolean(clinic))
        )
    );

    const filteredOrders = orders.filter((order) => {
        const searchValue = search.toLowerCase();

        const matchesSearch =
            order.id.toLowerCase().includes(searchValue) ||
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

    // Функция обработки данных из новой модалки
    const handleCreateOrder = (newTask: CreateOrderPayload) => {
        const primaryTask = newTask.tasks[0];
        const work = newTask.tasks
            .map((task) => {
                const material = task.material ? ` (${task.material})` : '';
                return task.type ? `${task.type}${material}` : task.material || 'N/A';
            })
            .join(', ');
        const units = newTask.tasks.reduce((sum, task) => sum + task.units, 0);

        // Преобразуем данные из формата модалки в формат строки таблицы
        const orderToAdd: OrderListItem = {
            id: newTask.id.replace('TT-', ''),
            patient: newTask.patient,
            clinic: newTask.clinicName,
            clinicId: newTask.clinicId,
            clinicName: newTask.clinicName,
            doctor: newTask.doctor,
            deadline: newTask.deadline,
            comment: newTask.comment,
            work,
            workType: work,
            units,
            unitPrice: primaryTask?.unitPrice ?? 0,
            discount: primaryTask?.discount ?? 0,
            total: newTask.total,
            paid: newTask.paid,
            unpaid: newTask.unpaid,
            status: 'Приемка',
            technician: '—',
            date: new Date().toLocaleDateString('ru-RU'),
            tasks: newTask.tasks,
        };

        addOrder(orderToAdd);
    };

    return (
        <div className="space-y-6 relative">
            {/* HEADER */}
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
                    </p>

                    <button
                        onClick={resetFilters}
                        className="text-xs font-bold text-slate-500 hover:text-blue-600 transition"
                    >
                        Сбросить фильтры
                    </button>
                </div>
            </div>

            {/* ТАБЛИЦА */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-widest">
                    <tr>
                        <th className="p-4 font-bold">ID</th>
                        <th className="p-4 font-bold">Пациент</th>
                        <th className="p-4 font-bold">Вид работы</th>
                        <th className="p-4 font-bold">Статус</th>
                        <th className="p-4 font-bold text-right">Действия</th>
                        <th className="p-4 font-bold">Кол-во</th>
                        <th className="p-4 font-bold">Цена за ед.</th>
                        <th className="p-4 font-bold">Скидка</th>
                        <th className="p-4 font-bold">Итого</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-blue-50/30 transition group">
                            <td className="p-4 text-sm font-mono text-slate-400">#{order.id}</td>
                            <td className="p-4 text-sm font-bold text-slate-800">{order.patient}</td>
                            <td className="p-4 text-sm text-slate-600">{order.work}</td>
                            <td className="p-4">
                                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase">
                                    {order.status}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <Link href={`/orders/${order.id}`} className="text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition">
                                    Открыть проект
                                </Link>
                            </td>
                            <td className="p-4 text-sm">{order.units}</td>
                            <td className="p-4 text-sm">{order.unitPrice?.toLocaleString('ru-RU')} ₸</td>
                            <td className="p-4 text-sm">{order.discount?.toLocaleString('ru-RU')} ₸</td>
                            <td className="p-4 text-sm font-bold">{order.total?.toLocaleString('ru-RU')} ₸</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* ИСПОЛЬЗУЕМ НОВУЮ ВНЕШНЮЮ МОДАЛКУ */}
            <CreateOrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateOrder}
            />
        </div>
    );
}
