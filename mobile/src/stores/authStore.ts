import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'TEACHER' | 'STUDENT' | 'PARENT';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'TEACHER' | 'STUDENT' | 'PARENT';
}

const TOKEN_KEY = 'wetee_auth_token';
const USER_KEY = 'wetee_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.access_token) {
        await SecureStore.setItemAsync(TOKEN_KEY, response.access_token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));

        set({
          user: response.user,
          token: response.access_token,
          isAuthenticated: true,
        });

        return { success: true };
      }

      return { success: false, error: '로그인에 실패했습니다' };
    } catch (error: any) {
      const message = error.response?.data?.detail || '로그인에 실패했습니다';
      return { success: false, error: message };
    }
  },

  register: async (data) => {
    try {
      const response = await authService.register(data);

      if (response.access_token) {
        await SecureStore.setItemAsync(TOKEN_KEY, response.access_token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));

        set({
          user: response.user,
          token: response.access_token,
          isAuthenticated: true,
        });

        return { success: true };
      }

      return { success: false, error: '회원가입에 실패했습니다' };
    } catch (error: any) {
      const message = error.response?.data?.detail || '회원가입에 실패했습니다';
      return { success: false, error: message };
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);

      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
