# Script de vérification avant déploiement
# Vérifie que tout est prêt avant de déployer

Write-Host "`n🔍 Vérification pré-déploiement..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$errors = @()
$warnings = @()
$checks = 0
$passed = 0

function Check-Item {
    param($name, $condition, $message, $isWarning = $false)
    
    $script:checks++
    Write-Host "`n[$checks] $name" -ForegroundColor Yellow
    
    if ($condition) {
        Write-Host "  ✓ $message" -ForegroundColor Green
        $script:passed++
        return $true
    } else {
        if ($isWarning) {
            Write-Host "  ⚠ $message" -ForegroundColor Yellow
            $script:warnings += $message
        } else {
            Write-Host "  ✗ $message" -ForegroundColor Red
            $script:errors += $message
        }
        return $false
    }
}

# 1. Node.js installé
try {
    $nodeVersion = node --version
    Check-Item "Node.js" ($nodeVersion -ne $null) "Node.js $nodeVersion détecté"
} catch {
    Check-Item "Node.js" $false "Node.js n'est pas installé"
}

# 2. Google Cloud SDK
try {
    $gcloudVersion = gcloud version 2>$null
    Check-Item "Google Cloud SDK" ($gcloudVersion -ne $null) "Google Cloud SDK détecté"
} catch {
    Check-Item "Google Cloud SDK" $false "Google Cloud SDK n'est pas installé"
}

# 3. Projet GCP configuré
try {
    $currentProject = gcloud config get-value project 2>$null
    Check-Item "Projet GCP" ($currentProject -eq "adp-413110") "Projet configuré : $currentProject"
} catch {
    Check-Item "Projet GCP" $false "Projet GCP non configuré"
}

# 4. node_modules présent
$nodeModulesExists = Test-Path "node_modules"
Check-Item "Dépendances" $nodeModulesExists "node_modules présent" $true

# 5. Service Account présent
$serviceAccountExists = Test-Path "services\adp-413110-176b452e6fb2.json"
Check-Item "Service Account" $serviceAccountExists "Fichier service account trouvé"

# 6. .env.example présent
$envExampleExists = Test-Path ".env.example"
Check-Item "Configuration" $envExampleExists "Fichier .env.example trouvé"

# 7. Vérifier emailService.ts URL
$emailServiceContent = Get-Content "services\emailService.ts" -Raw
$hasCloudFunctionUrl = $emailServiceContent -match "europe-west1-adp-413110.cloudfunctions.net"
Check-Item "URL Cloud Function" $hasCloudFunctionUrl "URL de la fonction configurée" $true

# 8. Vérifier vite.config.ts port
$viteConfigContent = Get-Content "vite.config.ts" -Raw
$hasPort6000 = $viteConfigContent -match "port:\s*6000"
Check-Item "Port Vite" $hasPort6000 "Port configuré sur 6000"

# 9. Vérifier .gitignore
$gitignoreContent = Get-Content ".gitignore" -Raw
$gitignoreHasJson = $gitignoreContent -match "services/\*\.json"
Check-Item "Sécurité .gitignore" $gitignoreHasJson "Service account protégé dans .gitignore"

# 10. Vérifier que le build fonctionne
Write-Host "`n[10] Test de build" -ForegroundColor Yellow
Write-Host "  📦 Tentative de build..." -ForegroundColor Gray

$buildOutput = npm run build 2>&1
$buildSuccess = $LASTEXITCODE -eq 0

if ($buildSuccess) {
    Write-Host "  ✓ Build réussi" -ForegroundColor Green
    $passed++
    
    # Vérifier que dist existe
    $distExists = Test-Path "dist"
    if ($distExists) {
        $distFiles = (Get-ChildItem "dist" -Recurse -File).Count
        Write-Host "  ✓ $distFiles fichiers générés dans dist/" -ForegroundColor Green
    }
} else {
    Write-Host "  ✗ Le build a échoué" -ForegroundColor Red
    $errors += "Build échoué"
}

$checks++

# 11. Vérifier la Cloud Function (optionnel)
Write-Host "`n[11] Cloud Function" -ForegroundColor Yellow
try {
    $functionInfo = gcloud functions describe sendRegistrationEmail --region europe-west1 2>$null
    if ($functionInfo) {
        Write-Host "  ✓ Cloud Function déployée" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ⚠ Cloud Function non trouvée" -ForegroundColor Yellow
        $warnings += "Cloud Function n'est pas déployée"
    }
} catch {
    Write-Host "  ⚠ Impossible de vérifier la Cloud Function" -ForegroundColor Yellow
    $warnings += "Vérification Cloud Function échouée"
}
$checks++

# 12. Vérifier Secret Manager
Write-Host "`n[12] Secret Manager" -ForegroundColor Yellow
try {
    $secretExists = gcloud secrets describe SERVICE_ACCOUNT_JSON 2>$null
    if ($secretExists) {
        Write-Host "  ✓ Secret SERVICE_ACCOUNT_JSON existe" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ⚠ Secret non trouvé" -ForegroundColor Yellow
        $warnings += "Secret SERVICE_ACCOUNT_JSON n'existe pas"
    }
} catch {
    Write-Host "  ⚠ Impossible de vérifier le secret" -ForegroundColor Yellow
    $warnings += "Vérification Secret Manager échouée"
}
$checks++

# Résumé
Write-Host "`n" -NoNewline
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n✓ Tests réussis : $passed/$checks" -ForegroundColor Green

if ($warnings.Count -gt 0) {
    Write-Host "⚠ Avertissements : $($warnings.Count)" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  • $warning" -ForegroundColor Yellow
    }
}

if ($errors.Count -gt 0) {
    Write-Host "`n✗ Erreurs : $($errors.Count)" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  • $error" -ForegroundColor Red
    }
    Write-Host "`n❌ Le déploiement ne devrait PAS être effectué" -ForegroundColor Red
    Write-Host "   Corrigez les erreurs ci-dessus avant de continuer.`n" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`n✅ Toutes les vérifications critiques sont passées" -ForegroundColor Green
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  Il y a des avertissements mais le déploiement peut continuer" -ForegroundColor Yellow
    } else {
        Write-Host "🎉 Tout est parfait !" -ForegroundColor Green
    }
    
    Write-Host "`n📋 Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "  1. Tester en local : npm run dev" -ForegroundColor Gray
    Write-Host "  2. Déployer frontend : npm run deploy" -ForegroundColor Gray
    Write-Host "  3. Vérifier le site : https://grindcamp.fr" -ForegroundColor Gray
    Write-Host "  4. Tester une inscription" -ForegroundColor Gray
    Write-Host "  5. Vérifier les emails reçus" -ForegroundColor Gray
    
    # Demander confirmation pour déployer
    Write-Host "`n❓ Voulez-vous déployer maintenant ? (O/N)" -ForegroundColor Cyan
    $response = Read-Host
    
    if ($response -eq "O" -or $response -eq "o") {
        Write-Host "`n🚀 Lancement du déploiement..." -ForegroundColor Green
        Start-Sleep -Seconds 1
        .\deploy.ps1
    } else {
        Write-Host "`n✋ Déploiement annulé" -ForegroundColor Yellow
    }
}

Write-Host ""
