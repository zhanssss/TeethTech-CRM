'use client'; // Используем клиентский компонент для интерактивности

import {useState} from 'react';

// Имитация данных (позже придут из Spring Boot через RTK Query)
const initialOrders = [
    {id: '101', patient: 'Алиев К.', work: 'Коронка цирконий', status: 'Приемка', technician: '—'},
    {id: '102', patient: 'Иванова М.', work: 'Винир E-max', status: 'Моделирование', technician: 'Берик С.'},
    {id: '103', patient: 'Смирнов Д.', work: 'Протез акриловый', status: 'Обработка', technician: 'Анна В.'},
];

export default function OrdersPage() {
    const [orders, setOrders] = useState(initialOrders);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Управление заказами (Диспетчер)</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    + Новый заказ
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase">
                    <tr>
                        <th className="p-4 font-semibold">ID</th>
                        <th className="p-4 font-semibold">Пациент</th>
                        <th className="p-4 font-semibold">Работа</th>
                        <th className="p-4 font-semibold">Статус</th>
                        <th className="p-4 font-semibold">Техник</th>
                        <th className="p-4 font-semibold text-right">Действия</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 text-sm font-medium">#{order.id}</td>
                            <td className="p-4 text-sm">{order.patient}</td>
                            <td className="p-4 text-sm">{order.work}</td>
                            <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      order.status === 'Приемка' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                            </td>
                            <td className="p-4 text-sm text-slate-600">{order.technician}</td>
                            <td className="p-4 text-right">
                                <button className="text-blue-600 hover:underline text-sm font-medium">
                                    Назначить
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}