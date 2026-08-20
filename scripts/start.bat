@echo off
title Boots'N Pots - Dev Server
cd /d "C:\Users\Usuario\Desktop\projetos\Boots'N Pots\BootsN-Pots-Web"

echo ========================================
echo    Boots'N Pots - Iniciando Sistema
echo ========================================
echo.

:: Verifica se o Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js não encontrado! Instale o Node.js primeiro.
    pause
    exit /b 1
)

:: Verifica se as dependências estão instaladas
if not exist "node_modules" (
    echo [INFO] Instalando dependências...
    npm install
    echo.
)

echo [INFO] Iniciando servidor de desenvolvimento...
echo [INFO] Acesse: http://localhost:5173/
echo [INFO] Pressione Ctrl+C para parar o servidor
echo.

:: Inicia o servidor com reconexão automática
:restart
npm run dev
echo.
echo [WARN] Servidor parou. Reiniciando em 3 segundos...
timeout /t 3 /nobreak >nul
goto restart
