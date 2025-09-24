import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yheraepvupdsimzjfbva.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZXJhZXB2dXBkc2ltempmYnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NjAzMzcsImV4cCI6MjA3NDIzNjMzN30.p501kIOvdEdJ_3fh8gdvN9fmX3r4bMbTPvBcwgWjigU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Funções de autenticação simplificadas
export const authService = {
  // Login com email e senha
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Obter usuário atual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Verificar se o usuário está autenticado
  async isAuthenticated() {
    const { user } = await this.getCurrentUser()
    return !!user
  },

  // Verificar se o usuário é admin
  async isAdmin() {
    const { user } = await this.getCurrentUser()
    return user?.user_metadata?.role === 'admin'
  },

  // Obter sessão atual
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Escutar mudanças de autenticação
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}