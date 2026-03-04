# 🏀 The Grind Camp - Guide de déploiement complet

## 📋 Table des matières

1. [Architecture du projet](#architecture-du-projet)
2. [Prérequis](#prérequis)
3. [Configuration initiale](#configuration-initiale)
4. [Déploiement local (développement)](#déploiement-local)
5. [Déploiement production](#déploiement-production)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture du projet

```
Frontend (React + Vite)
    ↓ (compile vers)
Google Cloud Storage Bucket (grindcamp.fr)
    ↓ (appelle lors des inscriptions)
Cloud Function (sendRegistrationEmail)
    ↓ (utilise)
Service Account avec Domain-Wide Delegation
    ↓ (envoie des emails via)
Gmail API (amani.bestoftours.co.uk)
```

### Pourquoi cette architecture ?

- **Frontend statique sur bucket** : Rapide, pas cher, scalable
- **Cloud Function pour les emails** : Sécurisé, les credentials ne sont jamais exposés
- **Service Account** : Permet d'envoyer des emails sans stocker de mot de passe

---

## ✅ Prérequis

### 1. Outils nécessaires

- [Node.js](https://nodejs.org/) (version 18+)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- PowerShell (déjà installé sur Windows)

### 2. Accès requis

- Accès admin à Google Cloud Project : `adp-413110`
- Accès admin à Google Workspace : `bestoftours.co.uk`
- Email `amani.bestoftours.co.uk` doit exister dans Workspace

---

## ⚙️ Configuration initiale

### Étape 1 : Cloner et installer

```powershell
# Cloner le projet (si pas déjà fait)
git clone <votre-repo>
cd Grind-camp-claude-debug-chatbot-sync-xBKDO

# Installer les dépendances
npm install
cd functions
npm install
cd ..
```

### Étape 2 : Configurer Google Cloud SDK

```powershell
# Se connecter à Google Cloud
gcloud auth login

# Définir le projet par défaut
gcloud config set project adp-413110

# Vérifier
gcloud config list
```

### Étape 3 : Configurer Domain-Wide Delegation

⚠️ **CRITIQUE** : Sans cette étape, les emails ne pourront pas être envoyés !

1. Allez sur https://admin.google.com (connectez-vous avec un compte admin de `bestoftours.co.uk`)
2. **Sécurité** > **Accès et contrôle des données** > **Contrôles de l'API**
3. Cliquez sur **"GÉRER LA DÉLÉGATION À L'ÉCHELLE DU DOMAINE"**
4. Cliquez sur **"Ajouter"**
5. Entrez :
   - **ID client** : `102906367840296772756`
   - **Portées OAuth** : `https://www.googleapis.com/auth/gmail.send`
6. Cliquez sur **"Autoriser"**

### Étape 4 : Déployer la Cloud Function

```powershell
# Depuis le dossier racine
cd functions
.\deploy-function.ps1
```

Choisissez **"1. Premier déploiement"** la première fois.

Le script va :
1. Créer le secret dans Secret Manager avec le service account
2. Configurer les permissions
3. Déployer la fonction

**Notez l'URL retournée**, vous en aurez besoin !

### Étape 5 : Mettre à jour l'URL dans le frontend

Éditez `services/emailService.ts` :

```typescript
const CLOUD_FUNCTION_URL = 'https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail';
```

Remplacez par l'URL que vous avez obtenue à l'étape 4.

---

## 💻 Déploiement local (développement)

### Lancer le serveur de développement

```powershell
npm run dev
```

Le site sera accessible sur : http://localhost:6000

### Tester l'envoi d'emails en local

1. Le frontend local (localhost:6000) appellera la **vraie** Cloud Function
2. Faites une inscription de test
3. Vérifiez les logs :

```powershell
gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 50
```

---

## 🚀 Déploiement production

### Option A : Script automatique (recommandé)

```powershell
# À la racine du projet
.\deploy.ps1
```

Ce script va :
1. Build le frontend
2. Upload vers le bucket
3. Configurer le cache

### Option B : Commandes manuelles

```powershell
# 1. Build
npm run build

# 2. Upload
gsutil -m rm -r gs://grindcamp.fr/**
gsutil -m cp -r dist/* gs://grindcamp.fr/

# 3. Cache
gsutil -m setmeta -h "Cache-Control:public, max-age=3600" gs://grindcamp.fr/**/*.html
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://grindcamp.fr/**/*.js
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000" gs://grindcamp.fr/**/*.css
```

### Vérification

Accédez à : https://grindcamp.fr

---

## 🧪 Tests

### Test manuel de la Cloud Function

```powershell
# Test avec curl (dans PowerShell)
Invoke-RestMethod -Method Post `
  -Uri "https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail" `
  -ContentType "application/json" `
  -Body '{
    "id": "TEST123",
    "parent": {
      "firstName": "Test",
      "lastName": "Parent",
      "email": "votre-email@test.com",
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

### Test complet (inscription réelle)

1. Allez sur http://localhost:6000 (ou https://grindcamp.fr)
2. Cliquez sur "S'inscrire"
3. Remplissez le formulaire
4. Soumettez
5. Vérifiez :
   - Email reçu sur l'adresse du parent
   - Email reçu sur grindcamp84@gmail.com

---

## 🔒 Sécurité

### ⚠️ IMPORTANT : Fichiers sensibles

Le fichier `services/adp-413110-176b452e6fb2.json` contient des credentials.

**NE JAMAIS** :
- Le committer dans Git (déjà dans .gitignore)
- Le partager publiquement
- Le mettre dans le frontend

**TOUJOURS** :
- Le garder en local
- L'utiliser uniquement via Secret Manager en production
- Le régénérer tous les 90 jours

### Rotation des clés (tous les 3 mois)

```powershell
# 1. Créer une nouvelle clé
gcloud iam service-accounts keys create new-key.json `
  --iam-account python-automation@adp-413110.iam.gserviceaccount.com

# 2. Mettre à jour le secret
gcloud secrets versions add SERVICE_ACCOUNT_JSON --data-file=new-key.json

# 3. Supprimer l'ancienne clé (récupérez l'ID avec la commande suivante)
gcloud iam service-accounts keys list `
  --iam-account python-automation@adp-413110.iam.gserviceaccount.com

gcloud iam service-accounts keys delete <KEY_ID> `
  --iam-account python-automation@adp-413110.iam.gserviceaccount.com

# 4. Remplacer le fichier local
Move-Item new-key.json services/adp-413110-176b452e6fb2.json -Force
```

---

## 🐛 Troubleshooting

### Erreur : "Delegation denied"

**Cause** : Domain-wide delegation pas configurée

**Solution** :
1. Vérifiez dans Google Workspace Admin Console
2. Client ID : `102906367840296772756`
3. Scope : `https://www.googleapis.com/auth/gmail.send`

### Erreur : "User not found"

**Cause** : Email `amani.bestoftours.co.uk` n'existe pas

**Solution** : Créez cet email dans Google Workspace

### Emails pas reçus

**Vérifications** :

```powershell
# 1. Voir les logs de la fonction
gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 50

# 2. Vérifier les quotas Gmail API
# Allez sur : https://console.cloud.google.com/apis/api/gmail.googleapis.com/quotas
```

**Autres vérifications** :
- Dossier spam
- Vérifiez que l'URL de la fonction est correcte dans `emailService.ts`
- Vérifiez les permissions du service account

### Erreur CORS

**Cause** : L'origine n'est pas autorisée

**Solution** :

```powershell
# Redéployer avec la bonne origine
cd functions
gcloud functions deploy sendRegistrationEmail `
  --set-env-vars "ALLOWED_ORIGINS=https://grindcamp.fr,https://www.grindcamp.fr,http://localhost:6000"
```

### Le site ne se met pas à jour

**Cause** : Cache CDN/Browser

**Solution** :

```powershell
# 1. Vider le cache CDN (si Load Balancer configuré)
gcloud compute url-maps invalidate-cdn-cache grindcamp-lb --path "/*"

# 2. Forcer rechargement dans le navigateur
# Ctrl + Shift + R (Chrome)
# Ctrl + F5 (Firefox)
```

---

## 📊 Monitoring

### Voir les métriques de la fonction

```powershell
# Logs en temps réel
gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 100

# Métriques
# Allez sur : https://console.cloud.google.com/functions/details/europe-west1/sendRegistrationEmail
```

### Coûts

- **Cloud Storage** : ~0.02€/GB/mois
- **Cloud Functions** : 
  - 2 millions d'invocations gratuites/mois
  - Puis 0.40€ par million
- **Gmail API** : 
  - 1 milliard de quotas/jour (gratuit)

Coût estimé pour The Grind Camp : **< 5€/mois**

---

## 📚 Ressources

- [Documentation Cloud Functions](https://cloud.google.com/functions/docs)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Domain-Wide Delegation](https://developers.google.com/admin-sdk/directory/v1/guides/delegation)
- [Vite Documentation](https://vitejs.dev/)

---

## 📞 Support

En cas de problème :

1. **Logs** : `gcloud functions logs read sendRegistrationEmail --region europe-west1`
2. **Status** : https://status.cloud.google.com/
3. **Contact** : Pascal Mercier - 07 66 82 23 22

---

## 🎯 Checklist de déploiement

Avant chaque déploiement en production :

- [ ] Tests en local (localhost:6000)
- [ ] Test d'inscription complet
- [ ] Vérification réception emails
- [ ] Vérification logs Cloud Function
- [ ] Build réussi (`npm run build`)
- [ ] Upload vers bucket
- [ ] Test sur le domaine production
- [ ] Vérification version mobile
- [ ] Backup de la version précédente (si besoin)

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2026  
**Port local** : 6000  
**Production** : https://grindcamp.fr
