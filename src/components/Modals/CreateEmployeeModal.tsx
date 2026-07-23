import { FormEvent, useState } from 'react';

import RoleSelect from '@/src/components/roles/RoleSelect';
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
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const salaryType: SalaryType = 'FIXED';
    const [tempPassword, setTempPassword] = useState('');
    const {
        data: roles = [],
        isLoading: isRolesLoading,
        isFetching: isRolesFetching,
        isError: isRolesError,
        refetch: refetchRoles,
    } = useGetRolesQuery();
    const [registerUser, { isLoading }] = useRegisterUserMutation();
    const unselectedRoles = roles.filter(
        (role) => !selectedRoles.includes(role.code)
    );

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isLoading || selectedRoles.length === 0) return;

        const body: Register = {
            fullName: name,
            email,
            phone,
            roles: selectedRoles,
            status: 'ACTIVE',
            password: tempPassword,
            salaryType,
            salary: 0,
        };

        try {
            await registerUser(body).unwrap();
            onClose();
        } catch (error) {
            console.error('Ошибка создания сотрудника:', error);
        }
    };

    return (
        <Modal contentClassName="max-w-3xl overflow-hidden p-0">
            <form onSubmit={handleSubmit}>
                <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-7">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Команда лаборатории</p>
                        <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Добавить сотрудника</h2>
                        <p className="mt-1 text-xs text-slate-500">Создайте профиль и назначьте одну или несколько ролей</p>
                    </div>
                    <button
                        type="button"
                        className="rounded-lg px-2 text-xl font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        ×
                    </button>
                </header>

                <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
                    {isRolesError && (
                        <QueryErrorNotice
                            message="Не удалось загрузить роли сотрудников."
                            onRetry={() => void refetchRoles()}
                            isRetrying={isRolesFetching}
                        />
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Имя сотрудника</span>
                            <input
                                type="text"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Имя сотрудника"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="employee@example.com"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Телефон</span>
                            <PhoneInput
                                value={phone}
                                onValueChange={setPhone}
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Временный пароль</span>
                            <input
                                type="text"
                                value={tempPassword}
                                onChange={(event) => setTempPassword(event.target.value)}
                                placeholder="Временный пароль"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                            />
                        </label>
                    </div>

                    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/70 sm:p-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white">Роли сотрудника</h3>
                                <p className="mt-1 text-xs text-slate-500">Можно назначить несколько системных и производственных ролей.</p>
                            </div>
                            <span className="text-xs font-bold text-violet-600">Выбрано: {selectedRoles.length}</span>
                        </div>

                        {selectedRoles.length > 0 && (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {selectedRoles.map((code) => {
                                    const role = roles.find((item) => item.code === code);

                                    return (
                                        <div key={code} className="flex items-center justify-between gap-3 rounded-xl border border-violet-200 bg-white px-3 py-2.5 dark:border-violet-500/40 dark:bg-slate-900">
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{role?.name ?? code}</span>
                                                <span className="block truncate font-mono text-[10px] text-slate-400">{code}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRoles((current) => current.filter((item) => item !== code))}
                                                disabled={isLoading}
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                aria-label={`Удалить роль ${role?.name ?? code}`}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-4">
                            <RoleSelect
                                value=""
                                onChange={(code) => {
                                    if (!code) return;
                                    setSelectedRoles((current) =>
                                        current.includes(code) ? current : [...current, code]
                                    );
                                }}
                                roles={unselectedRoles}
                                isLoading={isRolesLoading}
                                disabled={isRolesError || unselectedRoles.length === 0}
                                placeholder={
                                    selectedRoles.length > 0 && unselectedRoles.length === 0
                                        ? 'Все доступные роли уже выбраны'
                                        : isRolesError
                                            ? 'Роли недоступны'
                                            : 'Добавить роль'
                                }
                            />
                        </div>

                        {selectedRoles.length === 0 && (
                            <p className="mt-2 text-xs font-medium text-amber-600">Назначьте сотруднику хотя бы одну роль.</p>
                        )}
                    </section>
                </div>

                <footer className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-7">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                        Отмена
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading || isRolesError || selectedRoles.length === 0}
                        className="min-w-40 cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {isLoading ? 'Создание...' : 'Добавить сотрудника'}
                    </button>
                </footer>
            </form>
        </Modal>
    );
}
