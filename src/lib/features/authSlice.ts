import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
    id: string | null;
    name: string | null;
    role: 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN' | null;
    avatarUrl?: string;
    isAuthenticated: boolean;
}

const initialState: UserState = {
    id: '1',
    name: 'Жансерик Базаров',
    role: 'DISPATCHER', // Поменяй на TECHNICIAN, чтобы увидеть разницу в хедере
    isAuthenticated: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Этот экшен мы вызовем, когда получим данные от Spring Boot
        setUser: (state, action: PayloadAction<Omit<UserState, 'isAuthenticated'>>) => {
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.role = action.payload.role;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.id = null;
            state.name = null;
            state.role = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;