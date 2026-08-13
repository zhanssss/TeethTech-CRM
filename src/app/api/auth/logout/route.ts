import { NextRequest, NextResponse } from 'next/server';

import { clearAuthCookies } from '@/src/lib/serverAuthCookies';
import { revokeBackendSession } from '@/src/lib/serverAuthApi';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin');
    const fetchSite = request.headers.get('sec-fetch-site');

    if (origin ? origin !== request.nextUrl.origin : fetchSite !== 'same-origin') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await revokeBackendSession(request);

    const response = NextResponse.json(
        { ok: true },
        { headers: { 'Cache-Control': 'no-store, private' } },
    );
    clearAuthCookies(response);

    return response;
}
