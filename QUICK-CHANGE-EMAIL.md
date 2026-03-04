# 🚀 QUICK : Changer l'Email d'Envoi en 3 Étapes

## Vous voulez changer de `yacine@bestoftours.co.uk` vers `contact@grindcamp.fr` ?

---

### ✅ Étape 1 : Créer l'email dans Google Workspace
👉 https://admin.google.com → Utilisateurs → Créer `contact@grindcamp.fr`

---

### ✅ Étape 2 : Configurer la délégation (UNE SEULE FOIS)
👉 https://admin.google.com → Sécurité → API Controls → Domain-wide Delegation

**Ajouter :**
- Client ID : `102906367840296772756`
- Scope : `https://www.googleapis.com/auth/gmail.send`

---

### ✅ Étape 3 : Redéployer avec le nouvel email

**Ouvrez PowerShell et exécutez :**

```powershell
cd functions
powershell -ExecutionPolicy Bypass -File change-sender-email.ps1
```

**OU manuellement :**

```powershell
cd functions

gcloud functions deploy sendRegistrationEmail `
    --gen2 `
    --runtime nodejs20 `
    --trigger-http `
    --allow-unauthenticated `
    --region europe-west1 `
    --set-secrets="GOOGLE_SERVICE_ACCOUNT=SERVICE_ACCOUNT_JSON:latest" `
    --set-env-vars "FROM_EMAIL=contact@grindcamp.fr,DELEGATED_EMAIL=contact@grindcamp.fr,ADMIN_EMAILS=grindcamp84@gmail.com,ALLOWED_ORIGINS=*"
```

**Remplacez** `contact@grindcamp.fr` par votre email !

---

## ✅ TERMINÉ !

Emails maintenant envoyés depuis : **contact@grindcamp.fr** 🎉

**Temps total : ~10 minutes**

---

## 🔄 Pour changer à nouveau ?

Répétez juste l'Étape 3 avec le nouvel email. C'est tout ! 🚀
