'use client'

import {ReactNode, useEffect, useState} from "react";
import {Provider} from "react-redux";
import {finishAuthHydration, setUser} from '@/src/features/auth/authSlice';
import {normalizeAuthRole} from '@/src/features/auth/authUtils';
import type {AuthSession} from '@/src/types/auth.types';
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
            } catch {
                if (isMounted) {
                    store.dispatch(finishAuthHydration());
                }
            }
        };

        hydrateAuth();

        return () => {
            isMounted = false;
        };
    }, [store]);

    return <Provider store={store}>{children}</Provider>
}
