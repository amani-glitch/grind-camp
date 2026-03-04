# 🚀 Guide de déploiement RAPIDE

## ⚡ Premier déploiement (à faire UNE SEULE FOIS)

### 1️⃣ Configurer Domain-Wide Delegation (5 minutes)

```
→ https://admin.google.com
→ Sécurité > Contrôles de l'API > Délégation à l'échelle du domaine
→ Ajouter :
   - Client ID: 102906367840296772756
   - Scope: https://www.googleapis.com/auth/gmail.send
→ Autoriser
```

### 2️⃣ Déployer la Cloud Function (2 minutes)

```powershell
cd functions
.\deploy-function.ps1
```

Choisir : `1` (Premier déploiement)  
Puis : `1` (Production)

**IMPORTANT** : Notez l'URL retournée !

### 3️⃣ Mettre à jour l'URL dans le code (30 secondes)

Éditez `services\emailService.ts` ligne 4 :

```typescript
const CLOUD_FUNCTION_URL = 'https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail';
```

✅ **Configuration terminée !**

---

## 🔄 Déploiements suivants (tous les jours)

### Déployer le site

```powershell
.\deploy.ps1
```

C'est tout ! 🎉

Le script fait automatiquement :
- ✓ Build du frontend
- ✓ Upload vers le bucket
- ✓ Configuration du cache

---

## 🧪 Tester en local

```powershell
npm run dev
```

→ Ouvrir http://localhost:6000

---

## 📧 Vérifier les emails envoyés

```powershell
gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 20
```

---

## 🆘 Problèmes fréquents

### ❌ "Delegation denied"

→ Refaire l'étape 1️⃣ (Domain-Wide Delegation)

### ❌ Emails pas reçus

```powershell
# Voir les erreurs
gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 50
```

### ❌ Site pas à jour après déploiement

→ Vider le cache du navigateur : `Ctrl + Shift + R`

### ❌ Erreur lors du build

```powershell
# Réinstaller les dépendances
Remove-Item node_modules -Recurse -Force
npm install
npm run build
```

---

## 📋 Commandes utiles

| Action | Commande |
|--------|----------|
| **Build local** | `npm run build` |
| **Déployer site** | `.\deploy.ps1` |
| **Déployer fonction** | `cd functions; .\deploy-function.ps1` |
| **Dev local** | `npm run dev` |
| **Logs fonction** | `gcloud functions logs read sendRegistrationEmail --region europe-west1` |
| **Lister fichiers bucket** | `gsutil ls gs://grindcamp.fr` |
| **Vider bucket** | `gsutil -m rm -r gs://grindcamp.fr/**` |

---

## 🎯 Workflow recommandé

1. **Développement** :
   ```powershell
   npm run dev
   # Coder... tester sur localhost:6000
   ```

2. **Test** :
   ```powershell
   # Faire une vraie inscription de test
   # Vérifier réception emails
   ```

3. **Déploiement** :
   ```powershell
   .\deploy.ps1
   ```

4. **Vérification** :
   - Ouvrir https://grindcamp.fr
   - Tester inscription
   - Vérifier emails reçus

---

## 🔐 Sécurité - À NE JAMAIS FAIRE

- ❌ Committer `services/*.json` dans Git
- ❌ Partager le service account publiquement
- ❌ Mettre les credentials dans le frontend
- ❌ Oublier de configurer le .gitignore

---

## ✅ Checklist avant mise en production

- [ ] Domain-wide delegation configurée
- [ ] Cloud Function déployée
- [ ] URL de la fonction mise à jour dans `emailService.ts`
- [ ] Test d'inscription en local
- [ ] Emails reçus (parent + admin)
- [ ] Build sans erreurs
- [ ] Test sur le site de production

---

## 📞 Aide

**Documentation complète** : `DEPLOYMENT-GUIDE.md`  
**Configuration email** : `functions/SETUP-EMAIL.md`  
**Support** : Pascal Mercier - 07 66 82 23 22

---

## 🎉 C'est tout !

Le déploiement est maintenant simple :

```powershell
# Développer en local
npm run dev

# Quand c'est prêt
.\deploy.ps1
```

**Temps total** : ~30 secondes ⚡
