# Firebase Emulator Setup
# Always run from repo root
Set-Location -Path $PSScriptRoot

# Install and build Cloud Functions (non-interactive)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/functions' ; if (Test-Path package-lock.json) { npm ci } else { npm install } ; npm run build:watch"

# Start all required emulators (Auth, Firestore, Functions, Storage) using npx and explicit config
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot' ; npx --yes firebase-tools emulators:start --only auth,functions,firestore,storage --config '$PSScriptRoot/firebase.json'"

# Open Emulator UI
Start-Process "http://localhost:4000"