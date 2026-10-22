# Boots'N Pots - Auto Start on Windows Login
# Este script inicia o servidor automaticamente no login do Windows

$projectPath = "C:\Users\Usuario\Desktop\projetos\Boots'N Pots\BootsN-Pots-Web"
$scriptPath = "$projectPath\start.bat"

# Verifica se o servidor já está rodando
$port = 5173
$connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connection) {
    Write-Host "Servidor já está rodando em http://localhost:$port" -ForegroundColor Green
} else {
    Write-Host "Iniciando Boots'N Pots Development Server..." -ForegroundColor Yellow
    
    # Inicia o servidor em background
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "`"$scriptPath`"" -WindowStyle Minimized
    
    Write-Host "Servidor iniciado! Acesse: http://localhost:$port" -ForegroundColor Green
}
