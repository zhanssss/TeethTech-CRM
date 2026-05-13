'use client';

import { FormEvent, useState } from 'react';
import { EmployeeRole } from '@/src/types/employee.types';

type CreateEmployeeModalProps = {
    onClose: () => void;
};

export default function CreateEmployeeModal({ onClose }: CreateEmployeeModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<EmployeeRole>('TECHNICIAN');

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newEmployee = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            role,
            stats: {
                completed: 0,
                inProgress: 0,
                overdue: 0,
                totalAssigned: 0,
                averageDays: 0,
                onTimeRate: 100,
            },
        };

        console.log('Новый сотрудник:', newEmployee);

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            Добавить сотрудника
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Заполните основные данные сотрудника
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-3 py-1.5 text-sm font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">
                            Имя сотрудника
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например: Алишер Нурланов"
                            required
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">
                            Почта
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="employee@example.com"
                            required
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">
                            Номер телефона
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+7 777 123 45 67"
                            required
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-bold text-slate-700">
                            Роль
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as EmployeeRole)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                        >
                            <option value="TECHNICIAN">Техник</option>
                            <option value="OPERATOR">Оператор</option>
                            <option value="DISPATCHER">Диспетчер</option>
                            <option value="ADMIN">Администратор</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                            Отмена
                        </button>

                        <button
                            type="submit"
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
                        >
                            Добавить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}