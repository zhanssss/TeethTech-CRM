'use client';

import {useState} from 'react';

// Имитация справочников
const CLINICS = [
    {id: 'c1', name: 'Dental Care Astana'},
    {id: 'c2', name: 'Elite Smile'},
    {id: 'c3', name: 'Городская стоматология №2'},
    {id: 'c4', name: 'Family Clinic'},
];

const TECHNICIANS = [
    {id: '1', name: 'Алексей (Универсал)'},
    {id: '3', name: 'Игорь (Керамист)'},
];

const OPERATORS = [
    {id: '2', name: 'Мария (CAD/CAM)'},
    {id: '4', name: 'Елена (Фрезеровка)'},
];

export default function CreateOrderModal({isOpen, onClose, onSubmit}: any) {
    const [formData, setFormData] = useState({
        clinicId: '',       // Новое поле: Клиника
        patient: '',
        doctor: '',
        type: 'Коронка',
        units: 1,
        material: 'Zirconia',
        color: '',
        deadline: '',
        unitPrice: 0,
        discount:0,
        comment: '',
        impressionQty: 0,
        transferQty: 0,
        biteQty: 0,
        analogQty: 0,

        implantSystem: '',
        implantSize: '',
        implantQty: 0,
        implantSource: 'clinic',

        abutment: '',
        priority: 'medium',
        operatorId: '',
        technicianId: '',
    });

    if (!isOpen) return null;

    const subtotal = Number(formData.units) * Number(formData.unitPrice);
    const total = Math.max(subtotal - (subtotal * (Number(formData.discount)/100)), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Находим имя клиники по ID для отображения
        const selectedClinic = CLINICS.find(c => c.id === formData.clinicId)?.name || 'Не указана';

        const newTask = {
            id: `TT-${Math.floor(Math.random() * 1000) + 200}`,
            ...formData,
            clinicName: selectedClinic,
            subtotal,
            total,
            paid: 0,
            unpaid: total,
            status: 'TODO',
            techId: formData.technicianId || '1'
        };
        onSubmit(newTask);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">

                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Регистрация наряда</h2>
                        <p className="text-xs text-slate-500">Заполнение данных по заказу клиники</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-7">

                    {/* Блок 1: Контрагент и Пациент */}
                    <section>
                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Заказчик и Пациент
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label
                                    className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Клиника</label>
                                <select required
                                        className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                        value={formData.clinicId}
                                        onChange={e => setFormData({...formData, clinicId: e.target.value})}>
                                    <option value="">-- Выберите клинику --</option>
                                    {CLINICS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label
                                    className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Врач</label>
                                <input required type="text"
                                       className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                       placeholder="ФИО Врача"
                                       value={formData.doctor}
                                       onChange={e => setFormData({...formData, doctor: e.target.value})}/>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ФИО
                                    Пациента</label>
                                <input required type="text"
                                       className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                       value={formData.patient}
                                       onChange={e => setFormData({...formData, patient: e.target.value})}/>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Срок
                                    исполнения</label>
                                <input required type="date"
                                       className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                       value={formData.deadline}
                                       onChange={e => setFormData({...formData, deadline: e.target.value})}/>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Цена и оплата
                        </h3>

                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                    Кол-во единиц
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                    value={formData.units}
                                    onChange={e => setFormData({...formData, units: Number(e.target.value)})}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                    Цена за 1 ед.
                                </label>
                                <input
                                    min="0"
                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                    value={formData.unitPrice}
                                    onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                    Скидка %
                                </label>
                                <input
                                    min="0"
                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                    value={formData.discount}
                                    onChange={e => setFormData({...formData, discount: Number(e.target.value)})}
                                />
                            </div>

                            <div className="bg-slate-900 text-white rounded-xl px-4 py-3 flex flex-col justify-center">
                                <span className="text-[10px] uppercase text-slate-400 font-bold">Итого</span>
                                <span className="text-lg font-black">
                {total.toLocaleString('ru-RU')} ₸
            </span>
                            </div>
                        </div>
                    </section>

                    {/* Блок 2: ТЗ (Вид работы, Цвет, Комплектация) */}
                    <section>
                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Техническое задание
                        </h3>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Вид
                                    работы</label>
                                <input type="text" placeholder="Коронка, протез и т.д."
                                       className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                       value={formData.type}
                                       onChange={e => setFormData({...formData, type: e.target.value})}/>
                            </div>
                            <div>
                                <label
                                    className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Цвет</label>
                                <input type="text" placeholder="A3, B1..."
                                       className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                       value={formData.color}
                                       onChange={e => setFormData({...formData, color: e.target.value})}/>
                            </div>
                            <div>
                                <label
                                    className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Абатмент</label>
                                <input type="text"
                                       className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                       value={formData.abutment}
                                       onChange={e => setFormData({...formData, abutment: e.target.value})}/>
                            </div>
                        </div>

                        {/* Комплектация из Excel */}
                        <div className="grid grid-cols-4 gap-4 bg-slate-100/50 p-4 rounded-2xl border border-slate-200/50">
                            {[
                                {label: 'Слепок', key: 'impressionQty'},
                                {label: 'Трансфер', key: 'transferQty'},
                                {label: 'Прикус', key: 'biteQty'},
                                {label: 'Аналог', key: 'analogQty'}
                            ].map((item) => (
                                <div key={item.key}>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                        {item.label}
                                    </label>
                                    <input
                                        className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                        value={(formData as any)[item.key]}
                                        onChange={e => setFormData({
                                            ...formData,
                                            [item.key]: Number(e.target.value)
                                        })}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    <div className="mt-4 grid grid-cols-4 gap-4 bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Система импланта
                            </label>
                            <input
                                type="text"
                                placeholder="Straumann, Nobel..."
                                className="w-full border-2 border-blue-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                value={formData.implantSystem}
                                onChange={e => setFormData({...formData, implantSystem: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Размер
                            </label>
                            <input
                                type="text"
                                placeholder="4.1 / 10 мм"
                                className="w-full border-2 border-blue-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                value={formData.implantSize}
                                onChange={e => setFormData({...formData, implantSize: e.target.value})}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Кол-во
                            </label>
                            <input
                                type="number"
                                min="0"
                                className="w-full border-2 border-blue-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                value={formData.implantQty}
                                onChange={e => setFormData({...formData, implantQty: Number(e.target.value)})}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                От кого
                            </label>
                            <select
                                className="w-full border-2 border-blue-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                value={formData.implantSource}
                                onChange={e => setFormData({...formData, implantSource: e.target.value})}
                            >
                                <option value="clinic">От клиники</option>
                                <option value="lab">От лаборатории</option>
                            </select>
                        </div>
                    </div>

                    <section>
                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Комментарий к заказу
                        </h3>

                        <textarea
                            rows={4}
                            placeholder="Например: срочный заказ, особенности посадки, пожелания врача..."
                            className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition resize-none"
                            value={formData.comment}
                            onChange={e => setFormData({...formData, comment: e.target.value})}
                        />
                    </section>

                    {/* Блок 3: Производство (Техник и Оператор) */}
                    <section>
                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Производственный отдел
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                                <label className="block text-[10px] font-black text-blue-600 uppercase mb-2">Зубной
                                    техник</label>
                                <select required className="w-full bg-transparent text-sm font-semibold outline-none"
                                        value={formData.technicianId}
                                        onChange={e => setFormData({...formData, technicianId: e.target.value})}>
                                    <option value="">Выбрать</option>
                                    {TECHNICIANS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="p-4 bg-purple-50 border-2 border-purple-100 rounded-2xl">
                                <label className="block text-[10px] font-black text-purple-600 uppercase mb-2">Оператор
                                    CAD/CAM</label>
                                <select required className="w-full bg-transparent text-sm font-semibold outline-none"
                                        value={formData.operatorId}
                                        onChange={e => setFormData({...formData, operatorId: e.target.value})}>
                                    <option value="">Выбрать</option>
                                    {OPERATORS.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                        <button type="button" onClick={onClose}
                                className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition">Отмена
                        </button>
                        <button type="submit"
                                className="px-10 py-3 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95">
                            Создать заказ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}