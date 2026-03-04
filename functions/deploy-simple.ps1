# Script simplifie de deploiement (sans interaction)
# Pour Windows PowerShell

Write-Host "[DEPLOY] Deploiement de la Cloud Function sendRegistrationEmail PRODUCTION..." -ForegroundColor Cyan

$PROJECT_ID = "adp-413110"
$REGION = "europe-west1"
$FUNCTION_NAME = "sendRegistrationEmail"
$SECRET_NAME = "SERVICE_ACCOUNT_JSON"

# Configurer le projet
Write-Host "[CONFIG] Configuration du projet $PROJECT_ID..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Variables d'environnement
$envVars = "ALLOWED_ORIGINS=*,FROM_EMAIL=yacine@bestoftours.co.uk,ADMIN_EMAILS=grindcamp84@gmail.com"

Write-Host "[INFO] Deploiement de la fonction..." -ForegroundColor Cyan
Write-Host "[INFO] Region: $REGION" -ForegroundColor Gray
Write-Host "[INFO] Variables: $envVars" -ForegroundColor Gray

# Deployer
gcloud functions deploy $FUNCTION_NAME `
    --gen2 `
    --runtime nodejs20 `
    --trigger-http `
    --allow-unauthenticated `
    --region $REGION `
    --set-env-vars $envVars `
    --set-secrets "GOOGLE_SERVICE_ACCOUNT=${SECRET_NAME}:latest" `
    --max-instances 10 `
    --memory 256MB `
    --timeout 60s `
    --entry-point sendRegistrationEmail

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Fonction deployee avec succes!" -ForegroundColor Green
    
    # Recuperer l'URL
    Write-Host "`n[INFO] Recuperation de l'URL..." -ForegroundColor Cyan
    $functionUrl = gcloud functions describe $FUNCTION_NAME --region $REGION --format="value(httpsTrigger.url)"
    
    Write-Host "`n[URL] URL de la fonction :" -ForegroundColor Cyan
    Write-Host "   $functionUrl" -ForegroundColor White
    
    Write-Host "`n[WARNING] IMPORTANT: Mettez a jour cette URL dans :" -ForegroundColor Yellow
    Write-Host "   ../services/emailService.ts" -ForegroundColor White
    Write-Host "   Ligne 4: const CLOUD_FUNCTION_URL = '$functionUrl';" -ForegroundColor Gray
    
    Write-Host "`n[TEST] Pour voir les logs :" -ForegroundColor Cyan
    Write-Host "   gcloud functions logs read $FUNCTION_NAME --region $REGION --limit 50" -ForegroundColor Gray
    
} else {
    Write-Host "`n[ERROR] Erreur lors du deploiement" -ForegroundColor Red
    Write-Host "[INFO] Verifiez que:" -ForegroundColor Yellow
    Write-Host "  - Le secret SERVICE_ACCOUNT_JSON existe" -ForegroundColor Gray
    Write-Host "  - Les permissions sont configurees" -ForegroundColor Gray
    Write-Host "  - Le projet GCP est correct" -ForegroundColor Gray
    exit 1
}

Write-Host "`n[DONE] Termine!" -ForegroundColor Green
