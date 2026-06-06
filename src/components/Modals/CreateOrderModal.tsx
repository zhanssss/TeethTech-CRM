'use client';

import { useMemo, useState } from 'react';
import type { CreateOrderDto, CreateOrderTaskDto } from '@/src/types/order.types';
import Modal from '@/src/components/ui/Modal';
import ErrorModal from '@/src/components/ui/ErrorModal';
import { useGetClinicsQuery } from '@/src/services/api/clinicsApi';
import { useGetUsersQuery } from '@/src/services/api/usersApi';
import { useGetWorkTypesQuery } from '@/src/services/api/laboratory/workTypesApi';
import { useGetMaterialsQuery } from '@/src/services/api/laboratory/materialApi';
import { useGetColorsQuery } from '@/src/services/api/laboratory/colorsApi';
import type { User } from '@/src/types/user.types';

type CreateOrderModalProps = {
    isOpen: boolean;
    isSubmitting?: boolean;
    onClose: () => void;
    onSubmit: (order: CreateOrderDto) => Promise<void> | void;
};

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const createEmptyTask = (): CreateOrderTaskDto => ({
    workTypeId: '',
    quantity: 1,
    toothNumbers: [],
    orderId: '',
    colorId: '',
    materialId: '',
    pricePerUnit: 0,
    discountPercent: 0,
});

function includesAny(value: string | undefined, tokens: string[]) {
    const normalizedValue = value?.toLowerCase() ?? '';
    return tokens.some((token) => normalizedValue.includes(token));
}

function filterUsersByRole(users: User[], tokens: string[]) {
    const filtered = users.filter((user) =>
        includesAny(`${user.role} ${user.specialization}`, tokens)
    );

    return filtered.length ? filtered : users;
}

function getUserLabel(user: User) {
    const meta = [user.role, user.specialization].filter(Boolean).join(' / ');
    return meta ? `${user.fullName} (${meta})` : user.fullName;
}

export default function CreateOrderModal({
    isOpen,
    isSubmitting = false,
    onClose,
    onSubmit,
}: CreateOrderModalProps) {
    const { data: clinics = [], isLoading: isClinicsLoading } = useGetClinicsQuery();
    const { data: users = [], isLoading: isUsersLoading } = useGetUsersQuery();
    const { data: workTypes = [], isLoading: isWorkTypesLoading } = useGetWorkTypesQuery();
    const { data: materials = [], isLoading: isMaterialsLoading } = useGetMaterialsQuery();
    const { data: colors = [], isLoading: isColorsLoading } = useGetColorsQuery(true);

    const [submitError, setSubmitError] = useState('');
    const [formData, setFormData] = useState<CreateOrderDto>({
        clinicId: '',
        patientFullName: '',
        doctorFullName: '',
        deadline: '',
        dentalTechnicianId: '',
        cadCamOperatorId: '',
        comment: '',
        tasks: [createEmptyTask()],
    });

    const technicianOptions = useMemo(
        () => filterUsersByRole(users, ['тех', 'керам', 'technician', 'ceramist']),
        [users]
    );

    const operatorOptions = useMemo(
        () => filterUsersByRole(users, ['cad', 'cam', 'оператор', 'operator', 'модел']),
        [users]
    );

    if (!isOpen) return null;

    const total = formData.tasks.reduce((sum, task) => {
        const subtotal = Number(task.quantity) * Number(task.pricePerUnit);
        const taskTotal = Math.max(
            subtotal - subtotal * (Number(task.discountPercent) / 100),
            0
        );

        return sum + taskTotal;
    }, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');

        try {
            await onSubmit({
                ...formData,
                tasks: formData.tasks.map((task) => ({
                    ...task,
                    quantity: Number(task.quantity),
                    pricePerUnit: Number(task.pricePerUnit),
                    discountPercent: Number(task.discountPercent),
                    orderId: task.orderId || '',
                    toothNumbers: task.toothNumbers,
                })),
            });
            onClose();
        } catch (error) {
            console.error('Ошибка создания заказа:', error);
            setSubmitError('Не удалось создать заказ');
        }
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

    const handleTaskChange = <Field extends keyof CreateOrderTaskDto>(
        index: number,
        field: Field,
        value: CreateOrderTaskDto[Field]
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

    const handleToothToggle = (taskIndex: number, toothNumber: number) => {
        setFormData((prev) => {
            const updatedTasks = [...prev.tasks];
            const task = updatedTasks[taskIndex];
            const hasTooth = task.toothNumbers.includes(toothNumber);
            const toothNumbers = hasTooth
                ? task.toothNumbers.filter((number) => number !== toothNumber)
                : [...task.toothNumbers, toothNumber].sort((a, b) => a - b);

            updatedTasks[taskIndex] = {
                ...task,
                toothNumbers,
                quantity: toothNumbers.length || task.quantity,
            };

            return {
                ...prev,
                tasks: updatedTasks,
            };
        });
    };

    const isLoadingDictionaries =
        isClinicsLoading ||
        isUsersLoading ||
        isWorkTypesLoading ||
        isMaterialsLoading ||
        isColorsLoading;

    return (
        <Modal contentClassName="max-w-6xl p-0">
            {submitError && (
                <ErrorModal onClose={() => setSubmitError('')}>
                    {submitError}
                </ErrorModal>
            )}

            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Регистрация наряда</h2>
                    <p className="text-xs text-slate-500">Заказ, команда и технические задачи лаборатории</p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-7">
                {isLoadingDictionaries && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                        Загрузка справочников...
                    </div>
                )}

                <section>
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full" /> Заказчик и пациент
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Клиника</label>
                            <select
                                required
                                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                value={formData.clinicId}
                                onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                            >
                                <option value="">-- Выберите клинику --</option>
                                {clinics.map((clinic) => (
                                    <option key={clinic.id} value={clinic.id}>
                                        {clinic.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Врач</label>
                            <input
                                required
                                type="text"
                                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                placeholder="ФИО врача"
                                value={formData.doctorFullName}
                                onChange={(e) => setFormData({ ...formData, doctorFullName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Срок</label>
                            <input
                                required
                                type="date"
                                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ФИО пациента</label>
                            <input
                                required
                                type="text"
                                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                value={formData.patientFullName}
                                onChange={(e) => setFormData({ ...formData, patientFullName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Керамист</label>
                            <select
                                required
                                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                value={formData.dentalTechnicianId}
                                onChange={(e) => setFormData({ ...formData, dentalTechnicianId: e.target.value })}
                            >
                                <option value="">Выбрать</option>
                                {technicianOptions.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {getUserLabel(user)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CAD/CAM оператор</label>
                            <select
                                required
                                className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                value={formData.cadCamOperatorId}
                                onChange={(e) => setFormData({ ...formData, cadCamOperatorId: e.target.value })}
                            >
                                <option value="">Выбрать</option>
                                {operatorOptions.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {getUserLabel(user)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="flex flex-col">
                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full" /> Техническое задание
                    </h3>

                    {formData.tasks.map((task, index) => {
                        const subtotal = Number(task.quantity) * Number(task.pricePerUnit);
                        const taskTotal = Math.max(subtotal - subtotal * (Number(task.discountPercent) / 100), 0);

                        return (
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

                                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Вид работы
                                                </label>
                                                <select
                                                    required
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                                    value={task.workTypeId}
                                                    onChange={(e) => handleTaskChange(index, 'workTypeId', e.target.value)}
                                                >
                                                    <option value="">Выбрать работу</option>
                                                    {workTypes.map((workType) => (
                                                        <option key={workType.id} value={workType.id}>
                                                            {workType.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Кол-во
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                                    value={task.quantity}
                                                    onChange={(e) => handleTaskChange(index, 'quantity', Number(e.target.value))}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Цвет
                                                </label>
                                                <select
                                                    required
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                                    value={task.colorId}
                                                    onChange={(e) => handleTaskChange(index, 'colorId', e.target.value)}
                                                >
                                                    <option value="">Выбрать</option>
                                                    {colors.map((color) => (
                                                        <option key={color.id} value={color.id}>
                                                            {color.code} - {color.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Материал
                                                </label>
                                                <select
                                                    required
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition bg-white"
                                                    value={task.materialId}
                                                    onChange={(e) => handleTaskChange(index, 'materialId', e.target.value)}
                                                >
                                                    <option value="">Выбрать</option>
                                                    {materials.map((material) => (
                                                        <option key={material.id} value={material.id}>
                                                            {material.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Цена за 1 ед.
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                                    value={task.pricePerUnit}
                                                    onChange={(e) => handleTaskChange(index, 'pricePerUnit', Number(e.target.value))}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    Скидка %
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition"
                                                    value={task.discountPercent}
                                                    onChange={(e) => handleTaskChange(index, 'discountPercent', Number(e.target.value))}
                                                />
                                            </div>

                                            <div className="bg-slate-900 text-white rounded-xl px-4 py-3 flex flex-col justify-center">
                                                <span className="text-[10px] uppercase text-slate-400 font-bold">
                                                    Итого задачи
                                                </span>
                                                <span className="text-lg font-black">
                                                    {taskTotal.toLocaleString('ru-RU')} ₸
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-black text-blue-700 uppercase">
                                                Зубы
                                            </label>
                                            <span className="text-[10px] font-bold text-slate-500">
                                                {task.toothNumbers.length ? task.toothNumbers.join(', ') : 'не выбраны'}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {[upperTeeth, lowerTeeth].map((row, rowIndex) => (
                                                <div key={rowIndex} className="grid grid-cols-8 gap-1.5">
                                                    {row.map((toothNumber) => {
                                                        const isSelected = task.toothNumbers.includes(toothNumber);

                                                        return (
                                                            <button
                                                                key={toothNumber}
                                                                type="button"
                                                                onClick={() => handleToothToggle(index, toothNumber)}
                                                                className={`h-8 rounded-full border text-[11px] font-black transition ${
                                                                    isSelected
                                                                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                                                        : 'border-blue-200 bg-white text-blue-700 hover:border-blue-500'
                                                                }`}
                                                            >
                                                                {toothNumber}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

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
                        <span className="w-2 h-2 bg-blue-600 rounded-full" /> Комментарий к заказу
                    </h3>

                    <textarea
                        rows={4}
                        placeholder="Например: срочный заказ, особенности посадки, пожелания врача..."
                        className="w-full border-2 border-slate-100 rounded-xl px-3 py-2 text-sm focus:border-blue-500 outline-none transition resize-none"
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
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
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition"
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-10 py-3 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                    >
                        {isSubmitting ? 'Создание...' : 'Создать заказ'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
