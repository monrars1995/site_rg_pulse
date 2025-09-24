#!/bin/bash

# ===========================================
# RG Pulse - Deploy Script for Coolify
# ===========================================

set -e  # Exit on any error

echo "🚀 Iniciando processo de deploy do RG Pulse..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
print_status "Verificando arquivos necessários..."

required_files=(
    "Dockerfile"
    "docker-compose.yml"
    ".dockerignore"
    ".env.example"
    "package.json"
    "server/package.json"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Arquivo obrigatório não encontrado: $file"
        exit 1
    fi
done

print_success "Todos os arquivos necessários estão presentes"

# Check if .env files exist (they should not be in git)
print_status "Verificando arquivos de ambiente..."

if [ -f ".env" ]; then
    print_warning "Arquivo .env encontrado - certifique-se de que não está no Git"
fi

if [ -f "server/.env" ]; then
    print_warning "Arquivo server/.env encontrado - certifique-se de que não está no Git"
fi

# Check if node_modules are ignored
print_status "Verificando se node_modules está no .gitignore..."

if ! grep -q "node_modules" .gitignore; then
    print_error "node_modules não está no .gitignore!"
    exit 1
fi

print_success "Configuração do .gitignore está correta"

# Test Docker build locally (optional)
read -p "Deseja testar o build do Docker localmente? (y/N): " test_docker

if [[ $test_docker =~ ^[Yy]$ ]]; then
    print_status "Testando build do Docker..."
    
    if docker build -t rg-pulse-test .; then
        print_success "Build do Docker bem-sucedido"
        
        # Clean up test image
        docker rmi rg-pulse-test
        print_status "Imagem de teste removida"
    else
        print_error "Falha no build do Docker"
        exit 1
    fi
fi

# Check Git status
print_status "Verificando status do Git..."

if [ -n "$(git status --porcelain)" ]; then
    print_warning "Existem alterações não commitadas:"
    git status --short
    
    read -p "Deseja continuar mesmo assim? (y/N): " continue_anyway
    if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
        print_error "Deploy cancelado. Commit suas alterações primeiro."
        exit 1
    fi
else
    print_success "Repositório Git está limpo"
fi

# Get current branch
current_branch=$(git branch --show-current)
print_status "Branch atual: $current_branch"

# Push to GitHub
read -p "Deseja fazer push para o GitHub agora? (Y/n): " push_github

if [[ ! $push_github =~ ^[Nn]$ ]]; then
    print_status "Fazendo push para o GitHub..."
    
    if git push origin "$current_branch"; then
        print_success "Push para GitHub bem-sucedido"
    else
        print_error "Falha no push para GitHub"
        exit 1
    fi
fi

# Display deployment checklist
print_status "\n📋 Checklist para deploy no Coolify:"
echo ""
echo "1. ✅ Arquivos de configuração criados"
echo "2. ✅ Docker build testado (se solicitado)"
echo "3. ✅ Código enviado para GitHub"
echo ""
echo "🔧 Próximos passos no Coolify:"
echo ""
echo "1. Criar nova aplicação no Coolify"
echo "2. Conectar ao repositório GitHub"
echo "3. Configurar variáveis de ambiente (use .env.example como referência)"
echo "4. Definir domínio e SSL"
echo "5. Configurar health check: /health"
echo "6. Iniciar deploy"
echo ""
echo "📚 Consulte o arquivo 'coolify-deploy.md' para instruções detalhadas"
echo ""

# Display environment variables reminder
print_warning "\n⚠️  IMPORTANTE: Variáveis de ambiente obrigatórias:"
echo ""
echo "• SUPABASE_URL"
echo "• SUPABASE_ANON_KEY"
echo "• SUPABASE_SERVICE_ROLE_KEY"
echo "• GEMINI_API_KEY"
echo "• A2A_AGENT_API_KEY"
echo "• JWT_SECRET"
echo "• FRONTEND_URL (seu domínio de produção)"
echo ""
echo "📄 Veja .env.example para lista completa"
echo ""

print_success "\n🎉 Preparação para deploy concluída!"
print_status "Seu projeto está pronto para deploy no Coolify via GitHub."

echo ""