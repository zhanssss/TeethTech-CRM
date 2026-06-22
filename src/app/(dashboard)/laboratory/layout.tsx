'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
    { label: 'Сотрудники', href: '/laboratory/employees' },
    { label: 'Цвета', href: '/laboratory/colors' },
    { label: 'Типы работ', href: '/laboratory/work-types' },
    { label: 'Workflow', href: '/laboratory/workflows' },
];

export default function LaboratoryLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();

    return (
        <div className="space-y-4">
            <nav
                aria-label="Разделы лаборатории"
                className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
            >
                <div className="flex min-w-max gap-2">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {children}
        </div>
    );
}
