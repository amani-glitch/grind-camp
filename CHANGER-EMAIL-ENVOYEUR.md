# 📧 Comment Changer l'Email d'Envoi

Ce guide explique comment changer l'email d'envoi (par exemple de `yacine@bestoftours.co.uk` vers `contact@grindcamp.fr`) **sans modifier le code**.

---

## 🎯 Prérequis

Vous devez avoir :
- ✅ Un domaine avec **Google Workspace** (Gmail professionnel)
- ✅ Accès **Admin** à Google Workspace
- ✅ Le nouvel email créé dans votre Google Workspace (ex: `contact@grindcamp.fr`)

---

## 📝 Étape 1 : Créer le nouvel email dans Google Workspace

1. Allez sur **Google Admin Console** : https://admin.google.com
2. **Utilisateurs** → **Ajouter un utilisateur**
3. Créez l'email : `contact@grindcamp.fr` (ou autre)
4. Notez bien cet email, vous en aurez besoin

---

## 🔐 Étape 2 : Configurer la Délégation de Domaine

### 2.1 - Activer la délégation pour le Service Account

1. Allez sur **Google Admin Console** : https://admin.google.com
2. **Sécurité** → **Accès et contrôle des données** → **Contrôles de l'API**
3. Cliquez sur **Gérer la délégation à l'échelle du domaine**
4. Cliquez sur **Ajouter**
5. Remplissez :
   - **ID client** : `102906367840296772756`
   - **Champs d'application OAuth** : `https://www.googleapis.com/auth/gmail.send`
6. Cliquez sur **Autoriser**

### 2.2 - Autoriser l'email spécifique

L'email `contact@grindcamp.fr` est maintenant automatiquement autorisé car la délégation est au niveau du domaine entier.

---

## 🚀 Étape 3 : Redéployer la Cloud Function avec le nouvel email

### Option A : Via Script PowerShell (Recommandé)

```powershell
cd functions
powershell -ExecutionPolicy Bypass -File change-sender-email.ps1
```

Le script vous demandera le nouvel email et redéploiera automatiquement.

### Option B : Manuellement via Commande

```powershell
cd functions

gcloud functions deploy sendRegistrationEmail `
    --gen2 `
    --runtime nodejs20 `
    --trigger-http `
    --allow-unauthenticated `
    --region europe-west1 `
    --memory 256MB `
    --timeout 60s `
    --set-secrets="GOOGLE_SERVICE_ACCOUNT=SERVICE_ACCOUNT_JSON:latest" `
    --set-env-vars "FROM_EMAIL=contact@grindcamp.fr,DELEGATED_EMAIL=contact@grindcamp.fr,ADMIN_EMAILS=grindcamp84@gmail.com,ALLOWED_ORIGINS=*"
```

**Remplacez** :
- `contact@grindcamp.fr` par votre nouvel email
- `grindcamp84@gmail.com` par l'email admin qui recevra les notifications

### Option C : Via Google Cloud Console

1. Allez sur **Cloud Functions** : https://console.cloud.google.com/functions
2. Cliquez sur `sendRegistrationEmail`
3. Cliquez sur **MODIFIER**
4. Descendez à **Variables d'environnement**
5. Modifiez :
   - `FROM_EMAIL` : `contact@grindcamp.fr`
   - `DELEGATED_EMAIL` : `contact@grindcamp.fr`
   - `ADMIN_EMAILS` : `admin@grindcamp.fr` (optionnel)
6. Cliquez sur **DÉPLOYER**

---

## ✅ Étape 4 : Tester

Une fois redéployé, testez avec PowerShell :

```powershell
$testData = @'
{
  "id": "TEST-NEW-EMAIL",
  "parent": {
    "firstName": "Test",
    "lastName": "User",
    "email": "votre-email@test.com",
    "phone": "+33612345678",
    "address": "123 rue test",
    "postalCode": "75001",
    "city": "Paris"
  },
  "child": {
    "firstName": "Enfant",
    "lastName": "Test",
    "birthDate": "2012-01-01",
    "category": "U13",
    "club": "Test",
    "level": "Débutant",
    "tshirtSize": "M"
  },
  "health": {
    "allergies": "Aucune",
    "treatment": "Aucun",
    "medicalInfo": "RAS"
  }
}
'@

Invoke-RestMethod -Uri "https://sendregistrationemail-u5azdc2cvq-ew.a.run.app" -Method Post -Body $testData -ContentType "application/json"
```

Vous devriez recevoir l'email de **contact@grindcamp.fr** (ou votre nouvel email) !

---

## 🔄 Pour revenir à l'ancien email

Redéployez simplement avec l'ancien email :

```powershell
cd functions

gcloud functions deploy sendRegistrationEmail `
    --gen2 `
    --runtime nodejs20 `
    --trigger-http `
    --allow-unauthenticated `
    --region europe-west1 `
    --memory 256MB `
    --timeout 60s `
    --set-secrets="GOOGLE_SERVICE_ACCOUNT=SERVICE_ACCOUNT_JSON:latest" `
    --set-env-vars "FROM_EMAIL=yacine@bestoftours.co.uk,DELEGATED_EMAIL=yacine@bestoftours.co.uk,ADMIN_EMAILS=grindcamp84@gmail.com,ALLOWED_ORIGINS=*"
```

---

## 📌 Résumé

| Étape | Action | Durée |
|-------|--------|-------|
| 1 | Créer nouvel email dans Google Workspace | 2 min |
| 2 | Configurer délégation de domaine (une seule fois) | 5 min |
| 3 | Redéployer Cloud Function avec nouvel email | 3 min |
| 4 | Tester | 1 min |

**Total : ~10 minutes** ⚡

---

## ❓ FAQ

**Q : Faut-il reconfigurer la délégation à chaque changement d'email ?**  
R : NON ! La délégation est configurée **une seule fois** au niveau du domaine. Tous les emails du domaine peuvent être utilisés.

**Q : Puis-je utiliser plusieurs emails d'envoi ?**  
R : OUI ! Redéployez simplement avec un email différent selon les besoins.

**Q : Le code change-t-il ?**  
R : NON ! Tout se fait via les variables d'environnement.

**Q : Combien de temps pour que le changement soit actif ?**  
R : **~2-3 minutes** après le redéploiement.

---

## 📞 Support

Si problème :
1. Vérifiez que l'email existe dans Google Workspace
2. Vérifiez que la délégation est bien configurée
3. Attendez 2-3 minutes après le redéploiement
4. Consultez les logs : `gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 20`
