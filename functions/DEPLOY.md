# Déploiement de la Cloud Function Email

## Prérequis
- Google Cloud SDK installé (`gcloud`)
- Compte Google Cloud avec facturation activée
- Projet: `adp-413110`

## Option 1: Utiliser un App Password Gmail (Recommandé - Plus simple)

### Étape 1: Créer un App Password
1. Allez sur https://myaccount.google.com/apppasswords
2. Connectez-vous avec grindcamp84@gmail.com
3. Créez un nouveau mot de passe d'application pour "Mail"
4. Copiez le mot de passe généré (16 caractères)

### Étape 2: Déployer la fonction
```bash
cd functions
npm install

gcloud functions deploy sendRegistrationEmail \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region europe-west1 \
  --project adp-413110 \
  --set-env-vars GMAIL_USER=grindcamp84@gmail.com,GMAIL_APP_PASSWORD=VOTRE_APP_PASSWORD
```

### Étape 3: Mettre à jour le frontend
Après déploiement, notez l'URL de la fonction (ex: `https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail`)

Créez un fichier `.env` à la racine du projet:
```
VITE_EMAIL_FUNCTION_URL=https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail
```

---

## Option 2: Utiliser le Service Account (Avancé)

⚠️ Nécessite Google Workspace avec délégation de domaine.

### Étape 1: Configurer le Service Account
1. Allez dans Google Cloud Console > IAM > Service Accounts
2. Activez "Domain-wide Delegation" pour le service account
3. Dans Google Workspace Admin, autorisez le scope `gmail.send`

### Étape 2: Déployer avec le Service Account
```bash
gcloud functions deploy sendRegistrationEmail \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region europe-west1 \
  --project adp-413110 \
  --set-env-vars GOOGLE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

---

## Tester la fonction

```bash
curl -X POST https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail \
  -H "Content-Type: application/json" \
  -d '{
    "id": "TEST-001",
    "parent": {
      "firstName": "Test",
      "lastName": "Parent",
      "email": "votre-email@test.com",
      "phone": "0600000000",
      "address": "123 Rue Test",
      "postalCode": "84000",
      "city": "Avignon"
    },
    "child": {
      "firstName": "Junior",
      "lastName": "Test",
      "birthDate": "2015-01-01",
      "category": "U13",
      "level": "Intermédiaire",
      "tshirtSize": "M"
    },
    "health": {}
  }'
```

## Support
Contact: grindcamp84@gmail.com
