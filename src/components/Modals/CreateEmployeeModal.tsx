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

            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col gap-y-5 p-4">
                <div className="flex justify-between">
                    <h2>Добавить сотрудника</h2>
                    <h1 className="cursor-pointer" onClick={onClose}>X</h1>
                </div>

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Имя сотрудника"
                    required
                    className="p-4 w-full"
                />

                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@example.com"
                    required
                    className="p-4 w-full"
                />

                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 777 123 45 67"
                    required
                    className="p-4 w-full"
                />

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="p-4 w-full"
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
                    className="p-4 w-full"
                />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-500 text-white py-3 rounded-xl cursor-pointer transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {isLoading ? 'Создание...' : 'Добавить'}
                </button>
            </form>
        </Modal>
    );
}
