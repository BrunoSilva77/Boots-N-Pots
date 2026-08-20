@echo off
title Boots'N Pots - Status
echo.
echo ========================================
echo    Boots'N Pots - Status do Servidor
echo ========================================
echo.

netstat -ano | findstr :5173 >nul 2>&1
if errorlevel 1 (
    echo [OFFLINE] Servidor não está rodando.
    echo.
    echo Para iniciar, execute:
    echo   - start.bat (servidor básico)
    echo   - auto-start.bat (servidor com monitoramento)
    echo.
) else (
    echo [ONLINE] Servidor rodando em: http://localhost:5173/
    echo.
    echo Processos do servidor:
    netstat -ano | findstr :5173
)

echo.
echo ========================================
echo.
pause
