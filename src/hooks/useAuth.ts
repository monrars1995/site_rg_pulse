import { useState, useEffect } from 'react'
import { authService } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false
  })
  
  let isProcessingAuth = false

  useEffect(() => {
    // Verificar se há uma sessão salva no localStorage
    const checkStoredSession = () => {
      try {
        const storedSession = localStorage.getItem('auth_session')
        const storedUser = localStorage.getItem('auth_user')
        
        if (storedSession && storedUser) {
          const session = JSON.parse(storedSession)
          const user = JSON.parse(storedUser)
          
          // Verificar se a sessão ainda é válida (não expirou)
          if (session.expires_at && new Date(session.expires_at) > new Date()) {
            setAuthState({
              user,
              session,
              loading: false,
              isAuthenticated: true
            })
            return
          } else {
            // Sessão expirada, limpar localStorage
            localStorage.removeItem('auth_session')
            localStorage.removeItem('auth_user')
          }
        }
        
        // Não há sessão válida armazenada
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false
        })
      } catch (error) {
        console.error('Erro ao verificar sessão armazenada:', error)
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false
        })
      }
    }

    checkStoredSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Iniciando processo de login...')
      setAuthState(prev => ({ ...prev, loading: true }))
      
      // Usar nosso backend para autenticação
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002'
      console.log('🌐 URL do backend:', backendUrl)
      
      const response = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })
      
      const result = await response.json()
      console.log('📥 Resposta do backend:', result)
      
      if (!response.ok) {
        console.log('❌ Login falhou - resposta não OK')
        setAuthState(prev => ({ ...prev, loading: false }))
        return { 
          success: false, 
          error: result.error || 'Erro ao fazer login' 
        }
      }

      if (result.user && result.session) {
        console.log('✅ Login bem-sucedido, salvando sessão...')
        // Salvar sessão no localStorage para persistência
        localStorage.setItem('auth_session', JSON.stringify(result.session))
        localStorage.setItem('auth_user', JSON.stringify(result.user))
        
        const newAuthState = {
          user: result.user,
          session: result.session,
          loading: false,
          isAuthenticated: true
        }
        
        console.log('🔄 Atualizando estado de autenticação:', newAuthState)
        setAuthState(newAuthState)
        
        // Aguardar um pouco para garantir que o estado foi atualizado
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('🎯 Retornando sucesso para redirecionamento')
        
        return { success: true }
      } else {
        console.log('❌ Login falhou - dados inválidos na resposta')
        setAuthState(prev => ({ ...prev, loading: false }))
        return { 
          success: false, 
          error: 'Credenciais inválidas' 
        }
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setAuthState(prev => ({ ...prev, loading: false }))
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      // Usar nosso backend para logout
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_API_URL || 'http://localhost:3002'
      const token = authState.session?.access_token
      
      if (token) {
        await fetch(`${backendUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        })
      }
      
      // Limpar localStorage
      localStorage.removeItem('auth_session')
      localStorage.removeItem('auth_user')
      
      // Limpar o estado local
      setAuthState({
        user: null,
        session: null,
        loading: false,
        isAuthenticated: false
      })
    } catch (error) {
      console.error('Erro no logout:', error)
      // Mesmo com erro, limpar o estado local e localStorage
      localStorage.removeItem('auth_session')
      localStorage.removeItem('auth_user')
      setAuthState({
        user: null,
        session: null,
        loading: false,
        isAuthenticated: false
      })
    }
  }

  return {
    ...authState,
    signIn,
    signOut
  }
}