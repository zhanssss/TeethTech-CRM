'use client'

import {ReactNode, useEffect, useState} from "react";
import {Provider} from "react-redux";
import {finishAuthHydration, setUser} from '@/src/features/auth/authSlice';
import {enqueueNotification} from '@/src/features/notifications/notificationsSlice';
import {normalizeAuthRole} from '@/src/features/auth/authUtils';
import type {AuthSession} from '@/src/types/auth.types';
import NotificationViewport from '@/src/components/ui/NotificationViewport';
import {makeStore} from '../lib/store';

export default function StoreProvider({children}: {children: ReactNode}){
 const [store] = useState(makeStore);

    useEffect(() => {
        let isMounted = true;

        const hydrateAuth = async () => {
            try {
                const response = await fetch('/api/auth/session', {
                    cache: 'no-store',
                    credentials: 'same-origin',
                });

                if (!isMounted) return;

                if (!response.ok) {
                    if (response.status !== 401) {
                        store.dispatch(
                            enqueueNotification({
                                tone: 'error',
                                message: 'Не удалось проверить текущую сессию. Попробуйте обновить страницу.',
                            })
                        );
                    }
                    store.dispatch(finishAuthHydration());
                    return;
                }

                const session = (await response.json()) as AuthSession;
                const role = normalizeAuthRole(session.roles);

                store.dispatch(
                    setUser({
                        id: session.id,
                        name: session.email,
                        role,
                        avatarUrl: '',
                        roles: session.roles,
                    })
                );
            } catch (error) {
                if (isMounted) {
                    console.error('Auth session hydration failed:', error);
                    store.dispatch(
                        enqueueNotification({
                            tone: 'error',
                            message: 'Нет связи с сервером авторизации. Проверьте подключение и повторите попытку.',
                        })
                    );
                    store.dispatch(finishAuthHydration());
                }
            }
        };

        hydrateAuth();

        return () => {
            isMounted = false;
        };
    }, [store]);

    return (
        <Provider store={store}>
            {children}
            <NotificationViewport />
        </Provider>
    );
}
