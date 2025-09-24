import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  console.log('🛡️ ProtectedRoute - Estado atual:', { isAuthenticated, loading });

  if (loading) {
    console.log('⏳ ProtectedRoute - Ainda carregando...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ ProtectedRoute - Não autenticado, redirecionando para login');
    return <Navigate to="/admin/login" replace />;
  }

  console.log('✅ ProtectedRoute - Autenticado, renderizando children');
  return <>{children}</>;
};

export default ProtectedRoute;