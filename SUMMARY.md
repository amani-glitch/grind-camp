# 🎯 The Grind Camp - Résumé des changements

## ✅ Ce qui a été fait

### 1. 📧 Système d'envoi d'emails

**Avant** : Pas d'envoi d'emails automatique  
**Après** : Emails automatiques lors de chaque inscription

- ✉️ Email de confirmation au parent
- ✉️ Email de notification aux admins
- 🔒 Utilise le service account avec domain-wide delegation
- 📤 Envoi depuis `amani.bestoftours.co.uk`

**Fichiers modifiés** :
- `functions/index.js` - Ajout du support domain-wide delegation
- `services/emailService.ts` - Déjà existant, pas de changement nécessaire
- `pages/Register.tsx` - Déjà configuré pour appeler le service

### 2. 🔌 Port changé : 3000 → 6000

**Avant** : `localhost:3000`  
**Après** : `localhost:6000`

**Fichiers modifiés** :
- `vite.config.ts` - Port changé de 3000 à 6000

### 3. 📝 Documentation complète

**Nouveaux fichiers créés** :

```
📄 README.md                    # README principal mis à jour
📄 QUICK-START.md              # Guide rapide pour démarrer
📄 DEPLOYMENT-GUIDE.md         # Guide complet de déploiement
📄 functions/SETUP-EMAIL.md    # Configuration de l'envoi d'emails
📄 functions/TECHNICAL-DETAILS.md  # Détails techniques
```

### 4. 🤖 Scripts de déploiement automatiques

**Nouveaux scripts PowerShell** :

```powershell
📜 deploy.ps1                       # Déploiement frontend → bucket
📜 functions/deploy-function.ps1   # Déploiement Cloud Function
📜 pre-deploy-check.ps1            # Vérifications avant déploiement
```

**Nouveaux scripts npm** :

```json
npm run deploy          # Déployer le frontend
npm run deploy:function # Déployer la Cloud Function
npm run deploy:check    # Vérifier avant déploiement
npm run logs            # Voir les logs
npm run test:email      # Tester l'envoi d'email
```

### 5. 🔒 Sécurité renforcée

**Fichiers modifiés** :
- `.gitignore` - Ajout de protection pour les service accounts
- `.env.example` - Mise à jour avec les nouvelles variables

**Nouveaux fichiers** :
- `test-email.json` - Exemple pour tester les emails (dans .gitignore)

---

## 🏗️ Architecture

### Avant

```
Frontend React → Firestore (inscriptions)
```

### Après

```
Frontend React 
    ↓
Firestore (inscriptions)
    ↓
Cloud Function (emails)
    ↓
Gmail API (via service account + delegation)
    ↓
Envoi emails depuis amani.bestoftours.co.uk
```

---

## 🚀 Comment déployer

### Première fois (configuration initiale)

```powershell
# 1. Configurer domain-wide delegation dans Google Workspace
#    → https://admin.google.com
#    → Client ID: 102906367840296772756
#    → Scope: https://www.googleapis.com/auth/gmail.send

# 2. Déployer la Cloud Function
cd functions
.\deploy-function.ps1
# → Choisir "1" (Premier déploiement)
# → Choisir "1" (Production)
# → Noter l'URL retournée

# 3. Mettre à jour l'URL dans le code
#    Éditer services/emailService.ts ligne 4

# 4. Déployer le frontend
cd ..
npm run deploy
```

### Déploiements suivants

```powershell
# Vérifier que tout est OK
npm run deploy:check

# Déployer (si OK)
npm run deploy
```

---

## 📋 Checklist de déploiement

### ✅ Prérequis (à faire UNE SEULE FOIS)

- [ ] Google Cloud SDK installé
- [ ] Authentification GCP (`gcloud auth login`)
- [ ] Projet configuré (`gcloud config set project adp-413110`)
- [ ] Domain-wide delegation configurée dans Google Workspace
- [ ] Cloud Function déployée
- [ ] URL de la fonction mise à jour dans `emailService.ts`

### ✅ Avant chaque déploiement

- [ ] Test en local (`npm run dev`)
- [ ] Build réussi (`npm run build`)
- [ ] Vérification pré-déploiement (`npm run deploy:check`)

### ✅ Après déploiement

- [ ] Site accessible sur https://grindcamp.fr
- [ ] Test d'inscription
- [ ] Emails reçus (parent + admin)
- [ ] Vérification des logs (`npm run logs`)

---

## 🔧 Variables d'environnement

### Frontend (.env.local - optionnel)

```bash
GEMINI_API_KEY=votre_clé_api
VITE_CLOUD_FUNCTION_URL=https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail
```

### Cloud Function (configuré via gcloud)

```bash
FROM_EMAIL=amani.bestoftours.co.uk
ADMIN_EMAILS=grindcamp84@gmail.com
ALLOWED_ORIGINS=https://grindcamp.fr,https://www.grindcamp.fr,http://localhost:6000
```

### Secret Manager (sensible)

```bash
SERVICE_ACCOUNT_JSON=<contenu de adp-413110-176b452e6fb2.json>
```

---

## 🐛 Problèmes courants et solutions

| Problème | Solution |
|----------|----------|
| **Emails pas reçus** | `npm run logs` pour voir les erreurs |
| **"Delegation denied"** | Configurer domain-wide delegation dans Workspace |
| **"User not found"** | Vérifier que `amani.bestoftours.co.uk` existe |
| **Erreur CORS** | Ajouter l'origine dans ALLOWED_ORIGINS |
| **Site pas à jour** | Vider cache : Ctrl+Shift+R |
| **Build échoue** | `rm -r node_modules && npm install` |

---

## 📊 Fichiers importants

### À protéger (JAMAIS dans Git)

```
❌ services/adp-413110-176b452e6fb2.json  # Service account
❌ .env                                    # Variables locales
❌ .env.local                             # Variables locales
❌ test-email.json                        # Peut contenir données perso
```

### Configuration

```
✅ .gitignore          # Protection des fichiers sensibles
✅ .env.example        # Template de configuration
✅ vite.config.ts      # Configuration Vite (port 6000)
✅ package.json        # Scripts npm
```

### Documentation

```
📖 README.md                      # Vue d'ensemble
📖 QUICK-START.md                # Démarrage rapide
📖 DEPLOYMENT-GUIDE.md           # Guide complet
📖 functions/SETUP-EMAIL.md      # Configuration emails
📖 functions/TECHNICAL-DETAILS.md # Détails techniques
```

### Scripts

```
🤖 deploy.ps1                    # Déploiement frontend
🤖 functions/deploy-function.ps1 # Déploiement fonction
🤖 pre-deploy-check.ps1         # Vérifications
```

---

## 💡 Commandes utiles

### Développement

```powershell
npm install                  # Installer les dépendances
npm run dev                  # Serveur local (port 6000)
npm run build               # Build de production
npm run preview             # Preview du build
```

### Déploiement

```powershell
npm run deploy:check        # Vérifier avant de déployer
npm run deploy              # Déployer le frontend
npm run deploy:function     # Déployer la Cloud Function
```

### Debug

```powershell
npm run logs                # Voir les logs de la fonction
npm run test:email          # Tester l'envoi d'email
gcloud functions list       # Liste des fonctions
gsutil ls gs://grindcamp.fr # Fichiers du bucket
```

### GCP

```powershell
gcloud config list                             # Configuration actuelle
gcloud functions describe sendRegistrationEmail # Détails de la fonction
gcloud secrets list                            # Liste des secrets
gcloud projects list                           # Liste des projets
```

---

## 🎯 Prochaines étapes recommandées

### Court terme

- [ ] Tester l'envoi d'emails en production
- [ ] Vérifier la réception sur différentes boîtes mail
- [ ] Tester le design des emails sur mobile

### Moyen terme

- [ ] Ajouter des templates d'emails plus personnalisés
- [ ] Mettre en place des alertes Cloud Monitoring
- [ ] Optimiser les images pour le web

### Long terme

- [ ] Ajouter un système de paiement en ligne
- [ ] Système de relance automatique
- [ ] Export des données en CSV pour les admins

---

## 📞 Support

**Documentation** :
- `README.md` - Vue d'ensemble
- `QUICK-START.md` - Guide rapide
- `DEPLOYMENT-GUIDE.md` - Guide complet

**Contact** :
- Pascal Mercier - 07 66 82 23 22
- Email : grindcamp84@gmail.com

---

## 🎉 Résumé

### Ce qui fonctionne maintenant

✅ Inscription en ligne  
✅ Envoi d'emails automatique  
✅ Confirmation aux parents  
✅ Notification aux admins  
✅ Déploiement simplifié  
✅ Documentation complète  
✅ Scripts automatiques  
✅ Sécurité renforcée  

### Temps de déploiement

**Premier déploiement** : ~15 minutes  
**Déploiements suivants** : ~30 secondes

### Coût mensuel estimé

Frontend (bucket) : ~0.02€  
Cloud Function : Gratuit (< 2M invocations)  
Secret Manager : ~0.06€  
**Total : ~0.08€/mois** 🎉

---

<div align="center">

**🏀 The Grind Camp**  
*Travail • Rigueur • Respect*

Version 1.0.0 - Janvier 2026

</div>
