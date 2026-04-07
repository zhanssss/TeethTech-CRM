'use client';

import Link from "next/link";
import {usePathname} from 'next/navigation';

const menuItems = [
    {name: 'Дэшборд', href: '/'},
    // {name: 'Заказы', href: '/orders'},
    {name: 'Аналитика', href: '/analytics'},
    {name: 'Доска задач', href: '/tasks'},
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen ">
            <div className="p-6 text-2xl font-bold border-b border-slate-800">
                TeethTech
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`block p-3 rounded-lg transaction-colors ${isActive ? 'bg-blue-600' : 'hover:bg-blue-800'}`}
                        >
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}