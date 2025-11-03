Write-Host "🔧 Setting up Firebase Functions..." -ForegroundColor Green

# Create functions folder if it doesn't exist
if (!(Test-Path "functions")) {
    mkdir functions
}

# Change to functions directory
Set-Location functions

# Initialize package.json if it doesn't exist
if (!(Test-Path "package.json")) {
    Write-Host "📦 Initializing package.json..." -ForegroundColor Yellow
    npm init -y
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install firebase-admin firebase-functions
npm install -D typescript @types/node @types/jest firebase-functions-test
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint eslint-config-google eslint-plugin-import

# Create src directory if it doesn't exist
if (!(Test-Path "src")) {
    mkdir src
}

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

# Initialize Firebase if needed
if (!(Test-Path "../firebase.json")) {
    Write-Host "🔥 Initializing Firebase..." -ForegroundColor Yellow
    firebase init functions
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host @"

Next steps:
1. Run 'firebase emulators:start' to test locally
2. Check the Firebase Console to ensure your project is properly configured
3. Run 'npm run build' to compile TypeScript
4. Run 'firebase deploy --only functions' to deploy

"@ -ForegroundColor Cyan

Set-Location ..