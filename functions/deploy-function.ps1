# Script de deploiement de la Cloud Function pour l'envoi d'emails
# Pour Windows PowerShell

Write-Host "[EMAIL] Deploiement de la Cloud Function sendRegistrationEmail..." -ForegroundColor Cyan

# Configuration
$PROJECT_ID = "adp-413110"
$REGION = "europe-west1"
$FUNCTION_NAME = "sendRegistrationEmail"
$SERVICE_ACCOUNT_FILE = "..\services\adp-413110-176b452e6fb2.json"
$SECRET_NAME = "SERVICE_ACCOUNT_JSON"

# Vérifier le projet
$currentProject = gcloud config get-value project 2>$null
if ($currentProject -ne $PROJECT_ID) {
    Write-Host "⚙️ Configuration du projet GCP..." -ForegroundColor Yellow
    gcloud config set project $PROJECT_ID
}

# Menu de déploiement
Write-Host "`nChoisissez le type de déploiement :" -ForegroundColor Yellow
Write-Host "  1. Premier déploiement (créer le secret + déployer)"
Write-Host "  2. Mise à jour de la fonction uniquement"
Write-Host "  3. Mettre à jour le secret (nouvelle clé service account)"
$choice = Read-Host "Votre choix (1-3)"

switch ($choice) {
    "1" {
        Write-Host "`n🔐 Création du secret dans Secret Manager..." -ForegroundColor Cyan
        
        # Vérifier que le fichier service account existe
        if (-not (Test-Path $SERVICE_ACCOUNT_FILE)) {
            Write-Host "❌ Fichier service account introuvable : $SERVICE_ACCOUNT_FILE" -ForegroundColor Red
            exit 1
        }

        # Créer le secret
        gcloud secrets create $SECRET_NAME `
            --data-file="$SERVICE_ACCOUNT_FILE" `
            --replication-policy="automatic"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ Le secret existe peut-être déjà, continuation..." -ForegroundColor Yellow
        } else {
            Write-Host "✓ Secret créé" -ForegroundColor Green
        }

        # Donner l'accès
        Write-Host "`n🔑 Configuration des permissions..." -ForegroundColor Cyan
        $projectNumber = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
        
        gcloud secrets add-iam-policy-binding $SECRET_NAME `
            --member="serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com" `
            --role="roles/secretmanager.secretAccessor"
        
        Write-Host "✓ Permissions configurées" -ForegroundColor Green
    }
    
    "3" {
        Write-Host "`n🔄 Mise à jour du secret..." -ForegroundColor Cyan
        
        if (-not (Test-Path $SERVICE_ACCOUNT_FILE)) {
            Write-Host "❌ Fichier service account introuvable : $SERVICE_ACCOUNT_FILE" -ForegroundColor Red
            exit 1
        }

        gcloud secrets versions add $SECRET_NAME --data-file="$SERVICE_ACCOUNT_FILE"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Nouvelle version du secret créée" -ForegroundColor Green
        } else {
            Write-Host "❌ Erreur lors de la mise à jour du secret" -ForegroundColor Red
            exit 1
        }
    }
}

# Déploiement de la fonction
Write-Host "`n🚀 Déploiement de la fonction..." -ForegroundColor Cyan

# Demander l'environnement
Write-Host "`nEnvironnement :" -ForegroundColor Yellow
Write-Host "  1. Production (grindcamp.fr)"
Write-Host "  2. Développement (localhost:6000)"
$env = Read-Host "Votre choix (1-2)"

if ($env -eq "1") {
    $allowedOrigins = "https://grindcamp.fr,https://www.grindcamp.fr"
    Write-Host "➡️ Déploiement PRODUCTION" -ForegroundColor Green
} else {
    $allowedOrigins = "*"
    $FUNCTION_NAME = "sendRegistrationEmail-dev"
    Write-Host "➡️ Déploiement DÉVELOPPEMENT" -ForegroundColor Yellow
}

# Se déplacer dans le dossier functions
Set-Location -Path "functions"

# Déployer
gcloud functions deploy $FUNCTION_NAME `
    --runtime nodejs18 `
    --trigger-http `
    --allow-unauthenticated `
    --region $REGION `
    --set-env-vars "ALLOWED_ORIGINS=$allowedOrigins,FROM_EMAIL=amani.bestoftours.co.uk,ADMIN_EMAILS=grindcamp84@gmail.com" `
    --set-secrets "GOOGLE_SERVICE_ACCOUNT=${SECRET_NAME}:latest" `
    --max-instances 10 `
    --memory 256MB `
    --timeout 60s `
    --entry-point sendRegistrationEmail

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Fonction déployée avec succès!" -ForegroundColor Green
    
    # Récupérer l'URL
    Write-Host "`n📋 Récupération de l'URL..." -ForegroundColor Cyan
    $functionUrl = gcloud functions describe $FUNCTION_NAME --region $REGION --format="value(httpsTrigger.url)"
    
    Write-Host "`n🌐 URL de la fonction :" -ForegroundColor Cyan
    Write-Host "   $functionUrl" -ForegroundColor White
    
    Write-Host "`n⚠️ N'oubliez pas de mettre à jour cette URL dans :" -ForegroundColor Yellow
    Write-Host "   services/emailService.ts" -ForegroundColor Gray
    Write-Host "   const CLOUD_FUNCTION_URL = '$functionUrl';" -ForegroundColor Gray
    
    Write-Host "`n🧪 Pour tester :" -ForegroundColor Cyan
    Write-Host "   gcloud functions logs read $FUNCTION_NAME --region $REGION --limit 50" -ForegroundColor Gray
    
} else {
    Write-Host "`n❌ Erreur lors du déploiement" -ForegroundColor Red
    exit 1
}

# Retour au dossier principal
Set-Location -Path ".."

Write-Host "`n✨ Terminé!" -ForegroundColor Green
