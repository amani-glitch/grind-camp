# 📧 Comment fonctionne l'envoi d'emails

## 🏗️ Architecture technique

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)                       │
│                   localhost:6000 ou grindcamp.fr                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP POST /api/register
                             │ { parent, child, health }
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              CLOUD FUNCTION: sendRegistrationEmail              │
│            (europe-west1-adp-413110.cloudfunctions.net)         │
│                                                                  │
│  1. Valide les données                                          │
│  2. Récupère le Service Account depuis Secret Manager          │
│  3. Utilise Domain-Wide Delegation                             │
│  4. Génère les emails HTML                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Gmail API
                             │ (impersonate amani.bestoftours.co.uk)
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                         GMAIL API                                │
│                                                                  │
│  Envoie 2 emails :                                              │
│  • Admin → grindcamp84@gmail.com (notification)                │
│  • Parent → email fourni (confirmation)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Sécurité : Domain-Wide Delegation

### Qu'est-ce que c'est ?

La **Domain-Wide Delegation** permet à un service account de "se faire passer" pour un utilisateur d'un domaine Google Workspace.

### Pourquoi ?

- Le service account n'a pas de boîte email
- Gmail API nécessite un utilisateur pour envoyer des emails
- Solution : le service account "emprunte" l'identité de `amani.bestoftours.co.uk`

### Comment ça marche ?

```
Service Account (python-automation@adp-413110.iam.gserviceaccount.com)
          ↓ (avec delegation)
Impersonate (amani.bestoftours.co.uk)
          ↓
Gmail API envoie l'email depuis amani.bestoftours.co.uk
```

### Configuration technique

**Dans Google Workspace Admin Console** :
- **Client ID** : `102906367840296772756`  
  (trouvé dans le service account JSON)
- **Scope** : `https://www.googleapis.com/auth/gmail.send`  
  (permission d'envoyer des emails)

**Dans le code** (`functions/index.js`) :

```javascript
const auth = new google.auth.JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ['https://www.googleapis.com/auth/gmail.send'],
  subject: 'amani.bestoftours.co.uk', // ← Impersonation
});
```

---

## 📦 Secret Manager : Pourquoi ?

### Problème

Le service account contient une **clé privée** :
```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBA..."
}
```

Si elle est exposée → n'importe qui peut envoyer des emails !

### Solution : Secret Manager

1. **Stockage sécurisé** : La clé est dans GCP Secret Manager
2. **Accès contrôlé** : Seule la Cloud Function peut y accéder
3. **Jamais dans le code** : Le frontend ne voit jamais cette clé
4. **Rotation facile** : On peut changer la clé sans redéployer le code

### Comment c'est configuré ?

```powershell
# 1. Créer le secret
gcloud secrets create SERVICE_ACCOUNT_JSON --data-file="service-account.json"

# 2. Donner l'accès à Cloud Functions
gcloud secrets add-iam-policy-binding SERVICE_ACCOUNT_JSON \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 3. La fonction lit le secret
gcloud functions deploy sendRegistrationEmail \
  --set-secrets GOOGLE_SERVICE_ACCOUNT=SERVICE_ACCOUNT_JSON:latest
```

---

## 🔄 Flux complet d'une inscription

### 1. Utilisateur remplit le formulaire

**Frontend** (`pages/Register.tsx`) :
```typescript
const handleSubmit = async () => {
  // Validation locale
  if (!consents.rules || !consents.rgpd) {
    alert("Veuillez accepter...");
    return;
  }

  // Enregistrement dans Firestore
  const registration = await storageService.addRegistration({
    parent, child, health, consents
  });

  // Appel Cloud Function (async, non bloquant)
  emailService.sendRegistrationEmails(emailData);
};
```

### 2. Appel à la Cloud Function

**Frontend** (`services/emailService.ts`) :
```typescript
const CLOUD_FUNCTION_URL = 'https://europe-west1-adp-413110.cloudfunctions.net/sendRegistrationEmail';

export const emailService = {
  sendRegistrationEmails: async (registration) => {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration),
    });
    return response.json();
  }
};
```

### 3. Cloud Function reçoit la requête

**Backend** (`functions/index.js`) :
```javascript
functions.http('sendRegistrationEmail', async (req, res) => {
  // 1. Vérification CORS
  const origin = req.headers.origin;
  if (!ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  // 2. Rate limiting (5 requêtes/minute max)
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // 3. Validation des données
  const validation = validateRegistration(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  // 4. Récupération du service account
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

  // 5. Création de l'authentification avec delegation
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: 'amani.bestoftours.co.uk', // Impersonation
  });

  // 6. Envoi des emails
  await sendWithGmailAPI(gmail, adminEmail, 'Nouvelle inscription', adminHtml);
  await sendWithGmailAPI(gmail, parentEmail, 'Confirmation', parentHtml);

  return res.status(200).json({ success: true });
});
```

### 4. Gmail API envoie les emails

**Fonction d'envoi** :
```javascript
async function sendWithGmailAPI(gmail, to, subject, htmlContent) {
  // Encodage RFC 2822
  const messageParts = [
    `From: The Grind Camp <amani.bestoftours.co.uk>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlContent,
  ];
  
  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Envoi via Gmail API
  await gmail.users.messages.send({
    userId: 'me', // 'me' = amani.bestoftours.co.uk (via delegation)
    requestBody: { raw: encodedMessage },
  });
}
```

---

## 🛡️ Sécurité : Ce qui est protégé

### ✅ Ce qui est sécurisé

1. **Service Account** : Stocké dans Secret Manager, jamais exposé
2. **Private Key** : Jamais dans le code source, jamais dans Git
3. **Rate Limiting** : 5 requêtes/minute max par IP
4. **CORS** : Seuls les domaines autorisés peuvent appeler
5. **Validation** : Toutes les données sont validées et sanitizées
6. **XSS Protection** : HTML escapé dans les emails

### ❌ Ce qui pourrait être amélioré

1. **Authentication** : Actuellement la Cloud Function est publique
   - Solution : Ajouter un token partagé entre frontend et fonction
   
2. **Firewall** : Pas de restriction d'IP
   - Solution : Configurer Cloud Armor
   
3. **Monitoring** : Pas d'alertes automatiques
   - Solution : Configurer Cloud Monitoring avec alertes

---

## 📊 Performances et coûts

### Latence typique

```
User submit form → 50ms
Frontend → Cloud Function → 100-200ms
Cloud Function → Gmail API → 500-1000ms
─────────────────────────────────────────
Total : ~1-2 secondes
```

### Coûts mensuels estimés

Pour **100 inscriptions/mois** :

| Service | Quantité | Coût |
|---------|----------|------|
| Cloud Functions | 100 invocations | Gratuit (2M/mois inclus) |
| Secret Manager | 1 secret, 100 accès | 0.06€ |
| Cloud Storage (bucket) | 1 GB | 0.02€ |
| Gmail API | 200 emails | Gratuit |
| **TOTAL** | | **~0.08€/mois** |

Pour **1000 inscriptions/mois** : ~0.50€/mois

---

## 🔍 Debug : Comprendre les erreurs

### Erreur : "Failed to send email"

**Logs à consulter** :
```powershell
gcloud functions logs read sendRegistrationEmail --region europe-west1 --limit 50
```

**Causes possibles** :
1. Domain-wide delegation pas configurée
2. Email `amani.bestoftours.co.uk` n'existe pas
3. Quota Gmail API dépassé
4. Service account n'a pas les bonnes permissions

### Erreur : "CORS blocked"

**Symptôme** : Dans la console du navigateur
```
Access to fetch at '...' from origin 'http://localhost:6000' has been blocked by CORS policy
```

**Solution** :
```powershell
# Ajouter l'origine dans la fonction
gcloud functions deploy sendRegistrationEmail \
  --set-env-vars "ALLOWED_ORIGINS=https://grindcamp.fr,http://localhost:6000"
```

### Erreur : "Invalid credentials"

**Cause** : Le secret n'est pas bien configuré

**Vérification** :
```powershell
# 1. Vérifier que le secret existe
gcloud secrets describe SERVICE_ACCOUNT_JSON

# 2. Vérifier les permissions
gcloud secrets get-iam-policy SERVICE_ACCOUNT_JSON

# 3. Re-créer le secret si nécessaire
gcloud secrets versions add SERVICE_ACCOUNT_JSON --data-file="service-account.json"
```

---

## 🚀 Optimisations possibles

### 1. Cache des emails envoyés

Éviter de renvoyer le même email plusieurs fois :

```javascript
const emailCache = new Map();

async function sendEmail(to, subject, html) {
  const key = `${to}-${Date.now()}`;
  if (emailCache.has(key)) {
    return { success: true, cached: true };
  }
  
  await sendWithGmailAPI(...);
  emailCache.set(key, true);
  setTimeout(() => emailCache.delete(key), 300000); // 5 min
}
```

### 2. Emails asynchrones (queue)

Pour gérer beaucoup d'inscriptions simultanées :

```javascript
// Utiliser Cloud Tasks au lieu d'envoyer directement
const task = {
  httpRequest: {
    httpMethod: 'POST',
    url: 'https://.../sendEmail',
    body: Buffer.from(JSON.stringify(emailData)).toString('base64'),
  },
};

await cloudTasks.createTask({ parent: queuePath, task });
```

### 3. Templates d'emails dans Cloud Storage

Séparer le HTML du code :

```javascript
// Charger le template depuis un bucket
const template = await storage.bucket('email-templates').file('registration.html').download();
const html = template.toString().replace('{{firstName}}', parent.firstName);
```

---

## 📚 Ressources techniques

- [Gmail API Reference](https://developers.google.com/gmail/api/reference/rest)
- [Domain-Wide Delegation Guide](https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority)
- [Cloud Functions Best Practices](https://cloud.google.com/functions/docs/bestpractices/tips)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

---

**Développé pour The Grind Camp**  
**Architecture** : Serverless + Domain-Wide Delegation  
**Sécurité** : ⭐⭐⭐⭐⭐
