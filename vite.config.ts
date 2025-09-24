import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000, // Frontend roda na porta 3000
    proxy: {
      // Redireciona requisições que começam com /api para o backend
      '/api': {
        target: 'http://localhost:3002', // URL do servidor backend (porta 3002)
        changeOrigin: true, // Necessário para virtual hosted sites
        secure: false, // Permite certificados auto-assinados
        ws: true, // Habilita WebSockets
        // Opcional: reescrever o caminho, se necessário
        // rewrite: (path) => path.replace(/^/api/, '') 
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
