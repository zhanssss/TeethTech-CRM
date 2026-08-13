import { NextRequest, NextResponse } from 'next/server';

import {
    AUTH_TOKEN_COOKIE,
    AUTH_USER_COOKIE,
    clearAuthCookies,
    decodeAuthSession,
    isSecureRequest,
    isJwtExpired,
    setAuthCookies,
} from '@/src/lib/serverAuthCookies';
import {
    getSessionFromBackendAuth,
    refreshBackendSession,
} from '@/src/lib/serverAuthApi';

export const dynamic = 'force-dynamic';

function unauthorized() {
    const response = NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    clearAuthCookies(response);

    return response;
}

export async function GET(request: NextRequest) {
    const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
    const encodedSession = request.cookies.get(AUTH_USER_COOKIE)?.value;

	if (!token || !encodedSession || isJwtExpired(token)) {
        const refreshedAuth = await refreshBackendSession(request);

        if (refreshedAuth) {
            const refreshedSession = getSessionFromBackendAuth(refreshedAuth);
			const response = NextResponse.json(refreshedSession, {
                headers: { 'Cache-Control': 'no-store, private' },
            });
            setAuthCookies(response, refreshedAuth, refreshedSession, isSecureRequest(request));

            return response;
        }

        return unauthorized();
    }

    const session = decodeAuthSession(encodedSession);

    if (!session) {
        return unauthorized();
    }

	return NextResponse.json(session, {
        headers: { 'Cache-Control': 'no-store, private' },
    });
}
