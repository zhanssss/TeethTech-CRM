import { FormEvent, useState } from 'react';
import Modal from '@/src/components/ui/Modal';
import { useRegisterUserMutation } from '@/src/services/api/authApi';
import { useGetRolesQuery } from '@/src/services/api/rolesApi';
import type { Register } from '@/src/types/auth.types';
import ErrorModal from '@/src/components/ui/ErrorModal';

type CreateEmployeeModalProps = {
    onClose: () => void;
};

export default function CreateEmployeeModal({ onClose }: CreateEmployeeModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const { data: roles = [], isLoading: isRolesLoading } = useGetRolesQuery();
    const [registerUser, { isLoading }] = useRegisterUserMutation();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage('');

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
            setErrorMessage('Не удалось создать сотрудника');
        }
    };

    return (
        <Modal>
            {errorMessage && (
                <ErrorModal onClose={() => setErrorMessage('')}>
                    {errorMessage}
                </ErrorModal>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-y-4 p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <h2>Добавить сотрудника</h2>
                    <button
                        type="button"
                        className="rounded-lg px-2 text-xl font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        X
                    </button>
                </div>

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Имя сотрудника"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />

                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 777 123 45 67"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                >
                    <option value="">
                        {isRolesLoading ? 'Загрузка ролей...' : 'Выберите роль'}
                    </option>
                    {roles.map((option) => (
                        <option key={option.id} value={option.code}>
                            {option.description || option.code}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Временный пароль"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="cursor-pointer rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {isLoading ? 'Создание...' : 'Добавить'}
                </button>
            </form>
        </Modal>
    );
}
