@echo off
setlocal enabledelayedexpansion
title Language Stories - Smart Launcher

cd /d "%~dp0"

echo ======================================================
echo    STARTING LANGUAGE STORIES (BACKEND + FRONTEND)
echo ======================================================
echo.

REM --------------------------------------------------------
REM 1. Check Node.js
REM --------------------------------------------------------
call node -v >nul 2>&1
if not errorlevel 1 goto :NODE_DETECTED

REM Check standard 64-bit and 32-bit Program Files and AppData
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;!PATH!"
    goto :NODE_DETECTED
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "PATH=%ProgramFiles(x86)%\nodejs;!PATH!"
    goto :NODE_DETECTED
)
if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;!PATH!"
    goto :NODE_DETECTED
)

echo [WARNING] Node.js was not found on your system!
echo Node.js 18+ is required to run the frontend and services.
echo.
set /p INSTALL_NODE="Would you like to automatically download and install Node.js LTS via winget? [Y/N]: "
if /i not "!INSTALL_NODE!"=="Y" (
    echo.
    echo [INFO] Node.js installation skipped. Please install from https://nodejs.org/ and run this script again.
    pause
    exit /b 1
)

echo.
echo [INFO] Downloading and installing Node.js LTS via winget...
winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;!PATH!"

call node -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo [NOTE] Node.js was installed, but Windows needs to update environment variables.
    echo Please close this window and double-click run.bat again.
    pause
    exit /b 0
)

:NODE_DETECTED
for /f "tokens=*" %%v in ('node -v') do set "NODE_VERSION=%%v"
echo [OK] Node.js detected: !NODE_VERSION!

REM --------------------------------------------------------
REM 2. Check Python
REM --------------------------------------------------------
call python --version >nul 2>&1
if not errorlevel 1 goto :PYTHON_DETECTED

REM Check standard Python installation directories
for %%D in (
    "%LOCALAPPDATA%\Programs\Python\Python312"
    "%LOCALAPPDATA%\Programs\Python\Python311"
    "%LOCALAPPDATA%\Programs\Python\Python310"
    "%ProgramFiles%\Python312"
    "%ProgramFiles%\Python311"
    "%ProgramFiles%\Python310"
) do (
    if exist "%%~D\python.exe" (
        set "PATH=%%~D;%%~D\Scripts;!PATH!"
        goto :PYTHON_DETECTED
    )
)

echo.
echo [WARNING] Python was not found on your system!
echo Python 3.10+ is required to run the backend API and phonetics engine.
echo.
set /p INSTALL_PY="Would you like to automatically download and install Python 3.11 via winget? [Y/N]: "
if /i not "!INSTALL_PY!"=="Y" (
    echo.
    echo [INFO] Python installation skipped. Please install from https://www.python.org/ and run this script again.
    pause
    exit /b 1
)

echo.
echo [INFO] Downloading and installing Python 3.11 via winget...
winget install Python.Python.3.11 --accept-source-agreements --accept-package-agreements
for %%D in ("%LOCALAPPDATA%\Programs\Python\Python311" "%ProgramFiles%\Python311") do (
    if exist "%%~D\python.exe" set "PATH=%%~D;%%~D\Scripts;!PATH!"
)

call python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [NOTE] Python was installed, but Windows needs to update environment variables.
    echo Please close this window and double-click run.bat again.
    pause
    exit /b 0
)

:PYTHON_DETECTED
for /f "tokens=*" %%v in ('python --version') do set "PY_VERSION=%%v"
echo [OK] Python detected: !PY_VERSION!

REM --------------------------------------------------------
REM 3. Check .env file
REM --------------------------------------------------------
if not exist ".env" (
    if not exist "backend\.env" (
        if exist "backend\.env.example" (
            copy "backend\.env.example" ".env" >nul
            echo [OK] Created .env file from template.
        )
    )
)

REM --------------------------------------------------------
REM 4. Check Node.js Dependencies
REM --------------------------------------------------------
if exist "node_modules" if exist "frontend\node_modules" goto :NODE_DEPS_OK

echo.
echo [INFO] Required Node.js packages are not installed yet.
set /p INSTALL_NPM="Would you like to install required Node.js dependencies now? [Y/N]: "
if /i not "!INSTALL_NPM!"=="Y" (
    echo [INFO] Skipping package installation. App may fail to launch.
    goto :NODE_DEPS_OK
)

if not exist "node_modules" (
    echo [INFO] Installing root dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install root dependencies.
        pause
        exit /b 1
    )
)

if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install --prefix frontend
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
)
echo [SUCCESS] Node.js packages installed successfully!

:NODE_DEPS_OK

REM --------------------------------------------------------
REM 5. Check Python Virtual Environment & Requirements
REM --------------------------------------------------------
if exist ".venv\Scripts\python.exe" goto :PY_DEPS_OK

echo.
echo [INFO] Python virtual environment and backend requirements are not installed yet.
set /p INSTALL_REQS="Would you like to create the virtual environment and install backend requirements.txt now? [Y/N]: "
if /i not "!INSTALL_REQS!"=="Y" (
    echo [INFO] Skipping backend requirements. Backend may fail to launch.
    goto :PY_DEPS_OK
)

echo [INFO] Creating Python virtual environment in .venv...
python -m venv .venv
if errorlevel 1 (
    echo [ERROR] Failed to create Python virtual environment.
    pause
    exit /b 1
)

echo [INFO] Installing backend dependencies from backend\requirements.txt...
call .\.venv\Scripts\pip install -r backend\requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend requirements.
    pause
    exit /b 1
)
echo [SUCCESS] Backend requirements installed successfully!

:PY_DEPS_OK

echo.
echo ======================================================
echo    LANGUAGE STORIES IS RUNNING!
echo ======================================================
echo  Backend API:  http://localhost:8000 (Swagger: http://localhost:8000/docs)
echo  Frontend App: http://localhost:5173
echo.
echo  Your browser will open automatically at http://localhost:5173
echo  Press Ctrl+C to terminate both services.
echo ======================================================
echo.

call npm run dev
if errorlevel 1 (
    echo.
    echo [ERROR] An error occurred while running the application.
    pause
)
