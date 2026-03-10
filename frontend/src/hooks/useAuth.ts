import { useState, useEffect } from 'react';
import AuthService, { User } from '../services/AuthService';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authService = AuthService.getInstance();

  const login = () => {
    authService.loginWithGoogle();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.checkCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Verificar se o usuário voltou do login
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'success') {
      // Limpar o parâmetro da URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Recarregar o estado de autenticação
      setTimeout(() => {
        checkAuth();
      }, 100);
    }
  }, []);

  return {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    checkAuth,
  };
};