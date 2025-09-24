import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { authService } from '../lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false
  })

  useEffect(() => {
    console.log('🔍 AuthProvider - Verificando sessão do Supabase Auth...')
    
    // Verificar sessão atual do Supabase
    const checkSession = async () => {
      try {
        const { session, error } = await authService.getSession()
        
        if (error) {
          console.log('❌ AuthProvider - Erro ao verificar sessão:', error.message)
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAuthenticated: false
          })
          return
        }

        if (session?.user) {
          // Verificar se o usuário é admin
          const isAdmin = session.user.user_metadata?.role === 'admin'
          
          if (!isAdmin) {
            console.log('❌ AuthProvider - Usuário não é admin')
            await authService.signOut()
            setAuthState({
              user: null,
              session: null,
              loading: false,
              isAuthenticated: false
            })
            return
          }

          console.log('✅ AuthProvider - Sessão válida encontrada para admin')
          setAuthState({
            user: session.user,
            session: session,
            loading: false,
            isAuthenticated: true
          })
        } else {
          console.log('❌ AuthProvider - Nenhuma sessão válida encontrada')
          setAuthState({
            user: null,
            session: null,
            loading: false,
            isAuthenticated: false
          })
        }
      } catch (error) {
        console.error('❌ AuthProvider - Erro ao verificar sessão:', error)
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false
        })
      }
    }

    checkSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      console.log('🔄 AuthProvider - Mudança de estado de auth:', event)
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Verificar se é admin
        const isAdmin = session.user.user_metadata?.role === 'admin'
        
        if (isAdmin) {
          console.log('✅ AuthProvider - Login realizado como admin')
          setAuthState({
            user: session.user,
            session: session,
            loading: false,
            isAuthenticated: true
          })
        } else {
          console.log('❌ AuthProvider - Usuário não é admin, fazendo logout')
          await authService.signOut()
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 AuthProvider - Logout realizado')
        setAuthState({
          user: null,
          session: null,
          loading: false,
          isAuthenticated: false
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔐 AuthProvider - Iniciando processo de login com Supabase Auth...')
      
      const { data, error } = await authService.signIn(email, password)
      
      if (error) {
        console.log('❌ AuthProvider - Erro no login:', error.message)
        return { success: false, error: error.message }
      }

      if (!data.user) {
        console.log('❌ AuthProvider - Nenhum usuário retornado')
        return { success: false, error: 'Credenciais inválidas' }
      }

      // Verificar se é admin
      const isAdmin = data.user.user_metadata?.role === 'admin'
      if (!isAdmin) {
        console.log('❌ AuthProvider - Usuário não é admin')
        await authService.signOut()
        return { success: false, error: 'Acesso negado. Usuário não tem permissão de administrador.' }
      }

      console.log('✅ AuthProvider - Login realizado com sucesso')
      return { success: true }
    } catch (error: any) {
      console.error('❌ AuthProvider - Erro no login:', error)
      return { success: false, error: error.message || 'Erro interno do servidor' }
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      console.log('👋 AuthProvider - Fazendo logout...')
      await authService.signOut()
      console.log('✅ AuthProvider - Logout realizado com sucesso')
    } catch (error) {
      console.error('❌ AuthProvider - Erro no logout:', error)
    }
  }

  const value: AuthContextType = {
    ...authState,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}