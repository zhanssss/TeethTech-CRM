'use client';

import { useState } from 'react';
import Link from 'next/link';
import CreateOrderModal from '@/src/components/orders/CreateOrderModal'; // Убедись, что путь верный
import { mockOrders } from '@/src/mock/orders';

export default function OrdersPage() {
    const [orders, setOrders] = useState(mockOrders);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Функция обработки данных из новой модалки
    const handleCreateOrder = (newTask: any) => {
        // Преобразуем данные из формата модалки в формат строки таблицы
        const orderToAdd = {
            id: newTask.id.replace('TT-', ''),
            patient: newTask.patient,
            clinic: newTask.clinicName,
            doctor: newTask.doctor,
            work: `${newTask.type} (${newTask.material})`,
            units: newTask.units,
            unitPrice: newTask.unitPrice,
            discount: newTask.discount,
            total: newTask.total,
            paid: newTask.paid,
            unpaid: newTask.unpaid,
            status: 'Приемка',
            technician: '—',
            date: new Date().toLocaleDateString('ru-RU')
        };

        setOrders([orderToAdd, ...orders]);
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
                    {orders.map((order) => (
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