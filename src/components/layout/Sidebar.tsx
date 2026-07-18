'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/src/features/auth/authSlice';
import { AppDispatch, RootState } from '@/src/lib/store';
import { teethTechApi } from '@/src/services/teethTechApi';
import { useNotifications } from '@/src/features/notifications/useNotifications';
import TeethTechLogo from '@/src/components/branding/TeethTechLogo';

type MenuItem = {
    name: string;
    href: string;
    exact?: boolean;
    children?: {
        name: string;
        href: string;
    }[];
};

type SidebarProps = {
    isOpen: boolean;
    onClose: () => void;
};



export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { role } = useSelector((state: RootState) => state.auth);
    const { notifyError, notifySuccess } = useNotifications();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const menuItems: MenuItem[] = (() => {
        if (role === 'TECHNICIAN') {
            return [
                { name: 'Мой профиль', href: '/employee', exact: true },
                { name: 'Календарь', href: '/employee/calendar' },
                { name: 'Аналитика', href: '/employee/analytics' },
            ];
        }

        if (role === 'FINANCIER') {
            return [
                { name: 'Финансовый отчёт', href: '/accounting', exact: true },
                { name: 'Зарплаты', href: '/accounting/payroll', exact: true },
                { name: 'Счета', href: '/accounting/invoices' },
            ];
        }

        return [
                { name: 'Дэшборд', href: '/' },
                { name: 'Заказы', href: '/orders' },
                { name: 'Аналитика', href: '/analytics' },
                { name: 'Склад', href: '/warehouse' },
                {
                    name: 'Клиники',
                    href: '/clinics',
                    children: [
                        { name: 'Реестр', href: '/clinics' },
                        { name: 'Пациенты', href: '/clinics/patients' },
                    ],
                },
                {
                    name: 'Лаборатория',
                    href: '/laboratory',
                    children: [
                        { name: 'Сотрудники', href: '/laboratory/employees' },
                        { name: 'Цвета', href: '/laboratory/colors' },
                        { name: 'Типы работ', href: '/laboratory/work-types' },
                        { name: 'Workflow', href: '/laboratory/workflows' },
                    ],
                },
            ];
    })();

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`Logout failed with status ${response.status}`);
            }

            dispatch(logout());
            dispatch(teethTechApi.util.resetApiState());
            notifySuccess('Вы вышли из системы');
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout failed:', error);
            notifyError('Не удалось завершить сеанс. Проверьте подключение и повторите попытку.');
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleNavigate = () => {
        if (window.matchMedia('(max-width: 1023px)').matches) {
            onClose();
        }
    };

    return (
        <aside
            inert={!isOpen}
            aria-hidden={!isOpen}
            className={`fixed inset-y-0 left-0 z-50 h-dvh w-[min(18rem,85vw)] overflow-hidden transition-transform duration-300 ease-out motion-reduce:transition-none lg:static lg:z-auto lg:shrink-0 lg:translate-x-0 lg:transition-[width] ${
                isOpen
                    ? 'translate-x-0 lg:w-64'
                    : 'pointer-events-none -translate-x-full lg:w-0'
            }`}
        >
            <div className="flex h-full w-[min(18rem,85vw)] flex-col bg-slate-900 text-white shadow-2xl lg:w-64 lg:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-6">
                <TeethTechLogo
                    className="w-40 sm:w-full"
                    onDarkBackground
                    priority
                />

                <button
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                    aria-label="Закрыть сайдбар"
                >
                    ×
                </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto p-4">
                {menuItems.map((item) => {
                    const isParentActive =
                        pathname === item.href ||
                        (!item.exact && pathname.startsWith(`${item.href}/`));

                    return (
                        <div key={item.href}>
                            <Link
                                href={item.href}
                                onClick={handleNavigate}
                                className={`block rounded-lg p-3 text-sm font-medium transition-colors ${
                                    isParentActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                            >
                                {item.name}
                            </Link>

                            {item.children && isParentActive && (
                                <div className="mt-2 space-y-1 pl-4">
                                    {item.children.map((child) => {
                                        const isChildActive =
                                            pathname === child.href;

                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                onClick={handleNavigate}
                                                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                                    isChildActive
                                                        ? 'bg-slate-800 text-white'
                                                        : 'text-slate-500 hover:bg-slate-800 hover:text-white'
                                                }`}
                                            >
                                                {child.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="border-t border-slate-800 p-4">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="group flex w-full items-center gap-3 rounded-lg p-3 text-slate-400 transition-all hover:bg-red-600/20 hover:text-white disabled:cursor-wait disabled:opacity-60"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 group-hover:text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>

                    <span className="text-sm font-bold tracking-wide">
                        {isLoggingOut ? 'Выходим...' : 'Выйти из CRM'}
                    </span>
                </button>
            </div>
            </div>
        </aside>
    );
}
