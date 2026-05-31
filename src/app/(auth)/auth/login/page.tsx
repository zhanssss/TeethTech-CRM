'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { setUser } from '@/src/features/auth/authSlice';
import { mockUsers } from '@/src/mock/users';
import ErrorModal from '@/src/components/ui/ErrorModal';

export default function LoginPage() {
    const dispatch = useDispatch();
    const router = useRouter();

    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!login.trim() || !password.trim()) {
            setError('Заполните логин и пароль');
            return;
        }

        const foundUser = mockUsers.find(
            (user) => user.login === login.trim() && user.password === password.trim()
        );

        if (!foundUser) {
            setError('Неверный логин или пароль');
            return;
        }

        setError('');

        dispatch(
            setUser({
                id: foundUser.id,
                name: foundUser.name,
                role: foundUser.role,
                avatarUrl: foundUser.avatarUrl,
            })
        );

        if (foundUser.role === 'TECHNICIAN') {
            router.push('/employee');
            return;
        }

        router.push('/orders');
    };
    return (
        <>
            {error && (
                <ErrorModal onClose={() => setError('')}>
                    {error}
                </ErrorModal>
            )}

            <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50">
            <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10">
                <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-2">
                    <div className="hidden flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
                        <div>
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-2xl font-black">
                                TT
                            </div>
                            <h1 className="max-w-sm text-4xl font-black leading-tight">
                                TeethTech CRM
                            </h1>
                            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                                Управление заказами, задачами и производственными этапами
                                зуботехнической лаборатории в одном интерфейсе.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-800 bg-slate-800/70 p-4">
                                <p className="text-sm font-semibold">Что будет в системе</p>
                                <p className="mt-2 text-sm text-slate-300">
                                    Заказы, статусы, задачи техников, аналитика и контроль сроков.
                                </p>
                            </div>
                            <p className="text-xs text-slate-400">
                                © 2026 TeethTech. Internal CRM mockup.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center p-6 sm:p-10">
                        <div className="w-full max-w-md">
                            <div className="mb-8 lg:hidden">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white">
                                    TT
                                </div>
                                <h1 className="text-3xl font-black text-slate-900">
                                    TeethTech CRM
                                </h1>
                                <p className="mt-2 text-sm text-slate-500">
                                    Вход в систему лаборатории
                                </p>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-slate-900">
                                    Добро пожаловать
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Введите логин и пароль для входа в рабочую панель
                                </p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Логин
                                    </label>
                                    <input
                                        type="text"
                                        value={login}
                                        onChange={(e) => setLogin(e.target.value)}
                                        placeholder="Введите логин"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Пароль
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600 active:scale-[0.99]"
                                >
                                    Войти
                                </button>
                            </form>

                            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                                Для мокапа можешь входить с любыми значениями.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
