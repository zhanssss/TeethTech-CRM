'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

import Sidebar from '@/src/components/layout/Sidebar';
import Header from '@/src/components/layout/Header';
import { RootState } from '@/src/lib/store';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    return (
        <div className="relative flex h-screen w-full overflow-hidden bg-slate-50">
            {isSidebarOpen && (
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            )}

            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-lg transition-colors hover:bg-slate-800"
                    aria-label="Открыть сайдбар"
                >
                    ☰
                </button>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <Header />

                <main className="flex-1 overflow-y-auto p-8 pt-4">
                    {children}
                </main>
            </div>
        </div>
    );
}