'use client';

import { useState } from 'react';

// Имитируем данные, которые в будущем будут приходить из Store или БД
const initialOrders = [
    {
        date: '08.04.2026',
        clinic: 'Dental Care',
        patient: 'Алиев К.',
        doctor: 'Смирнов А.В.',
        workType: 'Коронка цирконий',
        units: 1,
        impression: true,
        transfer: false,
        bite: true,
        analog: false,
        abutment: 'Стандарт',
        color: 'A2',
        technician: 'Алексей',
        operator: 'Мария',
        cost: 25000,
        total: 25000,
        paid: 0,
        payDate: '-'
    }
];

export default function Dashboard() {
    const [orders] = useState(initialOrders);

    const [search, setSearch] = useState('');
    const [clinicFilter, setClinicFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');

    const clinics = Array.from(new Set(orders.map(order => order.clinic)));

    const filteredOrders = orders.filter((order) => {
        const searchValue = search.toLowerCase();

        const matchesSearch =
            order.patient.toLowerCase().includes(searchValue) ||
            order.clinic.toLowerCase().includes(searchValue) ||
            order.doctor.toLowerCase().includes(searchValue) ||
            order.workType.toLowerCase().includes(searchValue);

        const matchesClinic =
            clinicFilter === 'all' || order.clinic === clinicFilter;

        const matchesPayment =
            paymentFilter === 'all' ||
            (paymentFilter === 'paid' && order.paid >= order.total) ||
            (paymentFilter === 'unpaid' && order.paid < order.total);

        return matchesSearch && matchesClinic && matchesPayment;
    });

    const resetFilters = () => {
        setSearch('');
        setClinicFilter('all');
        setPaymentFilter('all');
    };

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <header>
                <h1 className="text-3xl font-bold text-slate-900">Панель управления</h1>
            </header>

            {/* Карточки со статистикой */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Всего заказов</p>
                    <p className="text-3xl font-bold mt-1">{orders.length + 123}</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-yellow-400">
                    <p className="text-sm font-medium text-slate-500">В работе</p>
                    <p className="text-3xl font-bold mt-1">18</p>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
                    <p className="text-sm font-medium text-slate-500">Готовы к выдаче</p>
                    <p className="text-3xl font-bold mt-1">7</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск: пациент, клиника, врач, работа"
                        className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />

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

                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                    >
                        <option value="all">Любая оплата</option>
                        <option value="paid">Оплачено</option>
                        <option value="unpaid">Не оплачено</option>
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

            {/* Таблица на основе Excel-структуры */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-700">Последние наряды</h2>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold uppercase">Live Update</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-300">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-tighter text-slate-400">
                        <tr>
                            <th className="p-3 font-bold">Дата</th>
                            <th className="p-3 font-bold">Клиника/Пациент</th>
                            <th className="p-3 font-bold">Врач</th>
                            <th className="p-3 font-bold">Вид работы</th>
                            <th className="p-3 font-bold">Кол-во</th>
                            <th className="p-3 font-bold">Комплектация</th>
                            <th className="p-3 font-bold">Абатмент</th>
                            <th className="p-3 font-bold">Цвет</th>
                            <th className="p-3 font-bold">Техник/Оператор</th>
                            <th className="p-3 font-bold text-right">Стоимость</th>
                            <th className="p-3 font-bold text-right">Оплата</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {filteredOrders.map((order, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition text-sm">
                                <td className="p-3 text-slate-500">{order.date}</td>
                                <td className="p-3">
                                    <div className="font-bold text-slate-800">{order.patient}</div>
                                    <div className="text-[10px] text-blue-600 font-medium">{order.clinic}</div>
                                </td>
                                <td className="p-3 text-slate-600 text-xs">{order.doctor}</td>
                                <td className="p-3 font-medium">{order.workType}</td>
                                <td className="p-3 text-center">{order.units}</td>
                                <td className="p-3">
                                    <div className="flex gap-1">
                                        {order.impression && <span className="bg-slate-100 p-1 rounded text-[9px] font-bold" title="Слепок">С</span>}
                                        {order.transfer && <span className="bg-slate-100 p-1 rounded text-[9px] font-bold" title="Трансфер">Т</span>}
                                        {order.bite && <span className="bg-slate-100 p-1 rounded text-[9px] font-bold" title="Прикус">П</span>}
                                        {order.analog && <span className="bg-slate-100 p-1 rounded text-[9px] font-bold" title="Аналог">А</span>}
                                    </div>
                                </td>
                                <td className="p-3 text-xs text-slate-500">{order.abutment}</td>
                                <td className="p-3">
                                        <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold border border-orange-100">
                                            {order.color}
                                        </span>
                                </td>
                                <td className="p-3">
                                    <div className="text-xs">Т: <span className="font-semibold text-slate-700">{order.technician}</span></div>
                                    <div className="text-xs">О: <span className="font-semibold text-slate-700">{order.operator}</span></div>
                                </td>
                                <td className="p-3 text-right font-mono text-xs font-bold text-slate-700">
                                    {order.total.toLocaleString('ru-RU')} ₸
                                </td>
                                <td className="p-3 text-right">
                                    <span className="text-[10px] text-slate-400 italic">не оплачено</span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}