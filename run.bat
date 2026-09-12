@echo off
setlocal enabledelayedexpansion
title Language Stories - Smart Launcher

cd /d "%~dp0"

echo ======================================================
echo    STARTING LANGUAGE STORIES (BACKEND + FRONTEND)
echo ======================================================
echo.

REM 1. Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Node.js was not found on your system!
    echo Node.js 18+ is required to run the frontend and orchestration services.
    echo.
    set /p INSTALL_NODE="Would you like to automatically download and install Node.js LTS via winget? (Y/N): "
    if /i "!INSTALL_NODE!"=="Y" (
        echo.
        echo [INFO] Downloading and installing Node.js LTS via winget...
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        if !ERRORLEVEL! equ 0 (
            echo.
            echo [SUCCESS] Node.js installed successfully!
            echo [NOTE] You may need to restart this terminal window if 'node' is not immediately recognized.
        ) else (
            echo [ERROR] Automatic installation failed or was cancelled.
            echo Please install Node.js manually from: https://nodejs.org/
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo [INFO] Installation skipped. Please install Node.js manually from https://nodejs.org/ and run this script again.
        pause
        exit /b 1
    )
)

REM 2. Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Python was not found on your system!
    echo Python 3.10+ is required to run the backend API and phonetics engine.
    echo.
    set /p INSTALL_PY="Would you like to automatically download and install Python 3.11 via winget? (Y/N): "
    if /i "!INSTALL_PY!"=="Y" (
        echo.
        echo [INFO] Downloading and installing Python 3.11 via winget...
        winget install Python.Python.3.11 --accept-source-agreements --accept-package-agreements
        if !ERRORLEVEL! equ 0 (
            echo.
            echo [SUCCESS] Python installed successfully!
            echo [NOTE] You may need to restart this terminal window if 'python' is not immediately recognized.
        ) else (
            echo [ERROR] Automatic installation failed or was cancelled.
            echo Please install Python manually from: https://www.python.org/
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo [INFO] Installation skipped. Please install Python manually from https://www.python.org/ and run this script again.
        pause
        exit /b 1
    )
)

REM 3. Check and create .env if it does not exist
if not exist ".env" (
    if not exist "backend\.env" (
        if exist "backend\.env.example" (
            echo [INFO] Creating .env file from backend\.env.example...
            copy "backend\.env.example" ".env" >nul
            echo [OK] Created .env file in project root.
        )
    )
)

REM 4. Check and install Node.js packages (root and frontend)
set NEED_NODE_PACKAGES=0
if not exist "node_modules" set NEED_NODE_PACKAGES=1
if not exist "frontend\node_modules" set NEED_NODE_PACKAGES=1

if "!NEED_NODE_PACKAGES!"=="1" (
    echo.
    echo [INFO] Required Node.js packages are not installed yet.
    set /p INSTALL_NPM="Would you like to install required Node.js dependencies now? (Y/N): "
    if /i "!INSTALL_NPM!"=="Y" (
        if not exist "node_modules" (
            echo [INFO] Installing root dependencies...
            call npm install
            if !ERRORLEVEL! neq 0 (
                echo [ERROR] Failed to install root dependencies.
                pause
                exit /b 1
            )
        )
        if not exist "frontend\node_modules" (
            echo [INFO] Installing frontend dependencies...
            call npm install --prefix frontend
            if !ERRORLEVEL! neq 0 (
                echo [ERROR] Failed to install frontend dependencies.
                pause
                exit /b 1
            )
        )
        echo [SUCCESS] Node.js dependencies installed successfully!
    ) else (
        echo [INFO] Node package installation skipped. The application may fail to launch.
    )
)

REM 5. Check and install Python virtual environment & backend requirements
set NEED_PY_REQS=0
if not exist ".venv\Scripts\python.exe" set NEED_PY_REQS=1

if "!NEED_PY_REQS!"=="1" (
    echo.
    echo [INFO] Python virtual environment and backend requirements are not installed yet.
    set /p INSTALL_REQS="Would you like to create the virtual environment and install backend requirements.txt now? (Y/N): "
    if /i "!INSTALL_REQS!"=="Y" (
        echo [INFO] Creating Python virtual environment (.venv)...
        python -m venv .venv
        if !ERRORLEVEL! neq 0 (
            echo [ERROR] Failed to create Python virtual environment.
            pause
            exit /b 1
        )
        echo [INFO] Installing backend requirements from backend\requirements.txt...
        call .\.venv\Scripts\pip install -r backend\requirements.txt
        if !ERRORLEVEL! neq 0 (
            echo [ERROR] Failed to install backend requirements.
            pause
            exit /b 1
        )
        echo [SUCCESS] Backend requirements installed successfully!
    ) else (
        echo [INFO] Backend requirements installation skipped. The backend API may fail to launch.
    )
)

echo.
echo ======================================================
echo    LANGUAGE STORIES IS RUNNING!
echo ======================================================
echo  Backend API:  http://localhost:8000 (Swagger: http://localhost:8000/docs)
echo  Frontend App: http://localhost:5173
echo.
echo  Your default browser will open automatically at http://localhost:5173
echo  Press Ctrl+C to terminate both services.
echo ======================================================
echo.

call npm run dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] An error occurred while running the application.
    pause
)
