# Deploiement Cloud Function - Guide simplifie

## Probleme rencontre

Les scripts PowerShell avec emojis causent des erreurs d'encodage.

## Solution

Utiliser le script **deploy-simple.ps1** qui n'a pas d'emojis et qui deploie directement en production.

## Commande pour deployer

```powershell
cd functions
powershell -ExecutionPolicy Bypass -File deploy-simple.ps1
```

OU depuis la racine :

```powershell
cd "C:\Users\AmaniChouk\Downloads\Grind-Camp-FINAL (2)\Grind-camp-claude-debug-chatbot-sync-xBKDO\functions"
powershell -ExecutionPolicy Bypass -File deploy-simple.ps1
```

## Ce que fait le script

1. Configure le projet GCP : `adp-413110`
2. Deploie la Cloud Function `sendRegistrationEmail`
3. Configure les variables d'environnement :
   - `ALLOWED_ORIGINS=https://grindcamp.fr`
   - `FROM_EMAIL=amani.bestoftours.co.uk`
   - `ADMIN_EMAILS=grindcamp84@gmail.com`
4. Utilise le secret `SERVICE_ACCOUNT_JSON` (deja cree)
5. Affiche l'URL de la fonction a la fin

## Apres le deploiement

1. **Copier l'URL affichee** (exemple : https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail)

2. **Mettre a jour le fichier** `../services/emailService.ts` ligne 4:
   ```typescript
   const CLOUD_FUNCTION_URL = 'VOTRE_URL_ICI';
   ```

3. **Tester** :
   ```powershell
   # Voir les logs
   gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 50
   
   # Tester l'envoi d'email
   cd ..
   npm run test:email
   ```

## Important : Domain-Wide Delegation

N'oubliez pas de configurer la domain-wide delegation dans Google Workspace Admin Console :

1. Aller sur https://admin.google.com
2. Securite > Controles de l'API > Delegation a l'echelle du domaine
3. Ajouter :
   - **Client ID** : `102906367840296772756`
   - **Scope** : `https://www.googleapis.com/auth/gmail.send`

## En cas d'erreur

### "Secret not found"
Le secret a deja ete cree avec succes lors de votre premier essai. Pas de probleme.

### "Permission denied"
Verifiez que vous etes connecte a GCP :
```powershell
gcloud auth login
gcloud config set project adp-413110
```

### "Delegation denied"
Configurez la domain-wide delegation (voir ci-dessus)

## Scripts disponibles

- `deploy-simple.ps1` - Deploiement direct (RECOMMANDE)
- `deploy-cloud-function.ps1` - Deploiement interactif (peut causer des erreurs d'encodage)
- `deploy-function.ps1` - Original avec emojis (NE PAS UTILISER)
