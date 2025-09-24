#!/bin/bash

# Script de Deploy para Docker Hub - RG Pulse
# Autor: RG Pulse Team
# Data: $(date +"%Y-%m-%d")

# Configurações
DOCKER_USERNAME="monrars95"
IMAGE_NAME="rg-pulse"
TAG="latest"
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando deploy do RG Pulse para Docker Hub${NC}"
echo -e "${CYAN}📦 Imagem: $FULL_IMAGE_NAME${NC}"
echo ""

# Verificar se o Docker está rodando
echo -e "${YELLOW}🔍 Verificando se o Docker está rodando...${NC}"
if ! docker version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando. Inicie o Docker e tente novamente.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker está rodando${NC}"

# Verificar se está logado no Docker Hub
echo -e "${YELLOW}🔐 Verificando login no Docker Hub...${NC}"
if docker info 2>/dev/null | grep -q "Username"; then
    echo -e "${GREEN}✅ Logado no Docker Hub${NC}"
else
    echo -e "${YELLOW}⚠️  Não está logado no Docker Hub. Fazendo login...${NC}"
    docker login
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Falha no login do Docker Hub${NC}"
        exit 1
    fi
fi

# Sincronizar dependências
echo -e "${YELLOW}🔄 Sincronizando dependências...${NC}"
if [ -f "package-lock.json" ]; then
    rm package-lock.json
    echo -e "${GRAY}🗑️  package-lock.json removido${NC}"
fi

npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha na instalação das dependências${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependências sincronizadas${NC}"

# Construir a imagem Docker
echo -e "${YELLOW}🏗️  Construindo imagem Docker...${NC}"
echo -e "${GRAY}📝 Comando: docker build -t $FULL_IMAGE_NAME .${NC}"

docker build -t $FULL_IMAGE_NAME .
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha na construção da imagem Docker${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Imagem construída com sucesso${NC}"

# Testar a imagem localmente (opcional)
read -p "🧪 Deseja testar a imagem localmente antes do push? (s/N): " test_local
if [[ $test_local == "s" || $test_local == "S" ]]; then
    echo -e "${YELLOW}🧪 Testando imagem localmente na porta 3000...${NC}"
    echo -e "${GRAY}📝 Comando: docker run -d -p 3000:3000 --name rg-pulse-test $FULL_IMAGE_NAME${NC}"
    
    # Parar e remover container de teste se existir
    docker stop rg-pulse-test 2>/dev/null
    docker rm rg-pulse-test 2>/dev/null
    
    docker run -d -p 3000:3000 --name rg-pulse-test $FULL_IMAGE_NAME
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Container de teste iniciado${NC}"
        echo -e "${CYAN}🌐 Acesse: http://localhost:3000${NC}"
        echo -e "${YELLOW}⏳ Aguardando 10 segundos para verificação...${NC}"
        sleep 10
        
        # Verificar se o container está rodando
        if docker ps --filter "name=rg-pulse-test" --format "table {{.Status}}" | grep -q "Up"; then
            echo -e "${GREEN}✅ Container está rodando corretamente${NC}"
        else
            echo -e "${YELLOW}⚠️  Container pode ter problemas. Verificando logs...${NC}"
            docker logs rg-pulse-test
        fi
        
        read -p "📤 Continuar com o push para Docker Hub? (S/n): " continue_deploy
        
        # Limpar container de teste
        docker stop rg-pulse-test
        docker rm rg-pulse-test
        echo -e "${GRAY}🧹 Container de teste removido${NC}"
        
        if [[ $continue_deploy == "n" || $continue_deploy == "N" ]]; then
            echo -e "${YELLOW}⏹️  Deploy cancelado pelo usuário${NC}"
            exit 0
        fi
    else
        echo -e "${RED}❌ Falha ao iniciar container de teste${NC}"
        exit 1
    fi
fi

# Fazer push para o Docker Hub
echo -e "${YELLOW}📤 Enviando imagem para Docker Hub...${NC}"
echo -e "${GRAY}📝 Comando: docker push $FULL_IMAGE_NAME${NC}"

docker push $FULL_IMAGE_NAME
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Falha no push para Docker Hub${NC}"
    exit 1
fi

# Sucesso!
echo ""
echo -e "${GREEN}🎉 Deploy concluído com sucesso!${NC}"
echo -e "${CYAN}📦 Imagem disponível em: https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME${NC}"
echo -e "${CYAN}🏷️  Tag: $TAG${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo -e "   1. Acesse o painel do Coolify"
echo -e "   2. Configure a aplicação para usar: $FULL_IMAGE_NAME"
echo -e "   3. Configure as portas: 3000:3000"
echo -e "   4. Faça o deploy no Coolify"
echo ""
echo -e "${YELLOW}🔧 Comandos úteis:${NC}"
echo -e "${GRAY}   docker images | grep $IMAGE_NAME${NC}"
echo -e "${GRAY}   docker run -p 3000:3000 $FULL_IMAGE_NAME${NC}"
echo -e "${GRAY}   docker logs <container_id>${NC}"

echo -e "${GREEN}✨ Script finalizado!${NC}"