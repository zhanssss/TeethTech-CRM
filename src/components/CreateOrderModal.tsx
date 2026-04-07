'use client';

import { useState } from 'react';

// Имитация списка техников (в реальности придет из БД)
const TECHNICIANS = [
    { id: '1', name: 'Алексей (Универсал)' },
    { id: '2', name: 'Мария (CAD/CAM)' },
    { id: '3', name: 'Игорь (Керамист)' },
    { id: '4', name: 'Елена (Фрезеровка)' },
];

export default function CreateOrderModal({ isOpen, onClose, onSubmit }: any) {
    // Состояние формы
    const [formData, setFormData] = useState({
        patient: '',
        type: 'Коронка',
        material: 'Zirconia',
        units: 1,
        priority: 'medium',
        deadline: '',
        // Маршрутный лист (ответственные по этапам)
        assignees: {
            MODELING: '',
            MILLING: '',
            POST_PROCESSING: '',
        }
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Генерируем случайный ID для нового наряда
        const newTask = {
            id: `TT-${Math.floor(Math.random() * 1000) + 200}`,
            ...formData,
            status: 'TODO',
            // Для совместимости со старым кодом покажем техника на первом этапе
            techId: formData.assignees.MODELING || 'Не назначен'
        };

        onSubmit(newTask);
        onClose(); // Закрываем модалку
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Шапка */}
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">Создать новый наряд</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                </div>

                {/* Тело формы */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">

                    {/* Блок 1: Основная информация */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 border-b pb-1">Данные работы</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Пациент</label>
                                <input required type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Иванов И.И."
                                       value={formData.patient} onChange={e => setFormData({...formData, patient: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Дедлайн</label>
                                <input required type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                       value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Вид работы</label>
                                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                        value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                    <option>Коронка</option><option>Винир</option><option>Протез</option><option>Вкладка</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Материал</label>
                                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                        value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})}>
                                    <option>Zirconia</option><option>E-max</option><option>PMMA</option><option>Titanium</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Кол-во единиц</label>
                                <input required type="number" min="1" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                       value={formData.units} onChange={e => setFormData({...formData, units: parseInt(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Приоритет</label>
                                <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                                        value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                                    <option value="low">Низкий</option><option value="medium">Средний</option><option value="high">Высокий</option><option value="urgent">Срочный!</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Блок 2: Распределение по этапам */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 border-b pb-1">Маршрут производства</h3>
                        <div className="space-y-3">
                            {/* Выбор для Моделирования */}
                            <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                <span className="text-sm font-medium text-blue-800 w-1/3">Моделирование</span>
                                <select className="flex-1 border border-blue-200 rounded-md px-3 py-1.5 text-sm"
                                        value={formData.assignees.MODELING}
                                        onChange={e => setFormData({...formData, assignees: {...formData.assignees, MODELING: e.target.value}})}>
                                    <option value="">-- Выберите техника --</option>
                                    {TECHNICIANS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            {/* Выбор для Фрезеровки */}
                            <div className="flex items-center justify-between p-3 bg-purple-50/50 border border-purple-100 rounded-lg">
                                <span className="text-sm font-medium text-purple-800 w-1/3">Фрезеровка</span>
                                <select className="flex-1 border border-purple-200 rounded-md px-3 py-1.5 text-sm"
                                        value={formData.assignees.MILLING}
                                        onChange={e => setFormData({...formData, assignees: {...formData.assignees, MILLING: e.target.value}})}>
                                    <option value="">-- Выберите техника --</option>
                                    {TECHNICIANS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            {/* Выбор для Обработки */}
                            <div className="flex items-center justify-between p-3 bg-orange-50/50 border border-orange-100 rounded-lg">
                                <span className="text-sm font-medium text-orange-800 w-1/3">Обработка/Керамика</span>
                                <select className="flex-1 border border-orange-200 rounded-md px-3 py-1.5 text-sm"
                                        value={formData.assignees.POST_PROCESSING}
                                        onChange={e => setFormData({...formData, assignees: {...formData.assignees, POST_PROCESSING: e.target.value}})}>
                                    <option value="">-- Выберите техника --</option>
                                    {TECHNICIANS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Кнопки */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition">Отмена</button>
                        <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition">Создать наряд</button>
                    </div>
                </form>
            </div>
        </div>
    );
}