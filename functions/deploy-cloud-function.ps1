# Script de deploiement de la Cloud Function pour l'envoi d'emails
# Pour Windows PowerShell

Write-Host "[EMAIL] Deploiement de la Cloud Function sendRegistrationEmail..." -ForegroundColor Cyan

# Configuration
$PROJECT_ID = "adp-413110"
$REGION = "europe-west1"
$FUNCTION_NAME = "sendRegistrationEmail"
$SERVICE_ACCOUNT_FILE = "..\services\adp-413110-176b452e6fb2.json"
$SECRET_NAME = "SERVICE_ACCOUNT_JSON"

# Verifier le projet
$currentProject = gcloud config get-value project 2>$null
if ($currentProject -ne $PROJECT_ID) {
    Write-Host "[CONFIG] Configuration du projet GCP..." -ForegroundColor Yellow
    gcloud config set project $PROJECT_ID
}

# Menu de deploiement
Write-Host "`nChoisissez le type de deploiement :" -ForegroundColor Yellow
Write-Host "  1. Premier deploiement (creer le secret + deployer)"
Write-Host "  2. Mise a jour de la fonction uniquement"
Write-Host "  3. Mettre a jour le secret (nouvelle cle service account)"
$choice = Read-Host "Votre choix (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n[SECRET] Creation du secret dans Secret Manager..." -ForegroundColor Cyan
        
        # Verifier que le fichier service account existe
        if (-not (Test-Path $SERVICE_ACCOUNT_FILE)) {
            Write-Host "[ERROR] Fichier service account introuvable : $SERVICE_ACCOUNT_FILE" -ForegroundColor Red
            exit 1
        }

        # Creer le secret
        gcloud secrets create $SECRET_NAME --data-file="$SERVICE_ACCOUNT_FILE" --replication-policy="automatic"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[WARNING] Le secret existe peut-etre deja, continuation..." -ForegroundColor Yellow
        } else {
            Write-Host "[OK] Secret cree" -ForegroundColor Green
        }

        # Donner l'acces
        Write-Host "`n[PERMISSIONS] Configuration des permissions..." -ForegroundColor Cyan
        $projectNumber = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
        
        gcloud secrets add-iam-policy-binding $SECRET_NAME --member="serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
        
        Write-Host "[OK] Permissions configurees" -ForegroundColor Green
    }
    
    "3" {
        Write-Host "`n[UPDATE] Mise a jour du secret..." -ForegroundColor Cyan
        
        if (-not (Test-Path $SERVICE_ACCOUNT_FILE)) {
            Write-Host "[ERROR] Fichier service account introuvable : $SERVICE_ACCOUNT_FILE" -ForegroundColor Red
            exit 1
        }

        gcloud secrets versions add $SECRET_NAME --data-file="$SERVICE_ACCOUNT_FILE"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Nouvelle version du secret creee" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Erreur lors de la mise a jour du secret" -ForegroundColor Red
            exit 1
        }
    }
}

# Deploiement de la fonction
Write-Host "`n[DEPLOY] Deploiement de la fonction..." -ForegroundColor Cyan

# Demander l'environnement
Write-Host "`nEnvironnement :" -ForegroundColor Yellow
Write-Host "  1. Production (grindcamp.fr)"
Write-Host "  2. Developpement (localhost:6000)"
$env = Read-Host "Votre choix (1-2)"

if ($env -eq "1") {
    $allowedOrigins = "https://grindcamp.fr,https://www.grindcamp.fr"
    Write-Host "[PROD] Deploiement PRODUCTION" -ForegroundColor Green
} else {
    $allowedOrigins = "*"
    $FUNCTION_NAME = "sendRegistrationEmail-dev"
    Write-Host "[DEV] Deploiement DEVELOPPEMENT" -ForegroundColor Yellow
}

# Deployer avec des variables separees pour eviter les problemes d'echappement
$envVars = "ALLOWED_ORIGINS=$allowedOrigins,FROM_EMAIL=amani.bestoftours.co.uk,ADMIN_EMAILS=grindcamp84@gmail.com"

Write-Host "`n[INFO] Variables d'environnement: $envVars" -ForegroundColor Gray

gcloud functions deploy $FUNCTION_NAME `
    --runtime nodejs18 `
    --trigger-http `
    --allow-unauthenticated `
    --region $REGION `
    --set-env-vars $envVars `
    --set-secrets "GOOGLE_SERVICE_ACCOUNT=$SECRET_NAME:latest" `
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
    
    Write-Host "`n[WARNING] N'oubliez pas de mettre a jour cette URL dans :" -ForegroundColor Yellow
    Write-Host "   services/emailService.ts" -ForegroundColor Gray
    Write-Host "   const CLOUD_FUNCTION_URL = '$functionUrl';" -ForegroundColor Gray
    
    Write-Host "`n[TEST] Pour tester :" -ForegroundColor Cyan
    Write-Host "   gcloud functions logs read $FUNCTION_NAME --region $REGION --limit 50" -ForegroundColor Gray
    
} else {
    Write-Host "`n[ERROR] Erreur lors du deploiement" -ForegroundColor Red
    exit 1
}

Write-Host "`n[DONE] Termine!" -ForegroundColor Green
