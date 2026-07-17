'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

import Sidebar from '@/src/components/layout/Sidebar';
import Header from '@/src/components/layout/Header';
import { getAuthRedirectPath } from '@/src/features/auth/authUtils';
import { RootState } from '@/src/lib/store';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isInitialized, role } = useSelector((state: RootState) => state.auth);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const syncSidebarState = () => setIsSidebarOpen(mediaQuery.matches);

        syncSidebarState();
        mediaQuery.addEventListener('change', syncSidebarState);

        return () => mediaQuery.removeEventListener('change', syncSidebarState);
    }, []);

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.replace('/auth/login');
        }
    }, [isAuthenticated, isInitialized, router]);

    useEffect(() => {
        if (
            isInitialized &&
            isAuthenticated &&
            role &&
            role !== 'FINANCIER' &&
            pathname.startsWith('/accounting')
        ) {
            router.replace(getAuthRedirectPath(role));
        }
    }, [isAuthenticated, isInitialized, pathname, role, router]);

    const isAccountingAccessDenied =
        isAuthenticated &&
        role !== null &&
        role !== 'FINANCIER' &&
        pathname.startsWith('/accounting');

    if (!isInitialized || !isAuthenticated || isAccountingAccessDenied) return null;

    return (
        <div className="relative flex h-dvh w-full overflow-hidden bg-slate-50">
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] lg:hidden"
                />
            )}

            {isSidebarOpen && (
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            )}

            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute left-4 top-4 z-50 hidden h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-lg transition-colors hover:bg-slate-800 lg:flex"
                    aria-label="Открыть навигацию"
                >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                        <path strokeLinecap="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
