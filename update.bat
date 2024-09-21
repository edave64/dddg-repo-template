@echo off
:: Step 1: Check if Node.js is installed
node -v >nul 2>&1
IF ERRORLEVEL 1 (
    echo Node.js is not installed, but is required to run this script.
    echo Please download it from: https://nodejs.org/
    pause
    exit /b 1
)

:: Step 2: Check if node_modules directory exists
IF NOT EXIST "node_modules" (
    echo Loading dependencies...
    npm install
)

:: Step 3: Run npm run update
echo Running the repository update...
npm run update

exit /b 0
