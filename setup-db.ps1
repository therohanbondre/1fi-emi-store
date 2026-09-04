# setup-db.ps1
# Run this from the repo root to create the database, run migrations, and seed.
# Usage:  .\setup-db.ps1 -Password "your_postgres_password"
# Or set PG_PASSWORD env var first, then just: .\setup-db.ps1

param(
  [string]$Password = $env:PG_PASSWORD,
  [string]$User     = "postgres",
  [string]$Host     = "localhost",
  [string]$Port     = "5432",
  [string]$DbName   = "emi_store"
)

if (-not $Password) {
  Write-Host "ERROR: Provide -Password or set PG_PASSWORD environment variable." -ForegroundColor Red
  exit 1
}

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$env:PGPASSWORD = $Password

Write-Host ""
Write-Host "1. Creating database '$DbName'..." -ForegroundColor Cyan
& $psql -U $User -h $Host -p $Port -c "CREATE DATABASE $DbName;" 2>&1
# Ignore 'already exists' error -- idempotent

Write-Host ""
Write-Host "2. Writing backend/.env ..." -ForegroundColor Cyan
$envContent = "PORT=4000`nDATABASE_URL=`"postgresql://${User}:${Password}@${Host}:${Port}/${DbName}?schema=public`""
Set-Content -Path "backend\.env" -Value $envContent -Encoding UTF8
Write-Host "   backend/.env written."

Write-Host ""
Write-Host "3. Generating Prisma client..." -ForegroundColor Cyan
Set-Location backend
npx prisma generate --schema=../prisma/schema.prisma

Write-Host ""
Write-Host "4. Running migrations..." -ForegroundColor Cyan
npx prisma migrate dev --name init --schema=../prisma/schema.prisma

Write-Host ""
Write-Host "5. Running seed..." -ForegroundColor Cyan
npm run db:seed

Set-Location ..
