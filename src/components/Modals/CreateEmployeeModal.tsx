import { FormEvent, useState } from 'react';
import Modal from '@/src/components/ui/Modal';
import {
    EmployeeRole,
    employeeRoleOptions,
} from '@/src/types/employee.types';
import { useRegisterUserMutation } from '@/src/services/api/authApi';
import type { Register } from '@/src/types/auth.types';

type CreateEmployeeModalProps = {
    onClose: () => void;
};

export default function CreateEmployeeModal({ onClose }: CreateEmployeeModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<EmployeeRole>('Оператор / Моделировщик');
    const [tempPassword, setTempPassword] = useState('');

    const [registerUser, { isLoading }] = useRegisterUserMutation();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const body: Register = {
            fullName: name,
            email,
            phone,
            role,
            password: tempPassword,
        };

        try {
            await registerUser(body).unwrap();
            onClose();
        } catch (error) {
            console.error('Ошибка создания сотрудника:', error);
        }
    };

    return (
        <Modal>
            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col gap-y-5 p-4">
                <div className='flex justify-between'>
                    <h2>Добавить Сотрудника</h2>
                    <h1 className='cursor-pointer' onClick={onClose}>X</h1>
                </div>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Имя сотрудника"
                    required
                    className='p-4 w-full'
                />

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@example.com"
                    required
                    className='p-4 w-full'
                />

                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 777 123 45 67"
                    required
                    className='p-4 w-full'
                />

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as EmployeeRole)}
                    className='p-4 w-full'
                >
                    {employeeRoleOptions
                        .filter((option) => option.value !== 'ALL')
                        .map((option) => (
                            <option key={option.id} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                </select>

                <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Временный пароль"
                    required
                    className='p-4 w-full'
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className='bg-blue-500 text-white py-3 rounded-xl cursor-pointer transition hover:bg-blue-600'
                >
                    {isLoading ? 'Создание...' : 'Добавить'}
                </button>
            </form>
        </Modal>
    );
}