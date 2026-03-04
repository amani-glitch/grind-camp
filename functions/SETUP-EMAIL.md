# Configuration de l'envoi d'emails avec Service Account

## Architecture du déploiement

Votre projet utilise une architecture séparée :
- **Frontend** : Déployé sur Google Cloud Storage (bucket) - site statique
- **Backend (Cloud Function)** : Héberge la logique d'envoi d'emails

## Prérequis

### 1. Service Account avec Domain-Wide Delegation

Votre service account est déjà créé : `python-automation@adp-413110.iam.gserviceaccount.com`

### 2. Configuration Domain-Wide Delegation dans Google Workspace

⚠️ **IMPORTANT** : Vous devez configurer la délégation dans la console admin Google Workspace de `bestoftours.co.uk`

1. Allez sur https://admin.google.com
2. Sécurité > Accès et contrôle des données > Contrôles de l'API
3. Cliquez sur "GÉRER LA DÉLÉGATION À L'ÉCHELLE DU DOMAINE"
4. Ajoutez un nouveau client API :
   - **Client ID** : `102906367840296772756` (depuis votre service account)
   - **Scopes OAuth** : `https://www.googleapis.com/auth/gmail.send`
5. Autorisez

### 3. Vérifier que l'email amani.bestoftours.co.uk existe

L'email `amani.bestoftours.co.uk` doit être un compte Gmail/Workspace actif car le service account va se faire passer pour cet email.

## Déploiement de la Cloud Function

### Étape 1 : Créer le secret dans Google Cloud Secret Manager

```bash
# Se connecter à GCP
gcloud auth login
gcloud config set project adp-413110

# Créer le secret avec le contenu du service account
gcloud secrets create SERVICE_ACCOUNT_JSON --data-file="../services/adp-413110-176b452e6fb2.json" --replication-policy="automatic"

# Vérifier
gcloud secrets describe SERVICE_ACCOUNT_JSON
```

### Étape 2 : Donner l'accès au secret à Cloud Functions

```bash
# Autoriser le service account Cloud Functions à lire le secret
PROJECT_NUMBER=$(gcloud projects describe adp-413110 --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding SERVICE_ACCOUNT_JSON \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Étape 3 : Déployer la Cloud Function

```bash
cd functions

# Déploiement PRODUCTION
gcloud functions deploy sendRegistrationEmail \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region europe-west1 \
  --set-env-vars ALLOWED_ORIGINS="https://grindcamp.fr,https://www.grindcamp.fr,http://localhost:6000",FROM_EMAIL="amani.bestoftours.co.uk",ADMIN_EMAILS="grindcamp84@gmail.com" \
  --set-secrets GOOGLE_SERVICE_ACCOUNT=SERVICE_ACCOUNT_JSON:latest \
  --max-instances 10 \
  --memory 256MB \
  --timeout 60s

# Déploiement DEV (pour tester en local)
gcloud functions deploy sendRegistrationEmail-dev \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region europe-west1 \
  --set-env-vars ALLOWED_ORIGINS="*",FROM_EMAIL="amani.bestoftours.co.uk",ADMIN_EMAILS="grindcamp84@gmail.com" \
  --set-secrets GOOGLE_SERVICE_ACCOUNT=SERVICE_ACCOUNT_JSON:latest
```

### Étape 4 : Obtenir l'URL de la fonction

```bash
gcloud functions describe sendRegistrationEmail --region europe-west1 --format="value(httpsTrigger.url)"
```

### Étape 5 : Mettre à jour l'URL dans le frontend

Copiez l'URL obtenue et mettez-la dans `services/emailService.ts` :

```typescript
const CLOUD_FUNCTION_URL = 'https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail';
```

## Déploiement du Frontend sur Bucket

### Étape 1 : Build du projet

```bash
# Assurez-vous d'être à la racine du projet
npm install
npm run build
```

Cela va créer un dossier `dist/` avec tous les fichiers statiques.

### Étape 2 : Créer et configurer le bucket

```bash
# Créer le bucket (si pas déjà fait)
gsutil mb -p adp-413110 -c STANDARD -l europe-west1 gs://grindcamp.fr

# Rendre le bucket public pour hébergement web
gsutil iam ch allUsers:objectViewer gs://grindcamp.fr

# Configurer l'index
gsutil web set -m index.html -e index.html gs://grindcamp.fr
```

### Étape 3 : Déployer les fichiers

```bash
# Supprimer les anciens fichiers
gsutil -m rm -r gs://grindcamp.fr/**

# Upload des nouveaux fichiers
gsutil -m cp -r dist/* gs://grindcamp.fr/

# Définir les headers de cache
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://grindcamp.fr/**/*.html
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://grindcamp.fr/**/*.js
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://grindcamp.fr/**/*.css
```

### Étape 4 : Configurer le Load Balancer (pour HTTPS et domaine personnalisé)

Si ce n'est pas encore fait, vous devez configurer un Load Balancer pour :
- Utiliser votre domaine `grindcamp.fr`
- Avoir HTTPS (certificat SSL)

```bash
# Créer l'adresse IP statique
gcloud compute addresses create grindcamp-ip --global

# Récupérer l'IP
gcloud compute addresses describe grindcamp-ip --global --format="value(address)"
```

Ensuite, configurez votre DNS pour pointer vers cette IP.

## Script de déploiement automatique

Créez un fichier `deploy.sh` à la racine :

```bash
#!/bin/bash
set -e

echo "🚀 Déploiement de The Grind Camp..."

# 1. Build du frontend
echo "📦 Build du frontend..."
npm install
npm run build

# 2. Upload vers le bucket
echo "☁️ Upload vers Google Cloud Storage..."
gsutil -m rm -r gs://grindcamp.fr/** || true
gsutil -m cp -r dist/* gs://grindcamp.fr/

# 3. Configuration du cache
echo "⚡ Configuration du cache..."
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://grindcamp.fr/**/*.html
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://grindcamp.fr/**/*.js
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://grindcamp.fr/**/*.css

echo "✅ Déploiement terminé!"
echo "🌐 Site disponible sur : https://grindcamp.fr"
```

Rendez-le exécutable :
```bash
chmod +x deploy.sh
```

## Test en local

```bash
# Terminal 1 : Frontend (port 6000)
npm run dev

# Terminal 2 : Test de la Cloud Function
curl -X POST https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TEST123",
    "parent": {
      "firstName": "Test",
      "lastName": "Parent",
      "email": "test@example.com",
      "phone": "0600000000",
      "address": "123 rue Test",
      "postalCode": "84210",
      "city": "Pernes"
    },
    "child": {
      "firstName": "Test",
      "lastName": "Enfant",
      "birthDate": "2010-01-01",
      "category": "U13",
      "level": "Intermédiaire",
      "tshirtSize": "M"
    },
    "health": {
      "allergies": "Aucune",
      "treatment": "Aucun",
      "medicalInfo": "RAS"
    }
  }'
```

## Sécurité

### ⚠️ IMPORTANT : Ne JAMAIS commit le service account dans Git

Le fichier `services/adp-413110-176b452e6fb2.json` contient des credentials sensibles.

Vérifiez votre `.gitignore` :

```gitignore
# Service Account (SENSIBLE)
services/*.json
*.json

# Environment variables
.env
.env.local
.env.production

# Build
dist/
node_modules/
```

### Rotation des clés

Pour plus de sécurité, pensez à régénérer la clé du service account tous les 90 jours :

```bash
gcloud iam service-accounts keys create new-key.json \
  --iam-account python-automation@adp-413110.iam.gserviceaccount.com

# Puis remplacer dans Secret Manager
gcloud secrets versions add SERVICE_ACCOUNT_JSON --data-file=new-key.json
```

## Troubleshooting

### Erreur : "Delegation denied"

→ Vérifiez que la domain-wide delegation est bien configurée dans Google Workspace Admin Console avec le bon Client ID et scope.

### Erreur : "User not found"

→ Vérifiez que `amani.bestoftours.co.uk` existe bien dans votre Workspace.

### Erreur CORS

→ Ajoutez votre domaine dans ALLOWED_ORIGINS lors du déploiement de la fonction.

### Emails non reçus

1. Vérifiez les logs de la Cloud Function :
```bash
gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 50
```

2. Vérifiez le dossier spam
3. Vérifiez les quotas Gmail API dans GCP Console

## Monitoring

Pour surveiller les envois d'emails :

```bash
# Voir les logs
gcloud functions logs read sendRegistrationEmail --region europe-west1

# Voir les métriques
gcloud monitoring dashboards list
```

## Support

En cas de problème :
1. Vérifiez les logs Cloud Function
2. Vérifiez la configuration domain-wide delegation
3. Testez avec un email simple d'abord
4. Contactez votre administrateur Google Workspace si nécessaire
