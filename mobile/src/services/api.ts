import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// TODO: 환경변수로 관리
const API_BASE_URL = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - 토큰 추가
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('wetee_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 처리
      await SecureStore.deleteItemAsync('wetee_auth_token');
      await SecureStore.deleteItemAsync('wetee_user');
      // TODO: 로그인 화면으로 리다이렉트
    }
    return Promise.reject(error);
  }
);

export default api;
