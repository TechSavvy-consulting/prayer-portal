@echo off
setlocal
cd /d "%~dp0"

set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  if not exist "node_modules\qrcode" (
    npm install
  )
  node server\local-server.cjs
  goto :done
)

if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" server\local-server.cjs
  goto :done
)

echo.
echo Could not find Node.js.
echo Install Node.js or run this from Codex once so the bundled runtime is available.
echo.
pause

:done
endlocal
