import api from './api';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: 'TEACHER' | 'STUDENT' | 'PARENT';
  };
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'TEACHER' | 'STUDENT' | 'PARENT';
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  resetPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', { email });
    return response.data;
  },

  getMe: async (): Promise<LoginResponse['user']> => {
    const response = await api.get('/users/me');
    return response.data;
  },
};

export default authService;
