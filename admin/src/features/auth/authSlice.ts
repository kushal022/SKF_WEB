import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { tokenStorage } from '../../services/apiClient';

export interface AdminUser {
  public_id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'admin' | string;
  status: 'active' | string;
}

export interface AuthState {
  accessToken: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isInitializing: true, // Start in initializing state to allow startup session check
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AdminUser; accessToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isInitializing = false;
      state.isLoading = false;
      state.error = null;
      tokenStorage.setToken(action.payload.accessToken);
    },
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      tokenStorage.setToken(action.payload);
    },
    setUser: (state, action: PayloadAction<AdminUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitializing = false;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
      state.isLoading = false;
      state.error = null;
      tokenStorage.clearToken();
    },
  },
});

export const {
  setCredentials,
  updateAccessToken,
  setUser,
  setInitializing,
  setAuthLoading,
  setAuthError,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
