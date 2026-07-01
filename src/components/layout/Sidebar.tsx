'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/src/features/auth/authSlice';
import { AppDispatch, RootState } from '@/src/lib/store';
import { teethTechApi } from '@/src/services/teethTechApi';

type MenuItem = {
    name: string;
    href: string;
    children?: {
        name: string;
        href: string;
    }[];
};

type SidebarProps = {
    onClose: () => void;
};



export default function Sidebar({ onClose }: SidebarProps) {
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { role } = useSelector((state: RootState) => state.auth);

    const menuItems: MenuItem[] =
        role === 'TECHNICIAN'
            ? [
                { name: 'Мой профиль', href: '/employee' },
                { name: 'Календарь', href: '/employee/calendar' },
                { name: 'Аналитика', href: '/employee/analytics' },
            ]
            : [
                { name: 'Дэшборд', href: '/' },
                { name: 'Заказы', href: '/orders' },
                { name: 'Аналитика', href: '/analytics' },
                { name: 'Бухгалтерия', href: '/accounting' },
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

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
            });
        } finally {
            dispatch(logout());
            dispatch(teethTechApi.util.resetApiState());
            router.push('/auth/login');
        }
    };

    const handleNavigate = () => {
        if (window.matchMedia('(max-width: 1023px)').matches) {
            onClose();
        }
    };

    return (
        <aside className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(18rem,85vw)] flex-col bg-slate-900 text-white shadow-2xl lg:static lg:w-64 lg:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-6">
                <div className="flex min-w-0 items-center gap-2 text-xl font-bold sm:text-2xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm">
                        TT
                    </div>
                    <span className="truncate">TeethTech</span>
                </div>

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
                        (item.href !== '/employee' && pathname.startsWith(`${item.href}/`));

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

                    <span className="text-sm font-bold tracking-wide">
                        Выйти из CRM
                    </span>
                </button>
            </div>
        </aside>
    );
}
