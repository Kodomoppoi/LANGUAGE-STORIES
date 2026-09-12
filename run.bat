@echo off
setlocal enabledelayedexpansion
title Language Stories - Inicializador Inteligente

cd /d "%~dp0"

echo ======================================================
echo    INICIANDO LANGUAGE STORIES (BACKEND + FRONTEND)
echo ======================================================
echo.

REM 1. Checar se Node.js esta instalado
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no sistema!
    echo Por favor, instale o Node.js v18+ em: https://nodejs.org/
    pause
    exit /b 1
)

REM 2. Checar se Python esta instalado
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Python nao foi encontrado no sistema!
    echo Por favor, instale o Python v3.10+ em: https://www.python.org/
    pause
    exit /b 1
)

REM 3. Checar e criar .env se nao existir
if not exist ".env" (
    if not exist "backend\.env" (
        echo [INFO] Criando arquivo .env a partir de backend\.env.example...
        if exist "backend\.env.example" (
            copy "backend\.env.example" ".env" >nul
            echo [OK] Arquivo .env criado na raiz.
        )
    )
)

REM 4. Checar e instalar dependencias raiz
if not exist "node_modules" (
    echo [INFO] Instalando dependencias da raiz do projeto...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao instalar dependencias da raiz.
        pause
        exit /b 1
    )
)

REM 5. Checar e instalar dependencias do Frontend
if not exist "frontend\node_modules" (
    echo [INFO] Instalando dependencias do Frontend...
    call npm install --prefix frontend
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao instalar dependencias do frontend.
        pause
        exit /b 1
    )
)

REM 6. Checar e configurar ambiente virtual Python
if not exist ".venv\Scripts\python.exe" (
    echo [INFO] Criando ambiente virtual Python .venv...
    python -m venv .venv
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao criar ambiente virtual Python.
        pause
        exit /b 1
    )
    echo [INFO] Instalando bibliotecas Python do backend...
    call .\.venv\Scripts\pip install -r backend\requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao instalar requirements.txt.
        pause
        exit /b 1
    )
)

echo.
echo ======================================================
echo  Backend:  http://localhost:8000 (Swagger: http://localhost:8000/docs)
echo  Frontend: http://localhost:5173
echo.
echo  Pressione Ctrl+C para encerrar ambos os servicos.
echo ======================================================
echo.

call npm run dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo Ocorreu um erro ao executar a aplicacao.
    pause
)
