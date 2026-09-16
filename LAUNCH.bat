@echo off
REM 🚀 SUMAIYA PRODUCTION LAUNCH SCRIPT
REM Deploys the Sumaiya web app to production (Vercel).
REM TemplateHub is a separate repo (hamisiddy9-spec/TemplateHub) — see that repo for its own deploy.

setlocal enabledelayedexpansion

cls
echo ================================================
echo 🚀 SUMAIYA PRODUCTION LAUNCH
echo ================================================
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Node.js not found. Please install Node.js.
  exit /b 1
)

where npx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ❌ NPX not found.
  exit /b 1
)

echo ✅ Prerequisites checked
echo.

REM Sumaiya Web Deployment
echo ================================================
echo SUMAIYA WEB (Vercel)
echo ================================================
echo.

echo 📋 Step 1: Verify build...
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Build failed
  exit /b 1
)
echo ✅ Build successful
echo.

echo 📋 Step 2: Authenticate with Vercel...
echo Running: npx vercel login
call npx vercel login
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Vercel authentication failed
  exit /b 1
)
echo ✅ Vercel authentication successful
echo.

echo 📋 Step 3: Deploy to Vercel...
echo Running: npx vercel deploy --prod
for /f "tokens=*" %%i in ('npx vercel deploy --prod') do set VERCEL_URL=%%i

if %ERRORLEVEL% NEQ 0 (
  echo ❌ Deployment failed
  exit /b 1
)
echo ✅ Deployment successful
echo URL: !VERCEL_URL!
echo.

echo 📋 Step 4: Verify deployment...
timeout /t 5 /nobreak
curl -s !VERCEL_URL!/api/health || echo API not yet ready
echo.

REM Summary
echo ================================================
echo ✅ DEPLOYMENT COMPLETE
echo ================================================
echo.
echo Sumaiya Web:
echo   URL: !VERCEL_URL!
echo   Status: Deployed to Vercel
echo.
echo Next steps:
echo   1. Configure environment variables in Vercel dashboard
echo   2. Apply database migrations
echo   3. Test endpoints and verify health checks
echo   4. Set up monitoring
echo.
echo Documentation:
echo   - Architecture: CLAUDE.md
echo   - Deployment: DEPLOYMENT_READY.md
echo   - Testing: E2E_TEST_PLAN.md
echo.
pause
