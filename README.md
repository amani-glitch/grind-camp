<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🏀 The Grind Camp

Site web officiel du camp de basketball - Pernes-les-Fontaines (84)

**Du 3 au 7 août 2026** | U11 • U13 • U15 • U18

[![Deploy Status](https://img.shields.io/badge/deploy-production-green)]()
[![Port](https://img.shields.io/badge/port-6000-blue)]()
[![Cloud](https://img.shields.io/badge/GCP-Cloud%20Storage-orange)]()

</div>

---

## 🚀 Démarrage rapide

```powershell
# Installation
npm install

# Développement (localhost:6000)
npm run dev

# Déploiement production
npm run deploy
```

**C'est tout !** 🎉

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[QUICK-START.md](QUICK-START.md)** | ⚡ Guide rapide - Commencez ici ! |
| **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)** | 📖 Guide complet de déploiement |
| **[functions/SETUP-EMAIL.md](functions/SETUP-EMAIL.md)** | 📧 Configuration de l'envoi d'emails |
| **[functions/TECHNICAL-DETAILS.md](functions/TECHNICAL-DETAILS.md)** | 🔧 Détails techniques |

---

## ✨ Fonctionnalités

- ✅ Inscription en ligne avec formulaire multi-étapes
- ✅ Gestion de capacité (40 places max)
- ✅ Envoi automatique d'emails (confirmation + notification admin)
- ✅ Espace privé pour consulter son inscription
- ✅ Dashboard admin pour gérer les inscriptions
- ✅ Chatbot avec intelligence artificielle (Gemini)
- ✅ Design responsive et moderne

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Google Cloud Storage (grindcamp.fr)
    ↓
Cloud Function (envoi emails)
    ↓
Gmail API (via service account)
```

**Technologies** :
- React 19 + TypeScript
- Vite 6
- Google Cloud Platform
- Firebase/Firestore
- Gmail API avec Domain-Wide Delegation

---

## 🔧 Configuration

### 1. Variables d'environnement

Copiez `.env.example` vers `.env.local` :

```bash
GEMINI_API_KEY=your_gemini_api_key
VITE_CLOUD_FUNCTION_URL=https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail
```

### 2. Service Account

Le fichier `services/adp-413110-176b452e6fb2.json` contient les credentials.

⚠️ **IMPORTANT** : Ce fichier est dans `.gitignore` et ne doit JAMAIS être committé !

---

## 💻 Développement local

```powershell
# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview
```

Le site sera accessible sur **http://localhost:6000**

---

## 🚀 Déploiement

### Frontend (Bucket)

```powershell
# Méthode 1 : Script automatique
npm run deploy

# Méthode 2 : Script PowerShell
.\deploy.ps1

# Méthode 3 : Manuel
npm run build
gsutil -m cp -r dist/* gs://grindcamp.fr/
```

### Cloud Function (Emails)

```powershell
# Script interactif
npm run deploy:function

# Ou directement
cd functions
.\deploy-function.ps1
```

**Première fois** :
1. Configurer Domain-Wide Delegation (voir [QUICK-START.md](QUICK-START.md))
2. Déployer la fonction
3. Mettre à jour l'URL dans `services/emailService.ts`

---

## 🧪 Tests

### Test de l'envoi d'email

```powershell
# Modifier test-email.json avec votre email
# Puis lancer
npm run test:email
```

### Voir les logs

```powershell
npm run logs
```

---

## 📦 Structure du projet

```
.
├── components/          # Composants React réutilisables
├── contexts/           # Contexts React (Chat)
├── data/              # Configuration et données statiques
├── functions/         # Cloud Functions (envoi emails)
│   ├── index.js       # Code de la fonction
│   ├── deploy-function.ps1  # Script de déploiement
│   └── SETUP-EMAIL.md # Documentation emails
├── pages/             # Pages de l'application
│   ├── Home.tsx
│   ├── Register.tsx
│   ├── PrivateDashboard.tsx
│   └── AdminDashboard.tsx
├── services/          # Services (email, storage, crypto...)
├── public/            # Assets statiques
├── deploy.ps1         # Script de déploiement frontend
└── vite.config.ts     # Configuration Vite
```

---

## 🔐 Sécurité

### Ce qui est protégé

- ✅ Service Account dans Secret Manager
- ✅ Credentials jamais exposés au frontend
- ✅ Rate limiting (5 req/min par IP)
- ✅ CORS configuré
- ✅ Validation et sanitization des données
- ✅ .gitignore configuré

### À NE JAMAIS FAIRE

- ❌ Committer `services/*.json`
- ❌ Exposer les credentials dans le code
- ❌ Désactiver les validations

---

## 📊 Commandes utiles

```powershell
# Développement
npm run dev              # Serveur local (port 6000)
npm run build           # Build de production
npm run preview         # Preview du build

# Déploiement
npm run deploy          # Déployer le frontend
npm run deploy:function # Déployer la Cloud Function

# Debug
npm run logs            # Voir les logs de la fonction
npm run test:email      # Tester l'envoi d'email

# GCP
gcloud config list                           # Config actuelle
gcloud functions list --region europe-west1  # Liste des fonctions
gsutil ls gs://grindcamp.fr                  # Fichiers du bucket
```

---

## 🆘 Support

### Problèmes courants

**Emails non reçus** → Vérifier les logs : `npm run logs`  
**Erreur CORS** → Vérifier ALLOWED_ORIGINS dans la fonction  
**Build échoue** → `rm -r node_modules && npm install`  
**Site pas à jour** → Vider le cache : Ctrl+Shift+R

### Documentation

- [Guide rapide](QUICK-START.md) - Commencer ici
- [Guide complet](DEPLOYMENT-GUIDE.md) - Tout savoir
- [Setup email](functions/SETUP-EMAIL.md) - Configuration emails
- [Détails techniques](functions/TECHNICAL-DETAILS.md) - Sous le capot

### Contact

**Pascal Mercier**  
📞 07 66 82 23 22  
📧 grindcamp84@gmail.com

---

## 📝 Changelog

### Version 1.0.0 (Janvier 2026)

- ✨ Ajout de l'envoi d'emails automatique
- ✨ Service Account avec Domain-Wide Delegation
- ✨ Port changé de 3000 à 6000
- ✨ Scripts de déploiement PowerShell
- ✨ Documentation complète
- 🔒 Sécurité renforcée
- 📝 README et guides

---

## 📄 Licence

Propriété de The Grind Camp © 2026

---

<div align="center">

**Développé avec ❤️ pour The Grind Camp**

🏀 Travail • Rigueur • Respect 🏀

</div>
