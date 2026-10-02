import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { tokenStorage } from '../../services/apiClient';

export interface AdminUser {
  id: number;
  public_id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'staff';
}

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: 'idle',
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AdminUser; token: string }>
    ) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.status = 'authenticated';
      tokenStorage.setToken(action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'unauthenticated';
      tokenStorage.clearToken();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
