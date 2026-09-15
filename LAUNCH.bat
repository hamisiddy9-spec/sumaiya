@echo off
REM 🚀 SUMAIYA × TEMPLATEHUB PRODUCTION LAUNCH SCRIPT
REM Deploys both projects to production

setlocal enabledelayedexpansion

cls
echo ================================================
echo 🚀 SUMAIYA × TEMPLATEHUB PRODUCTION LAUNCH
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

REM Part 1: Sumaiya Web Deployment
echo ================================================
echo PART 1: SUMAIYA WEB (Vercel)
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

REM Part 2: TemplateHub Deployment
echo ================================================
echo PART 2: TEMPLATEHUB API (Docker)
echo ================================================
echo.

cd templatehub

echo 📋 Step 1: Verify TemplateHub build...
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo ❌ TemplateHub build failed
  exit /b 1
)
echo ✅ TemplateHub build successful
echo.

where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo 📋 Step 2: Build Docker image...
  call docker build -t templatehub:latest .
  if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker build failed
    exit /b 1
  )
  echo ✅ Docker image built
  echo.

  echo 📋 Step 3: Deploy instructions...
  echo To deploy to production, use one of:
  echo   - AWS ECS: aws ecs update-service --cluster templatehub --service api
  echo   - Google Cloud Run: gcloud run deploy templatehub --image gcr.io/yourproject/templatehub
  echo   - Azure Container Instances: az container create --image yourregistry.azurecr.io/templatehub
  echo   - Vercel: vercel deploy --prod
  echo.
) else (
  echo ⚠️  Docker not available
  echo Manual deployment required for TemplateHub
  echo.
)

cd ..

REM Part 3: Summary
echo ================================================
echo ✅ DEPLOYMENT COMPLETE
echo ================================================
echo.
echo Sumaiya Web:
echo   URL: !VERCEL_URL!
echo   Status: Deployed to Vercel
echo.
echo TemplateHub API:
echo   Status: Build complete (ready for Docker deployment)
echo.
echo Next steps:
echo   1. Configure environment variables in Vercel dashboard
echo   2. Apply database migrations
echo   3. Deploy TemplateHub to your cloud platform
echo   4. Test endpoints and verify health checks
echo   5. Set up monitoring
echo.
echo Documentation:
echo   - Architecture: CLAUDE.md
echo   - Deployment: DEPLOYMENT_READY.md
echo   - Testing: E2E_TEST_PLAN.md
echo.
pause
