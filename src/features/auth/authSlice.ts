import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AuthRole = 'ADMIN' | 'DISPATCHER' | 'TECHNICIAN';

interface UserState {
    id: string | null;
    name: string | null;
    role: AuthRole | null;
    avatarUrl?: string;
    token?: string;
    roles: string[];
    isAuthenticated: boolean;
}

const initialState: UserState = {
    id: null,
    name: null,
    role: null,
    roles: [],
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {

        setUser: (state, action: PayloadAction<Omit<UserState, 'isAuthenticated'>>) => {
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.role = action.payload.role;
            state.avatarUrl = action.payload.avatarUrl;
            state.token = action.payload.token;
            state.roles = action.payload.roles ?? [];
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.id = null;
            state.name = null;
            state.role = null;
            state.avatarUrl = undefined;
            state.token = undefined;
            state.roles = [];
            state.isAuthenticated = false;
        },
    },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
