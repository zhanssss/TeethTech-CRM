import type { AuthRole } from '@/src/features/auth/authSlice';

export function normalizeAuthRole(roles: string[] = []): AuthRole {
    const normalizedRoles = roles.map((role) =>
        role.toUpperCase().replace(/^ROLE_/u, '')
    );

    if (normalizedRoles.includes('ADMIN')) return 'ADMIN';
    if (normalizedRoles.includes('CHIEF_TECHNICIAN')) return 'CHIEF_TECHNICIAN';
    if (normalizedRoles.includes('DISPATCHER')) return 'DISPATCHER';
    if (normalizedRoles.includes('FINANCIER')) return 'FINANCIER';

    return 'TECHNICIAN';
}

export function getAuthRedirectPath(role: AuthRole) {
    if (role === 'TECHNICIAN') return '/employee';
    if (role === 'FINANCIER') return '/accounting';
    if (role === 'CHIEF_TECHNICIAN') return '/laboratory/work-types';

    return '/orders';
}
