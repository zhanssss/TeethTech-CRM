import {configureStore} from "@reduxjs/toolkit";
import {setupListeners} from "@reduxjs/toolkit/query";
import {teethTechApi } from '@/src/services/teethTechApi';
import authReducer from '@/src/features/auth/authSlice';
import notificationsReducer from '@/src/features/notifications/notificationsSlice';

export const makeStore = () =>{
    const store = configureStore({
        reducer: {
            auth: authReducer,
            notifications: notificationsReducer,
            [teethTechApi.reducerPath]: teethTechApi.reducer,
        },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware().concat(teethTechApi.middleware),
    })

    setupListeners(store.dispatch);

    return store;
}


export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
