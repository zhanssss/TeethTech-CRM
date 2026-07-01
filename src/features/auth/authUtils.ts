import type { AuthRole } from '@/src/features/auth/authSlice';

export function normalizeAuthRole(roles: string[] = []): AuthRole {
    const normalizedRoles = roles.map((role) =>
        role.toUpperCase().replace(/^ROLE_/u, '')
    );

    if (normalizedRoles.includes('ADMIN')) return 'ADMIN';
    if (normalizedRoles.includes('DISPATCHER')) return 'DISPATCHER';

    return 'TECHNICIAN';
}

export function getAuthRedirectPath(role: AuthRole) {
    return role === 'TECHNICIAN' ? '/employee' : '/orders';
}
