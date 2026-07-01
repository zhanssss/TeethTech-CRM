'use client';

import { type FormEvent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { setUser } from '@/src/features/auth/authSlice';
import { getAuthRedirectPath, normalizeAuthRole } from '@/src/features/auth/authUtils';
import type { AppDispatch } from '@/src/lib/store';
import { useLoginUserMutation } from '@/src/services/api/authApi';
import ErrorModal from '@/src/components/ui/ErrorModal';

export default function LoginPage() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const [loginUser, { isLoading }] = useLoginUserMutation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const emailValue = email.trim();
        const passwordValue = password;

        if (!emailValue || !passwordValue) {
            setError('Заполните email и пароль');
            return;
        }

        try {
            const response = await loginUser({
                email: emailValue,
                password: passwordValue,
            }).unwrap();

            const role = normalizeAuthRole(response.roles);

            setError('');

            dispatch(
                setUser({
                    id: response.id,
                    name: response.email,
                    role,
                    avatarUrl: '',
                    roles: response.roles,
                })
            );

            router.push(getAuthRedirectPath(role));
        } catch (requestError) {
            console.error('Ошибка входа:', requestError);
            setError('Неверный email или пароль');
        }
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
                            <p className="text-xs text-slate-400">
                                © 2026 TeethTech.
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
                                    Введите email и пароль для входа в рабочую панель
                                </p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Email
                                    </label>
                                    <input
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@example.com"
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
                                    disabled={isLoading}
                                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    {isLoading ? 'Вход...' : 'Войти'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
