# Script de Deploy para Docker Hub - RG Pulse
# Autor: RG Pulse Team
# Data: $(Get-Date -Format "yyyy-MM-dd")

# Configurações
$DOCKER_USERNAME = "monrars95"
$IMAGE_NAME = "rg-pulse"
$TAG = "latest"
$FULL_IMAGE_NAME = "${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"

Write-Host "🚀 Iniciando deploy do RG Pulse para Docker Hub" -ForegroundColor Green
Write-Host "📦 Imagem: $FULL_IMAGE_NAME" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Docker está rodando
Write-Host "🔍 Verificando se o Docker está rodando..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "[OK] Docker está rodando" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Docker não está rodando. Inicie o Docker Desktop e tente novamente." -ForegroundColor Red
    exit 1
}

# Verificar se está logado no Docker Hub
Write-Host "🔐 Verificando login no Docker Hub..." -ForegroundColor Yellow
$dockerInfo = docker info 2>&1
if ($dockerInfo -match "Username") {
    Write-Host "[OK] Logado no Docker Hub" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Não está logado no Docker Hub. Fazendo login..." -ForegroundColor Yellow
    docker login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha no login do Docker Hub" -ForegroundColor Red
        exit 1
    }
}

# Sincronizar dependências
Write-Host "🔄 Sincronizando dependências..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "[INFO] package-lock.json removido" -ForegroundColor Gray
}

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha na instalação das dependências" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependências sincronizadas" -ForegroundColor Green

# Construir a imagem Docker com suporte multi-arquitetura
Write-Host "[BUILD] Construindo imagem Docker com suporte multi-arquitetura..." -ForegroundColor Yellow
Write-Host "[CMD] Comando: docker buildx build --platform linux/amd64,linux/arm64 -t $FULL_IMAGE_NAME . --load" -ForegroundColor Gray

# Verificar se buildx está disponível
try {
    docker buildx version | Out-Null
    Write-Host "[OK] Docker Buildx disponível" -ForegroundColor Green
} catch {
    Write-Host "[AVISO] Docker Buildx não disponível, usando build padrão..." -ForegroundColor Yellow
    docker build -t $FULL_IMAGE_NAME .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha na construção da imagem Docker" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Imagem construída com sucesso (build padrão)" -ForegroundColor Green
    return
}

# Criar builder se não existir
$builderExists = docker buildx ls | Select-String "multiarch"
if (-not $builderExists) {
    Write-Host "[CONFIG] Criando builder multi-arquitetura..." -ForegroundColor Yellow
    docker buildx create --name multiarch --use
    docker buildx inspect --bootstrap
}

# Build para múltiplas arquiteturas (sem --load para suporte multi-plataforma)
Write-Host "[BUILD] Construindo para múltiplas arquiteturas..." -ForegroundColor Yellow
docker buildx build --platform linux/amd64,linux/arm64 -t $FULL_IMAGE_NAME . --push
if ($LASTEXITCODE -ne 0) {
    Write-Host "[AVISO] Build multi-arquitetura falhou, tentando build local..." -ForegroundColor Yellow
    # Fallback para build local apenas para amd64
    docker buildx build --platform linux/amd64 -t $FULL_IMAGE_NAME . --load
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha na construção da imagem Docker" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Imagem construida localmente (amd64)" -ForegroundColor Green
} else {
    Write-Host "[OK] Imagem multi-arquitetura construida e enviada" -ForegroundColor Green
    # Pular teste local pois a imagem ja foi enviada
    Write-Host "[PUSH] Imagem ja foi enviada para Docker Hub" -ForegroundColor Cyan
    Write-Host "[SUCESSO] Deploy concluido com sucesso!" -ForegroundColor Green
    exit 0
}
Write-Host "[OK] Imagem construida com sucesso" -ForegroundColor Green

# Testar a imagem localmente (opcional)
$testLocal = Read-Host "🧪 Deseja testar a imagem localmente antes do push? (s/N)"
if ($testLocal -eq "s" -or $testLocal -eq "S") {
    Write-Host "🧪 Testando imagem localmente na porta 3001..." -ForegroundColor Yellow
    Write-Host "📝 Comando: docker run -d -p 3001:3001 --name rg-pulse-test $FULL_IMAGE_NAME" -ForegroundColor Gray
    
    # Parar e remover container de teste se existir
    docker stop rg-pulse-test 2>$null
    docker rm rg-pulse-test 2>$null
    
    docker run -d -p 3001:3001 --name rg-pulse-test $FULL_IMAGE_NAME
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Container de teste iniciado" -ForegroundColor Green
        Write-Host "[URL] Acesse: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "[WAIT] Aguardando 10 segundos para verificacao..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Verificar se o container está rodando
        $containerStatus = docker ps --filter "name=rg-pulse-test" --format "table {{.Status}}"
        if ($containerStatus -match "Up") {
            Write-Host "[OK] Container está rodando corretamente" -ForegroundColor Green
        } else {
            Write-Host "[AVISO] Container pode ter problemas. Verificando logs..." -ForegroundColor Yellow
            docker logs rg-pulse-test
        }
        
        $continueDeploy = Read-Host "[PUSH] Continuar com o push para Docker Hub? (S/n)"
        
        # Limpar container de teste
        docker stop rg-pulse-test
        docker rm rg-pulse-test
        Write-Host "[CLEANUP] Container de teste removido" -ForegroundColor Gray
        
        if ($continueDeploy -eq "n" -or $continueDeploy -eq "N") {
            Write-Host "[CANCELADO] Deploy cancelado pelo usuário" -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "❌ Falha ao iniciar container de teste" -ForegroundColor Red
        exit 1
    }
}

# Fazer push para o Docker Hub
Write-Host "📤 Enviando imagem para Docker Hub..." -ForegroundColor Yellow
Write-Host "📝 Comando: docker push $FULL_IMAGE_NAME" -ForegroundColor Gray

docker push $FULL_IMAGE_NAME
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha no push para Docker Hub" -ForegroundColor Red
    exit 1
}

# Sucesso!
Write-Host ""
Write-Host "[SUCESSO] Deploy concluido com sucesso!" -ForegroundColor Green
Write-Host "[DOCKER] Imagem disponivel em: https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME" -ForegroundColor Cyan
Write-Host "[TAG] Tag: $TAG" -ForegroundColor Cyan
Write-Host ""
Write-Host "[NEXT] Proximos passos:" -ForegroundColor Yellow
Write-Host "   1. Acesse o painel do Coolify" -ForegroundColor White
Write-Host "   2. Configure a aplicacao para usar: $FULL_IMAGE_NAME" -ForegroundColor White
Write-Host "   3. Configure as portas: 3000:3000" -ForegroundColor White
Write-Host "   4. Faca o deploy no Coolify" -ForegroundColor White
Write-Host ""
Write-Host "[UTILS] Comandos uteis:" -ForegroundColor Yellow
Write-Host "   docker images | grep $IMAGE_NAME" -ForegroundColor Gray
Write-Host "   docker run -p 3000:3000 $FULL_IMAGE_NAME" -ForegroundColor Gray
Write-Host "   docker logs [container_id]" -ForegroundColor Gray

Write-Host "[FIM] Script finalizado!" -ForegroundColor Green