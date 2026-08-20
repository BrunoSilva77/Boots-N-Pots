# Boots'N Pots - Development Server Manager
# Script para iniciar e manter o servidor online

param(
    [switch]$Stop,
    [switch]$Status
)

$projectPath = "C:\Users\Usuario\Desktop\projetos\Boots'N Pots\BootsN-Pots-Web"
$logFile = "$projectPath\server.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor Green
    Add-Content -Path $logFile -Value $logMessage
}

function Stop-Server {
    $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
        Where-Object { $_.CommandLine -like "*vite*" }
    
    if ($processes) {
        $processes | Stop-Process -Force
        Write-Log "Servidor parado com sucesso!"
    } else {
        Write-Log "Nenhum servidor encontrado rodando."
    }
}

function Get-ServerStatus {
    $port = 5173
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    
    if ($connection) {
        Write-Log "Servidor rodando em http://localhost:$port"
        return $true
    } else {
        Write-Log "Servidor offline"
        return $false
    }
}

function Start-Server {
    # Verifica se já está rodando
    if (Get-ServerStatus) {
        Write-Log "Servidor já está rodando!"
        return
    }

    Write-Log "Iniciando Boots'N Pots Development Server..."
    
    # Muda para o diretório do projeto
    Set-Location -Path $projectPath
    
    # Verifica se as dependências estão instaladas
    if (-not (Test-Path "node_modules")) {
        Write-Log "Instalando dependências..."
        npm install
    }
    
    # Inicia o servidor em background
    $job = Start-Job -ScriptBlock {
        param($path)
        Set-Location -Path $path
        npm run dev
    } -ArgumentList $projectPath
    
    # Espera um pouco para o servidor iniciar
    Start-Sleep -Seconds 3
    
    # Verifica se iniciou
    if (Get-ServerStatus) {
        Write-Log "Servidor iniciado com sucesso!"
        Write-Log "Acesse: http://localhost:5173/"
    } else {
        Write-Log "Erro ao iniciar servidor. Verifique os logs."
    }
}

# Menu principal
switch ($true) {
    $Stop { Stop-Server }
    $Status { Get-ServerStatus }
    default {
        Clear-Host
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "   Boots'N Pots - Server Manager" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Opções:" -ForegroundColor Yellow
        Write-Host "  1. Iniciar servidor" -ForegroundColor White
        Write-Host "  2. Parar servidor" -ForegroundColor White
        Write-Host "  3. Verificar status" -ForegroundColor White
        Write-Host "  4. Sair" -ForegroundColor White
        Write-Host ""
        
        $choice = Read-Host "Selecione uma opção"
        
        switch ($choice) {
            "1" { Start-Server }
            "2" { Stop-Server }
            "3" { Get-ServerStatus }
            "4" { exit }
            default { Write-Host "Opção inválida!" -ForegroundColor Red }
        }
        
        Write-Host ""
        Write-Host "Pressione qualquer tecla para continuar..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}
