@echo off
title Boots'N Pots - Setup
cd /d "C:\Users\Usuario\Desktop\projetos\Boots'N Pots\BootsN-Pots-Web"

echo ========================================
echo    Boots'N Pots - Configuração Inicial
echo ========================================
echo.

:: Verifica Node.js
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js não encontrado!
    echo Por favor, instale o Node.js de: https://nodejs.org
    pause
    exit /b 1
) else (
    echo [OK] Node.js encontrado: 
    node --version
)

echo.

:: Verifica npm
echo [2/4] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] npm não encontrado!
    pause
    exit /b 1
) else (
    echo [OK] npm encontrado:
    npm --version
)

echo.

:: Instala dependências
echo [3/4] Instalando dependências...
if exist "node_modules" (
    echo [INFO] node_modules já existe. Pulando instalação.
) else (
    npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependências!
        pause
        exit /b 1
    )
)

echo.

:: Verifica logo
echo [4/4] Verificando logo...
if exist "public\logoTCC.png" (
    echo [OK] Logo encontrada: public\logoTCC.png
) else (
    echo [WARN] Logo não encontrada em public\logoTCC.png
    echo Por favor, copie a logo para a pasta public
)

echo.
echo ========================================
echo    Configuração concluída!
echo ========================================
echo.
echo Para iniciar o servidor, execute:
echo   - start.bat (servidor básico)
echo   - auto-start.bat (servidor com monitoramento)
echo   - server-manager.ps1 (gerenciador avançado)
echo.
echo Ou digite 'npm run dev' neste terminal.
echo.
pause
