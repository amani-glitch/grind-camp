# 📚 GUIDES DISPONIBLES - Grind Camp

## 🎯 Par où commencer ?

Voici tous les guides disponibles selon votre besoin :

---

## 📖 Guides Principaux

### 1. 🚀 **SESSION-COMPLETE-SUMMARY.md**
**📌 COMMENCEZ ICI !**
- Résumé complet de tout ce qui a été fait
- Architecture finale
- Configuration actuelle
- Tests effectués
- Fichiers créés et modifiés

### 2. 📧 **CHANGER-EMAIL-ENVOYEUR.md**
**Pour changer l'email d'envoi (ex: vers contact@grindcamp.fr)**
- Guide complet étape par étape
- Configuration Google Workspace
- Délégation de domaine
- Redéploiement
- FAQ complète

### 3. ⚡ **QUICK-CHANGE-EMAIL.md**
**Version rapide du guide ci-dessus (3 étapes)**
- Pour les personnes pressées
- Commandes prêtes à copier-coller
- ~10 minutes

---

## 🛠️ Guides Techniques

### 4. 📋 **DEPLOYMENT-GUIDE.md**
- Guide complet de déploiement
- Frontend + Backend
- Configuration détaillée
- Troubleshooting

### 5. ⚡ **QUICK-START.md**
- Démarrage rapide du projet
- Installation
- Configuration
- Premier lancement

### 6. 📄 **functions/README-DEPLOY.md**
- Spécifique au déploiement de la Cloud Function
- Commandes détaillées
- Variables d'environnement

### 7. 🔧 **functions/TECHNICAL-DETAILS.md**
- Architecture technique
- Fonctionnement de l'authentification
- Détails de l'implémentation

---

## 🎯 Guides par Cas d'Usage

| Vous voulez... | Consultez... |
|----------------|--------------|
| Comprendre ce qui a été fait | `SESSION-COMPLETE-SUMMARY.md` |
| Changer l'email d'envoi | `CHANGER-EMAIL-ENVOYEUR.md` ou `QUICK-CHANGE-EMAIL.md` |
| Déployer en production | `DEPLOYMENT-GUIDE.md` |
| Démarrer le projet localement | `QUICK-START.md` |
| Comprendre l'architecture | `functions/TECHNICAL-DETAILS.md` |
| Redéployer la fonction | `functions/README-DEPLOY.md` |

---

## 🔧 Scripts Disponibles

### Dans le dossier `functions/` :

1. **`deploy-simple.ps1`**
   - Déploiement complet de la Cloud Function
   - Sans emojis (compatible tous encodages)
   ```powershell
   cd functions
   powershell -ExecutionPolicy Bypass -File deploy-simple.ps1
   ```

2. **`change-sender-email.ps1`**
   - Changer l'email d'envoi en un clic
   - Mode interactif avec confirmation
   ```powershell
   cd functions
   powershell -ExecutionPolicy Bypass -File change-sender-email.ps1
   ```

3. **`deploy-cloud-function.ps1`**
   - Version avec emojis (plus jolie mais encodage UTF-8 requis)
   ```powershell
   cd functions
   powershell -ExecutionPolicy Bypass -File deploy-cloud-function.ps1
   ```

### À la racine :

4. **`pre-deploy-check.ps1`**
   - Vérifications avant déploiement
   - Liste les credentials
   ```powershell
   powershell -ExecutionPolicy Bypass -File pre-deploy-check.ps1
   ```

---

## 📊 Status Actuel

✅ **Tout fonctionne !**

- Frontend : `http://localhost:5174`
- Cloud Function : `https://sendregistrationemail-u5azdc2cvq-ew.a.run.app`
- Email d'envoi : `yacine@bestoftours.co.uk`
- Email admin : `grindcamp84@gmail.com`
- Validation : Frontend + Backend (support international)

---

## 🚨 Important à Savoir

### CORS (Sécurité)
⚠️ **Actuellement : `ALLOWED_ORIGINS=*` (tous domaines autorisés)**
- **OK pour développement**
- **⚠️ À RESTREINDRE en production !**

Pour restreindre en production :
```powershell
cd functions
# Modifier deploy-simple.ps1 ligne avec ALLOWED_ORIGINS
# Changer de * vers https://grindcamp.fr
# Puis redéployer
```

### Service Account
🔐 Le fichier `services/adp-413110-176b452e6fb2.json` contient les credentials
- **NE JAMAIS COMMITER** sur Git (déjà dans .gitignore)
- **NE PAS PARTAGER** publiquement
- **GARDER SÉCURISÉ**

---

## 🆘 En Cas de Problème

1. **Les emails ne sont pas envoyés**
   - Vérifiez les logs : `gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 20`
   - Vérifiez la délégation de domaine dans Google Admin Console
   - Testez directement l'API avec `test-email.json`

2. **Erreur CORS**
   - Vérifiez `ALLOWED_ORIGINS` dans la Cloud Function
   - Vérifiez l'URL du frontend dans `services/emailService.ts`

3. **Erreur "Invalid phone"**
   - Assurez-vous que le téléphone contient 8-15 chiffres
   - Format international accepté : `+33612345678`, `0612345678`, etc.

4. **Frontend ne se lance pas**
   - Vérifiez que le port 5174 est libre
   - Exécutez `npm install` puis `npm run dev`

---

## 📞 Commandes Rapides

```powershell
# Voir les logs
gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 20

# Tester l'API
Invoke-RestMethod -Uri "https://sendregistrationemail-u5azdc2cvq-ew.a.run.app" -Method Post -Body (Get-Content test-email.json -Raw) -ContentType "application/json"

# Redéployer la fonction
cd functions
powershell -ExecutionPolicy Bypass -File deploy-simple.ps1

# Démarrer le frontend
npm run dev

# Build pour production
npm run build
```

---

## 🎓 Documentation Complète

Pour une compréhension complète du système :

1. Lisez **`SESSION-COMPLETE-SUMMARY.md`** (vue d'ensemble)
2. Consultez **`functions/TECHNICAL-DETAILS.md`** (architecture)
3. Suivez **`DEPLOYMENT-GUIDE.md`** (déploiement)

---

**Tous les guides sont dans le dossier racine du projet ! 📁**

Bonne chance ! 🚀
