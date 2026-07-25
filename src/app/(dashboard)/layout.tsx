'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

import Sidebar from '@/src/components/layout/Sidebar';
import Header from '@/src/components/layout/Header';
import {
    canAccessWorkZone,
    getAuthRedirectPath,
    normalizeAuthRoles,
    WORKSPACE_STORAGE_KEY,
} from '@/src/features/auth/authUtils';
import { RootState } from '@/src/lib/store';
import ChatNotifications from '@/src/components/Chat/ChatNotifications';
import ChatButton from '@/src/components/Chat/ChatButton';
import PersonalNotesModal from '@/src/components/personal-notes/PersonalNotesModal';
import QuickActionsMenu from '@/src/components/layout/QuickActionsMenu';
import Breadcrumbs from '@/src/components/layout/Breadcrumbs';

const SIDEBAR_STORAGE_KEY = 'teeth-tech-sidebar-open';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isInitialized, role, roles } = useSelector((state: RootState) => state.auth);
    const normalizedJwtRoles = normalizeAuthRoles(
        roles.length > 0 ? roles : role ? [role] : []
    );
    const isPayrollPage = pathname.startsWith('/accounting/payroll');
    const canViewAccounting = normalizedJwtRoles.includes('FINANCIER');
    const canViewPayroll =
        normalizedJwtRoles.some((item) =>
            ['ADMIN', 'FINANCIER', 'CHIEF_TECHNICIAN', 'HEAD_TECHNICIAN'].includes(item)
        );
    const canViewRoles =
        normalizedJwtRoles.includes('ADMIN')
        || normalizedJwtRoles.includes('CHIEF_TECHNICIAN');
    const canViewWorkZone = canAccessWorkZone(roles, role);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const syncSidebarState = () => {
            if (!mediaQuery.matches) {
                setIsSidebarOpen(false);
                return;
            }

            setIsSidebarOpen(
                window.localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'false'
            );
        };

        syncSidebarState();
        mediaQuery.addEventListener('change', syncSidebarState);

        return () => mediaQuery.removeEventListener('change', syncSidebarState);
    }, []);

    const setSidebarOpen = (nextOpen: boolean) => {
        setIsSidebarOpen(nextOpen);
        if (window.matchMedia('(min-width: 1024px)').matches) {
            window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextOpen));
        }
    };

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.replace('/auth/login');
        }
    }, [isAuthenticated, isInitialized, router]);

    useEffect(() => {
        if (!isAuthenticated) return;

        if (pathname.startsWith('/employee')) {
            window.localStorage.setItem(WORKSPACE_STORAGE_KEY, 'work');
            return;
        }

        if (
            pathname === '/'
            || [
                '/orders',
                '/analytics',
                '/warehouse',
                '/clinics',
                '/laboratory',
                '/accounting',
                '/tv-dashboard',
            ].some((prefix) => pathname.startsWith(prefix))
        ) {
            window.localStorage.setItem(WORKSPACE_STORAGE_KEY, 'management');
        }
    }, [isAuthenticated, pathname]);

    useEffect(() => {
        if (
            isInitialized &&
            isAuthenticated &&
            role &&
            pathname.startsWith('/accounting') &&
            (
                (isPayrollPage && !canViewPayroll)
                || (!isPayrollPage && !canViewAccounting)
            )
        ) {
            router.replace(getAuthRedirectPath(role, roles));
        }
    }, [canViewAccounting, canViewPayroll, isAuthenticated, isInitialized, isPayrollPage, pathname, role, roles, router]);

    useEffect(() => {
        if (
            isInitialized
            && isAuthenticated
            && role
            && pathname.startsWith('/laboratory/roles')
            && !canViewRoles
        ) {
            router.replace(getAuthRedirectPath(role, roles));
        }
    }, [canViewRoles, isAuthenticated, isInitialized, pathname, role, roles, router]);

    useEffect(() => {
        if (
            isInitialized
            && isAuthenticated
            && role
            && pathname.startsWith('/employee')
            && !canViewWorkZone
        ) {
            router.replace(getAuthRedirectPath(role, roles));
        }
    }, [canViewWorkZone, isAuthenticated, isInitialized, pathname, role, roles, router]);

    const isAccountingAccessDenied =
        isAuthenticated &&
        role !== null &&
        pathname.startsWith('/accounting') &&
        (
            (isPayrollPage && !canViewPayroll)
            || (!isPayrollPage && !canViewAccounting)
        );
    const isRolesAccessDenied =
        isAuthenticated
        && pathname.startsWith('/laboratory/roles')
        && !canViewRoles;
    const isWorkZoneAccessDenied =
        isAuthenticated
        && pathname.startsWith('/employee')
        && !canViewWorkZone;

    if (
        !isInitialized
        || !isAuthenticated
        || isAccountingAccessDenied
        || isRolesAccessDenied
        || isWorkZoneAccessDenied
    ) return null;

    return (
        <div className="relative flex h-dvh w-full overflow-hidden bg-slate-50 dark:bg-[#09090b]">
            <ChatNotifications />
            <ChatButton />
            <PersonalNotesModal />
            <QuickActionsMenu />
            <div
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
                className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-300 ease-out motion-reduce:transition-none lg:hidden ${
                    isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex min-w-0 flex-1 flex-col transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none">
                <Header
                    isMenuOpen={isSidebarOpen}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <Breadcrumbs />

                <main className="app-dashboard-main flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
