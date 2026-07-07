import { NextRequest, NextResponse } from 'next/server';

import {
    AUTH_TOKEN_COOKIE,
    clearAuthCookies,
    createAuthSession,
    getJwtMaxAgeSeconds,
    setAuthCookies,
} from '@/src/lib/serverAuthCookies';
import type { LoginResponse } from '@/src/types/auth.types';

export const dynamic = 'force-dynamic';

type RouteContext = {
    params: Promise<{
        path?: string[];
    }>;
};

const DEFAULT_BACKEND_API_BASE_URL = 'http://localhost:8081/api/v1';

const BACKEND_API_BASE_URL =
    process.env.BACKEND_API_BASE_URL ??
    process.env.API_BASE_URL ??
    DEFAULT_BACKEND_API_BASE_URL;

const BODYLESS_METHODS = new Set(['GET', 'HEAD']);
const BODYLESS_STATUSES = new Set([204, 304]);
const REQUEST_HEADERS_TO_SKIP = new Set([
    'accept-encoding',
    'connection',
    'content-length',
    'cookie',
    'host',
    'origin',
    'referer',
]);
const RESPONSE_HEADERS_TO_SKIP = new Set([
    'connection',
    'content-encoding',
    'content-length',
    'set-cookie',
    'transfer-encoding',
]);

function buildBackendUrl(path: string[], request: NextRequest) {
    const encodedPath = path.map((segment) => encodeURIComponent(segment)).join('/');
    const baseUrl = BACKEND_API_BASE_URL.replace(/\/+$/u, '');
    const targetUrl = new URL(`${baseUrl}/${encodedPath}`);

    request.nextUrl.searchParams.forEach((value, key) => {
        targetUrl.searchParams.append(key, value);
    });

    return targetUrl;
}

function buildRequestHeaders(request: NextRequest) {
    const headers = new Headers();

    request.headers.forEach((value, key) => {
        const normalizedKey = key.toLowerCase();

        if (
            REQUEST_HEADERS_TO_SKIP.has(normalizedKey) ||
            normalizedKey.startsWith('sec-fetch-')
        ) {
            return;
        }

        headers.set(key, value);
    });

    const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
}

function isMultipartRequest(request: NextRequest) {
    return request.headers
        .get('content-type')
        ?.toLowerCase()
        .startsWith('multipart/form-data') ?? false;
}

function buildResponseHeaders(headers: Headers) {
    const responseHeaders = new Headers();

    headers.forEach((value, key) => {
        if (!RESPONSE_HEADERS_TO_SKIP.has(key.toLowerCase())) {
            responseHeaders.set(key, value);
        }
    });

    return responseHeaders;
}

function makeProxyResponse(
    body: ArrayBuffer,
    backendResponse: Response,
    request: NextRequest
) {
    const responseBody =
        BODYLESS_STATUSES.has(backendResponse.status) || request.method === 'HEAD'
            ? null
            : body;

    return new NextResponse(responseBody, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: buildResponseHeaders(backendResponse.headers),
    });
}

function parseLoginResponse(body: ArrayBuffer): LoginResponse | null {
    try {
        return JSON.parse(new TextDecoder().decode(body)) as LoginResponse;
    } catch {
        return null;
    }
}

async function getRequestBody(request: NextRequest) {
    if (BODYLESS_METHODS.has(request.method)) return undefined;

    if (isMultipartRequest(request)) {
        return request.formData();
    }

    return request.arrayBuffer();
}

async function proxyRequest(request: NextRequest, context: RouteContext) {
    const { path = [] } = await context.params;
    const isLoginRequest =
        request.method === 'POST' && path.join('/') === 'auth/login';
    const targetUrl = buildBackendUrl(path, request);
    const headers = buildRequestHeaders(request);

    if (isMultipartRequest(request)) {
        headers.delete('content-type');
    }

    try {
        const backendResponse = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: await getRequestBody(request),
            cache: 'no-store',
            redirect: 'manual',
        });
        const responseBody = await backendResponse.arrayBuffer();

        if (isLoginRequest && backendResponse.ok) {
            const loginResponse = parseLoginResponse(responseBody);

            if (!loginResponse?.token) {
                return NextResponse.json(
                    { message: 'Сервер авторизации не вернул JWT-токен' },
                    { status: 502 }
                );
            }

            if (getJwtMaxAgeSeconds(loginResponse.token) <= 0) {
                return NextResponse.json(
                    { message: 'Сервер авторизации вернул истекший JWT-токен' },
                    { status: 502 }
                );
            }

            const session = createAuthSession(loginResponse);
            const response = NextResponse.json(session, {
                status: backendResponse.status,
            });

            setAuthCookies(response, loginResponse.token, session);

            return response;
        }

        const response = makeProxyResponse(responseBody, backendResponse, request);

        if (backendResponse.status === 401) {
            clearAuthCookies(response);
        }

        return response;
    } catch {
        return NextResponse.json(
            { message: 'Не удалось подключиться к серверу API' },
            { status: 502 }
        );
    }
}

export async function GET(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
    return proxyRequest(request, context);
}
