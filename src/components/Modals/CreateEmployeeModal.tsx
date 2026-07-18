import { FormEvent, useState } from 'react';
import Modal from '@/src/components/ui/Modal';
import PhoneInput from '@/src/components/ui/PhoneInput';
import QueryErrorNotice from '@/src/components/ui/QueryErrorNotice';
import { useRegisterUserMutation } from '@/src/services/api/authApi';
import { useGetRolesQuery } from '@/src/services/api/rolesApi';
import type { Register, SalaryType } from '@/src/types/auth.types';

type CreateEmployeeModalProps = {
    onClose: () => void;
};

export default function CreateEmployeeModal({ onClose }: CreateEmployeeModalProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('');
    const [salaryType, setSalaryType] = useState<SalaryType>('FIXED');
    const [salary, setSalary] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const {
        data: roles = [],
        isLoading: isRolesLoading,
        isFetching: isRolesFetching,
        isError: isRolesError,
        refetch: refetchRoles,
    } = useGetRolesQuery();
    const [registerUser, { isLoading }] = useRegisterUserMutation();

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const body: Register = {
            fullName: name,
            email,
            phone,
            role,
            password: tempPassword,
            salaryType,
            salary: Number(salary) || 0,
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

                {isRolesError && (
                    <QueryErrorNotice
                        message="Не удалось загрузить роли сотрудников."
                        onRetry={() => void refetchRoles()}
                        isRetrying={isRolesFetching}
                    />
                )}

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

                <PhoneInput
                    value={phone}
                    onValueChange={setPhone}
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
                        {isRolesLoading
                            ? 'Загрузка ролей...'
                            : isRolesError
                                ? 'Роли недоступны'
                                : 'Выберите роль'}
                    </option>
                    {roles.map((option) => (
                        <option key={option.id} value={option.code}>
                            {option.description || option.code}
                        </option>
                    ))}
                </select>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <select
                        value={salaryType}
                        onChange={(e) => setSalaryType(e.target.value as SalaryType)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    >
                        <option value="FIXED">Фиксированная зарплата</option>
                        <option value="PER_UNIT">Оплата за единицу</option>
                    </select>

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder={salaryType === 'FIXED' ? 'Зарплата' : 'Оплата за единицу'}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                    />
                </div>

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
                    disabled={isLoading || isRolesError}
                    className="cursor-pointer rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                    {isLoading ? 'Создание...' : 'Добавить'}
                </button>
            </form>
        </Modal>
    );
}
