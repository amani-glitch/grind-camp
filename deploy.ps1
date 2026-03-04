# Script de déploiement pour The Grind Camp
# Pour Windows PowerShell

Write-Host "🚀 Déploiement de The Grind Camp..." -ForegroundColor Cyan

# Configuration
$PROJECT_ID = "adp-413110"
$BUCKET_NAME = "grindcamp.fr"
$REGION = "europe-west1"

# 1. Vérifier que gcloud est installé
try {
    $gcloudVersion = gcloud version 2>$null
    Write-Host "✓ Google Cloud SDK détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud SDK n'est pas installé!" -ForegroundColor Red
    Write-Host "Installez-le depuis : https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# 2. Vérifier le projet actif
$currentProject = gcloud config get-value project 2>$null
if ($currentProject -ne $PROJECT_ID) {
    Write-Host "⚙️ Configuration du projet GCP..." -ForegroundColor Yellow
    gcloud config set project $PROJECT_ID
}

# 3. Build du frontend
Write-Host "`n📦 Build du frontend..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de npm install" -ForegroundColor Red
    exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build terminé avec succès" -ForegroundColor Green

# 4. Upload vers le bucket
Write-Host "`n☁️ Upload vers Google Cloud Storage..." -ForegroundColor Cyan

# Supprimer les anciens fichiers (ignore l'erreur si vide)
gsutil -m rm -r "gs://$BUCKET_NAME/**" 2>$null

# Upload des nouveaux fichiers
gsutil -m cp -r dist/* "gs://$BUCKET_NAME/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'upload" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Fichiers uploadés" -ForegroundColor Green

# 5. Configuration du cache
Write-Host "`n⚡ Configuration du cache..." -ForegroundColor Cyan

# Cache court pour HTML (1 heure)
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" "gs://$BUCKET_NAME/**/*.html"

# Cache long pour JS/CSS (1 an)
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" "gs://$BUCKET_NAME/**/*.js"
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" "gs://$BUCKET_NAME/**/*.css"

# Cache pour les images
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" "gs://$BUCKET_NAME/**/*.jpg"
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" "gs://$BUCKET_NAME/**/*.jpeg"
gsutil -m setmeta -h "Cache-Control:public, max-age=86400" "gs://$BUCKET_NAME/**/*.png"

Write-Host "✓ Cache configuré" -ForegroundColor Green

# 6. Résumé
Write-Host "`n✅ Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host "🌐 Site disponible sur : https://$BUCKET_NAME" -ForegroundColor Cyan
Write-Host "`n📊 Commandes utiles :" -ForegroundColor Yellow
Write-Host "  - Voir les fichiers : gsutil ls gs://$BUCKET_NAME" -ForegroundColor Gray
Write-Host "  - Logs fonction : gcloud functions logs read sendRegistrationEmail --region $REGION" -ForegroundColor Gray
Write-Host "  - Vider le cache CDN : gcloud compute url-maps invalidate-cdn-cache <url-map> --path '/*'" -ForegroundColor Gray
