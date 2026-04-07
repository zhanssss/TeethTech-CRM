import {configureStore} from "@reduxjs/toolkit";
import {setupListeners} from "@reduxjs/toolkit/query";
import {teethTechApi } from '../services/teethTechApi';
import authReducer from './features/authSlice';

export const makeStore = () =>{

    return configureStore({
        reducer: {
            auth: authReducer,
            [teethTechApi.reducerPath]: teethTechApi.reducer,
        },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware().concat(teethTechApi.middleware),
    })
}


export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];