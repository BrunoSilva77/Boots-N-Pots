@echo off
title Boots'N Pots - Auto Start
cd /d "C:\Users\Usuario\Desktop\projetos\Boots'N Pots\BootsN-Pots-Web"

echo ========================================
echo    Boots'N Pots - Auto Start Server
echo ========================================
echo.
echo Este script irá iniciar o servidor e mantê-lo online.
echo Pressione Ctrl+C para parar.
echo.

:: Inicia o servidor com monitoramento
:loop
echo [%time%] Verificando servidor...
netstat -ano | findstr :5173 >nul 2>&1
if errorlevel 1 (
    echo [%time%] Servidor offline. Iniciando...
    start /b npm run dev
    timeout /t 5 /nobreak >nul
) else (
    echo [%time%] Servidor online.
)
timeout /t 10 /nobreak >nul
goto loop
