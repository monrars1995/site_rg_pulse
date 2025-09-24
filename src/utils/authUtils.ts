import { authService } from '@/lib/supabase';

/**
 * Utilitário para obter o token de autenticação do Supabase
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { session } = await authService.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('❌ Erro ao obter token de autenticação:', error);
    return null;
  }
};

/**
 * Utilitário para fazer requisições autenticadas
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = await getAuthToken();
  
  if (!token) {
    // Redirecionar para login se não houver token
    window.location.href = '/admin/login';
    throw new Error('Token de autenticação não encontrado');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Se receber 401, redirecionar para login
  if (response.status === 401) {
    console.error('❌ Token inválido ou expirado, redirecionando para login');
    window.location.href = '/admin/login';
    throw new Error('Token inválido ou expirado');
  }

  return response;
};