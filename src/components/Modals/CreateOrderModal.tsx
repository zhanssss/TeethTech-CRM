'use client';

import {useState} from 'react';
import type {CreateOrderPayload, CreateOrderTask} from '@/src/types/order.types';

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


type CreateOrderModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (order: CreateOrderPayload) => void;
};

const createEmptyTask = (): CreateOrderTask => ({
    type: '',
    units: 1,
    material: '',
    color: '',
    unitPrice: 0,
    discount: 0,

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


export default function CreateOrderModal({isOpen, onClose, onSubmit}: CreateOrderModalProps) {
    const [formData, setFormData] = useState({
        clinicId: '',
        patient: '',
        doctor: '',
        deadline: '',
        comment: '',
        tasks: [createEmptyTask()],
    });
    if (!isOpen) return null;

    const total = formData.tasks.reduce((sum, task) => {
        const subtotal = Number(task.units) * Number(task.unitPrice);
        const taskTotal = Math.max(
            subtotal - subtotal * (Number(task.discount) / 100),
            0
        );

        return sum + taskTotal;
    }, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedClinic = CLINICS.find(c => c.id === formData.clinicId)?.name || 'Не указана';

        const total = formData.tasks.reduce((sum, task) => {
            const subtotal = Number(task.units) * Number(task.unitPrice);
            const taskTotal = Math.max(
                subtotal - subtotal * (Number(task.discount) / 100),
                0
            );

            return sum + taskTotal;
        }, 0);

        const orderId = `${Math.floor(Math.random() * 1000) + 200}`;
        const tasks = formData.tasks.map((task, index) => ({
            ...task,
            id: `${orderId}-task-${index + 1}`,
            orderId,
            status: 'TODO' as const,
        }));

        const newOrder: CreateOrderPayload = {
            id: orderId,
            clinicId: formData.clinicId,
            clinicName: selectedClinic,
            patient: formData.patient,
            doctor: formData.doctor,
            deadline: formData.deadline,
            comment: formData.comment,
            tasks,
            total,
            paid: 0,
            unpaid: total,
            status: 'TODO',
        };

        onSubmit(newOrder);
        onClose();
    };

    const handleAddNewTask = () => {
        setFormData((prev) => ({
            ...prev,
            tasks: [...prev.tasks, createEmptyTask()],
        }));
    };

    const handleRemoveTask = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            tasks: prev.tasks.filter((_, taskIndex) => taskIndex !== index),
        }));
    };


    const handleTaskChange = <Field extends keyof CreateOrderTask>(
        index: number,
        field: Field,
        value: CreateOrderTask[Field]
    ) => {
        setFormData((prev) => {
            const updatedTasks = [...prev.tasks];

            updatedTasks[index] = {
                ...updatedTasks[index],
                [field]: value,
            };

            return {
                ...prev,
                tasks: updatedTasks,
            };
        });
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

                    {/* Блок 2: ТЗ (Вид работы, Цвет, Комплектация) */}
                    <section className='flex flex-col'>
                        <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span> Техническое задание
                        </h3>
                        {formData.tasks.map((task, index) => (
                            <div key={index} className="border border-slate-200 rounded-2xl p-4 mb-4 bg-white">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-black text-slate-700">
                                        Техническая задача #{index + 1}
                                    </h4>

                                    {formData.tasks.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTask(index)}
                                            className="text-xs font-bold text-red-500 hover:text-red-700"
                                        >
                                            Удалить
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            Вид работы
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Коронка, протез и т.д."
                                            className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                            value={task.type}
                                            onChange={e => handleTaskChange(index, 'type', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            Кол-во
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                            value={task.units}
                                            onChange={e => handleTaskChange(index, 'units', Number(e.target.value))}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            Цвет
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="A3, B1..."
                                            className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                            value={task.color}
                                            onChange={e => handleTaskChange(index, 'color', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            Материал
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Zirconia, E-max..."
                                            className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                            value={task.material}
                                            onChange={e => handleTaskChange(index, 'material', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            Цена за 1 ед.
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                            value={task.unitPrice}
                                            onChange={e => handleTaskChange(index, 'unitPrice', Number(e.target.value))}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            Скидка %
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                            value={task.discount}
                                            onChange={e => handleTaskChange(index, 'discount', Number(e.target.value))}
                                        />
                                    </div>
                                    <div
                                        className="bg-slate-900 text-white rounded-xl px-4 py-3 flex flex-col justify-center">
                                        <span className="text-[10px] uppercase text-slate-400 font-bold">
                                            Итого задачи
                                        </span>
                                        <span className="text-lg font-black">
                                            {Math.max(
                                                Number(task.units) * Number(task.unitPrice) -
                                                Number(task.units) * Number(task.unitPrice) * (Number(task.discount) / 100),
                                                0
                                            ).toLocaleString('ru-RU')} ₸
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                                        <label className="block text-[10px] font-black text-blue-600 uppercase mb-2">
                                            Зубной техник
                                        </label>
                                        <select
                                            required
                                            className="w-full bg-transparent text-sm font-semibold outline-none"
                                            value={task.technicianId}
                                            onChange={e => handleTaskChange(index, 'technicianId', e.target.value)}
                                        >
                                            <option value="">Выбрать</option>
                                            {TECHNICIANS.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="p-4 bg-purple-50 border-2 border-purple-100 rounded-2xl">
                                        <label className="block text-[10px] font-black text-purple-600 uppercase mb-2">
                                            Оператор CAD/CAM
                                        </label>
                                        <select
                                            required
                                            className="w-full bg-transparent text-sm font-semibold outline-none"
                                            value={task.operatorId}
                                            onChange={e => handleTaskChange(index, 'operatorId', e.target.value)}
                                        >
                                            <option value="">Выбрать</option>
                                            {OPERATORS.map(o => (
                                                <option key={o.id} value={o.id}>
                                                    {o.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={handleAddNewTask}
                            className="w-10 h-10 cursor-pointer self-end my-2 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                        >
                            +
                        </button>
                    </section>


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
                    <div className="flex justify-end">
                        <div className="bg-slate-900 text-white rounded-2xl px-6 py-4 min-w-[220px]">
                            <p className="text-[10px] uppercase text-slate-400 font-bold">
                                Общая сумма заказа
                            </p>
                            <p className="text-2xl font-black">
                                {total.toLocaleString('ru-RU')} ₸
                            </p>
                        </div>
                    </div>

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
