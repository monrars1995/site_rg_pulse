# ===========================================
# RG Pulse - Deploy Script for Windows/PowerShell
# ===========================================

param(
    [switch]$TestBuild,
    [switch]$SkipGitCheck,
    [switch]$Force
)

# Colors for output
$colors = @{
    Red = 'Red'
    Green = 'Green'
    Yellow = 'Yellow'
    Blue = 'Cyan'
    White = 'White'
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $colors.Red
}

function Test-RequiredFiles {
    $requiredFiles = @(
        'Dockerfile',
        'docker-compose.yml',
        '.dockerignore',
        '.env.example',
        'package.json',
        'server\package.json'
    )
    
    $missing = @()
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $missing += $file
        }
    }
    
    return $missing
}

function Test-GitStatus {
    try {
        $status = git status --porcelain 2>$null
        return $status
    }
    catch {
        Write-Warning "Git não encontrado ou não é um repositório Git"
        return $null
    }
}

function Test-DockerBuild {
    Write-Status "Testando build do Docker..."
    
    try {
        $buildResult = docker build -t rg-pulse-test . 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Build do Docker bem-sucedido"
            
            # Clean up test image
            docker rmi rg-pulse-test | Out-Null
            Write-Status "Imagem de teste removida"
            return $true
        }
        else {
            Write-Error "Falha no build do Docker:"
            Write-Host $buildResult -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Error "Docker não encontrado ou erro na execução"
        return $false
    }
}

# Main script
Clear-Host
Write-Host "🚀 Iniciando processo de deploy do RG Pulse..." -ForegroundColor $colors.Blue
Write-Host ""

# Check required files
Write-Status "Verificando arquivos necessários..."
$missingFiles = Test-RequiredFiles

if ($missingFiles.Count -gt 0) {
    Write-Error "Arquivos obrigatórios não encontrados:"
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Red
    }
    exit 1
}

Write-Success "Todos os arquivos necessários estão presentes"

# Check environment files
Write-Status "Verificando arquivos de ambiente..."

if (Test-Path ".env") {
    Write-Warning "Arquivo .env encontrado - certifique-se de que não está no Git"
}

if (Test-Path "server\.env") {
    Write-Warning "Arquivo server\.env encontrado - certifique-se de que não está no Git"
}

# Check .gitignore
Write-Status "Verificando configuração do .gitignore..."

if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -notmatch "node_modules") {
        Write-Error "node_modules não está no .gitignore!"
        exit 1
    }
    Write-Success "Configuração do .gitignore está correta"
}
else {
    Write-Warning "Arquivo .gitignore não encontrado"
}

# Test Docker build if requested
if ($TestBuild) {
    if (-not (Test-DockerBuild)) {
        exit 1
    }
}
elseif (-not $Force) {
    $testDocker = Read-Host "Deseja testar o build do Docker localmente? (y/N)"
    if ($testDocker -match '^[Yy]$') {
        if (-not (Test-DockerBuild)) {
            exit 1
        }
    }
}

# Check Git status
if (-not $SkipGitCheck) {
    Write-Status "Verificando status do Git..."
    
    $gitStatus = Test-GitStatus
    if ($gitStatus) {
        Write-Warning "Existem alterações não commitadas:"
        git status --short
        
        if (-not $Force) {
            $continue = Read-Host "Deseja continuar mesmo assim? (y/N)"
            if ($continue -notmatch '^[Yy]$') {
                Write-Error "Deploy cancelado. Commit suas alterações primeiro."
                exit 1
            }
        }
    }
    else {
        Write-Success "Repositório Git está limpo"
    }
    
    # Get current branch
    try {
        $currentBranch = git branch --show-current 2>$null
        Write-Status "Branch atual: $currentBranch"
    }
    catch {
        Write-Warning "Não foi possível determinar a branch atual"
    }
}

# Push to GitHub
if (-not $Force) {
    $pushGithub = Read-Host "Deseja fazer push para o GitHub agora? (Y/n)"
    
    if ($pushGithub -notmatch '^[Nn]$') {
        Write-Status "Fazendo push para o GitHub..."
        
        try {
            git push origin $currentBranch
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Push para GitHub bem-sucedido"
            }
            else {
                Write-Error "Falha no push para GitHub"
                exit 1
            }
        }
        catch {
            Write-Error "Erro ao executar git push"
            exit 1
        }
    }
}

# Display deployment checklist
Write-Host ""
Write-Status "📋 Checklist para deploy no Coolify:"
Write-Host ""
Write-Host "1. ✅ Arquivos de configuração criados" -ForegroundColor Green
Write-Host "2. ✅ Docker build testado (se solicitado)" -ForegroundColor Green
Write-Host "3. ✅ Código enviado para GitHub" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Próximos passos no Coolify:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Criar nova aplicação no Coolify"
Write-Host "2. Conectar ao repositório GitHub"
Write-Host "3. Configurar variáveis de ambiente (use .env.example como referência)"
Write-Host "4. Definir domínio e SSL"
Write-Host "5. Configurar health check: /health"
Write-Host "6. Iniciar deploy"
Write-Host ""
Write-Host "📚 Consulte o arquivo 'DEPLOY.md' para instruções detalhadas" -ForegroundColor Cyan
Write-Host ""

# Display environment variables reminder
Write-Warning "⚠️  IMPORTANTE: Variáveis de ambiente obrigatórias:"
Write-Host ""
Write-Host "• SUPABASE_URL"
Write-Host "• SUPABASE_ANON_KEY"
Write-Host "• SUPABASE_SERVICE_ROLE_KEY"
Write-Host "• GEMINI_API_KEY"
Write-Host "• A2A_AGENT_API_KEY"
Write-Host "• JWT_SECRET"
Write-Host "• FRONTEND_URL (seu domínio de produção)"
Write-Host ""
Write-Host "📄 Veja .env.example para lista completa" -ForegroundColor Cyan
Write-Host ""

Write-Success "🎉 Preparação para deploy concluída!"
Write-Status "Seu projeto está pronto para deploy no Coolify via GitHub."

Write-Host ""
Write-Host "💡 Dicas adicionais:" -ForegroundColor Yellow
Write-Host "• Use 'docker-compose up' para testar localmente"
Write-Host "• Monitore logs no painel do Coolify após deploy"
Write-Host "• Teste o endpoint /health após deploy"
Write-Host "• Configure alertas no Coolify para monitoramento"
Write-Host ""