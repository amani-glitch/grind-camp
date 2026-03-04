# Script pour changer l'email d'envoi sans modifier le code
# Usage: powershell -ExecutionPolicy Bypass -File change-sender-email.ps1

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CHANGEMENT EMAIL ENVOYEUR - GRIND CAMP" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Demander le nouvel email
$newEmail = Read-Host "Entrez le nouvel email d'envoi (ex: contact@grindcamp.fr)"

# Validation basique
if (-not ($newEmail -match "^[^\s@]+@[^\s@]+\.[^\s@]+$")) {
    Write-Host ""
    Write-Host "[ERREUR] Email invalide!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Confirmation
Write-Host ""
Write-Host "Email actuel : yacine@bestoftours.co.uk" -ForegroundColor Yellow
Write-Host "Nouvel email : $newEmail" -ForegroundColor Green
Write-Host ""
$confirmation = Read-Host "Confirmer le changement? (oui/non)"

if ($confirmation -ne "oui") {
    Write-Host ""
    Write-Host "[ANNULE] Aucun changement effectue" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "[INFO] Configuration du projet..." -ForegroundColor Cyan
gcloud config set project adp-413110

Write-Host ""
Write-Host "[INFO] Deploiement avec le nouvel email..." -ForegroundColor Cyan
Write-Host ""

# Déployer avec le nouvel email
gcloud functions deploy sendRegistrationEmail `
    --gen2 `
    --runtime nodejs20 `
    --trigger-http `
    --allow-unauthenticated `
    --region europe-west1 `
    --memory 256MB `
    --timeout 60s `
    --set-secrets="GOOGLE_SERVICE_ACCOUNT=SERVICE_ACCOUNT_JSON:latest" `
    --set-env-vars "FROM_EMAIL=$newEmail,DELEGATED_EMAIL=$newEmail,ADMIN_EMAILS=grindcamp84@gmail.com,ALLOWED_ORIGINS=*"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  SUCCES! Email change vers:" -ForegroundColor Green
    Write-Host "  $newEmail" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "[IMPORTANT] N'oubliez pas de configurer la delegation" -ForegroundColor Yellow
    Write-Host "de domaine dans Google Workspace Admin pour cet email!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Instructions:" -ForegroundColor Cyan
    Write-Host "1. Allez sur https://admin.google.com" -ForegroundColor White
    Write-Host "2. Securite > API Controls > Domain-wide Delegation" -ForegroundColor White
    Write-Host "3. Ajoutez le Client ID: 102906367840296772756" -ForegroundColor White
    Write-Host "4. Scope: https://www.googleapis.com/auth/gmail.send" -ForegroundColor White
    Write-Host "5. Autorisez l'email: $newEmail" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERREUR] Le deploiement a echoue!" -ForegroundColor Red
    Write-Host ""
    exit 1
}
