# Script para criar repositório no GitHub e fazer push
# Uso: ./push-to-github.ps1 -Username "seu_usuario" -Token "seu_token_github"

param(
    [string]$Username = "sergiodesenho1-collab",
    [string]$Token = ""
)

# Se não tiver token, solicitar
if (-not $Token) {
    $Token = Read-Host "Digite seu Personal Access Token do GitHub (https://github.com/settings/tokens)"
}

if (-not $Token) {
    Write-Host "Erro: Token é obrigatório" -ForegroundColor Red
    exit 1
}

$RepoName = "key-system"
$Description = "Sistema de Portaria com reconhecimento facial"

Write-Host "Criando repositório no GitHub..." -ForegroundColor Cyan

# Criar repositório via API
$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
}

$body = @{
    name = $RepoName
    description = $Description
    private = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "https://api.github.com/user/repos" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    Write-Host "✓ Repositório criado com sucesso!" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*422*") {
        Write-Host "⚠ Repositório já existe" -ForegroundColor Yellow
    } else {
        Write-Host "Erro ao criar repositório: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Configurando remote e fazendo push..." -ForegroundColor Cyan

# Configurar remote e fazer push
cd "c:\Users\segio\Desktop\progeto portaria\key-system"

git remote remove origin -ErrorAction SilentlyContinue
git remote add origin "https://${Username}:${Token}@github.com/${Username}/${RepoName}.git"
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Push feito com sucesso!" -ForegroundColor Green
    Write-Host "Seu repositório está em: https://github.com/${Username}/${RepoName}" -ForegroundColor Cyan
} else {
    Write-Host "✗ Erro ao fazer push" -ForegroundColor Red
    exit 1
}
