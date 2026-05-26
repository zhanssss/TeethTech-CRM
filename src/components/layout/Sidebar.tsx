'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/src/features/auth/authSlice';
import { RootState } from '@/src/lib/store';

export default function Sidebar() {
    const pathname = usePathname();
    const dispatch = useDispatch();
    const router = useRouter();
    const { role } = useSelector((state: RootState) => state.auth);

    const menuItems =
        role === 'TECHNICIAN'
            ? [
                { name: 'Мой кабинет', href: '/employee' },
                { name: 'Моя доска', href: '/employee/board' },
                { name: 'Календарь', href: '/employee/calendar' },
                { name: 'Моя аналитика', href: '/employee/analytics' },
            ]
            : [
                { name: 'Дэшборд', href: '/' },
                { name: 'Заказы', href: '/orders' },
                { name: 'Аналитика', href: '/analytics' },
                { name: 'Сотрудники', href: '/employees' },
                {name: 'Клиники', href: '/clinics' },
                {name: 'Пациенты', href: '/patients' },
            ];

    const handleLogout = () => {
        dispatch(logout());
        router.push('/auth/login');
    };

    return (
        <aside className="flex h-screen w-64 flex-col bg-slate-900 text-white">
            <div className="flex items-center gap-2 border-b border-slate-800 p-6 text-2xl font-bold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm">
                    TT
                </div>
                TeethTech
            </div>

            <nav className="flex-1 space-y-2 p-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block rounded-lg p-3 text-sm font-medium transition-colors ${
                                isActive
                                    ? 'bg-blue-600 shadow-lg shadow-blue-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-800 p-4">
                <button
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-3 rounded-lg p-3 text-slate-400 transition-all hover:bg-red-600/20 hover:text-white"
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
                    <span className="text-sm font-bold tracking-wide">Выйти из CRM</span>
                </button>
            </div>
        </aside>
    );
}