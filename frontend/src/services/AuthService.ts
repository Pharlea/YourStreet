import { API_BASE_URL, apiFetch } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

class AuthService {
  private static instance: AuthService;
  private user: User | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Verificar se há usuário logado
  async checkCurrentUser(): Promise<User | null> {
    try {
      const response = await apiFetch('/auth/me');

      if (response.ok) {
        this.user = await response.json();
        return this.user;
      }
      
      this.user = null;
      return null;
    } catch (error) {
      console.error('Erro ao verificar usuário atual:', error);
      this.user = null;
      return null;
    }
  }

  // Iniciar login com Google
  async loginWithGoogle(): Promise<void> {
    try {
      // Redirecionar diretamente para o endpoint de login do Google
      window.location.href = `${API_BASE_URL}/auth/login/google`;
    } catch (error) {
      console.error('Erro ao iniciar login com Google:', error);
      throw error;
    }
  }

  // Fazer logout
  async logout(): Promise<void> {
    try {
      const response = await apiFetch('/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        this.user = null;
        // Redirecionar para home
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  }

  // Obter usuário atual
  getCurrentUser(): User | null {
    return this.user;
  }

  // Verificar se está logado
  isAuthenticated(): boolean {
    return this.user !== null;
  }
}

export default AuthService;