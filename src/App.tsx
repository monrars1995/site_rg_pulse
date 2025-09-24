import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UnderConstruction from "./pages/UnderConstruction";
import BlogPage from "./pages/BlogPage"; 
import WhatWeDo from "./pages/WhatWeDo";
import InPractice from "./pages/InPractice";
import Cases from "./pages/Cases";
import DiagnosticoPage from "./pages/Diagnostico";
import AnnaPage from "./pages/Anna";

// Novas importações para o Blog (serão usadas em /blog-api)
import BlogListPage from "./pages/Blog/BlogListPage";
import BlogPostPage from "./pages/Blog/BlogPostPage";

// Importações para área administrativa
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ProtectedRoute from "./components/Admin/ProtectedRoute";

// Importação do contexto de autenticação
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => {
  // Show the regular site
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/o-que-fazemos" element={<WhatWeDo />} />
              <Route path="/na-pratica" element={<InPractice />} />
              <Route path="/blog" element={<BlogListPage />} /> 
              <Route path="/blog/:slug" element={<BlogPostPage />} /> 
              <Route path="/blog-api" element={<BlogListPage />} /> 
              <Route path="/blog-api/:slug" element={<BlogPostPage />} /> 
              <Route path="/cases" element={<Cases />} />
              <Route path="/diagnostico" element={<DiagnosticoPage />} />
              <Route path="/anna" element={<AnnaPage />} />
              
              {/* Rotas Administrativas */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
