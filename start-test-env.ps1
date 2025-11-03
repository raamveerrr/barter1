# Start emulators and seed test data
$ErrorActionPreference = 'Stop'

Write-Host "🚀 Starting Barter test environment..." -ForegroundColor Green

# Check if Firebase CLI is installed
if (!(Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Firebase CLI globally..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

# Install dependencies if needed
if (!(Test-Path "functions/node_modules")) {
    Write-Host "Installing Functions dependencies..." -ForegroundColor Yellow
    Push-Location functions
    npm install
    Pop-Location
}

if (!(Test-Path "frontend/node_modules")) {
    Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

# Build the frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
Push-Location frontend
npm run build
Pop-Location

# Start emulators and seed data
Write-Host "Starting Firebase emulators..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "firebase emulators:start --import=./test-data --export-on-exit=./test-data"

# Wait for emulators to start
Start-Sleep -Seconds 5

# Run the seeding script
Write-Host "Seeding test data..." -ForegroundColor Yellow
Push-Location scripts
node seed-test-data.js
Pop-Location

# Start development servers
Write-Host "Starting development servers..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend ; npm run dev"

Write-Host "🎉 Test environment is ready!" -ForegroundColor Green
Write-Host @"

Access your test environment:
- Frontend: http://localhost:3000
- Firebase Emulator UI: http://localhost:4000
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099

Test Users:
- Student 1: student1@vitap.edu.in (500 coins)
- Student 2: student2@vitap.edu.in (300 coins)
- Admin: admin@vitap.edu.in

Test Items:
- Engineering Textbook (200 coins)
- Scientific Calculator (300 coins)
- Study Desk (400 coins)

"@ -ForegroundColor Cyan

# Keep the script running
Write-Host "Press Ctrl+C to stop all servers..." -ForegroundColor Yellow
while ($true) { Start-Sleep -Seconds 1 }