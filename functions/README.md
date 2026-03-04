# Grind Camp Cloud Functions

## Configuration des Emails

Pour que les emails fonctionnent, vous devez configurer un "App Password" Gmail.

### Etape 1: Creer un App Password Gmail

1. Allez sur https://myaccount.google.com/apppasswords
2. Connectez-vous avec le compte grindcamp84@gmail.com
3. Selectionnez "Mail" et "Autre (nom personnalise)"
4. Entrez "Grind Camp Cloud Function"
5. Copiez le mot de passe genere (16 caracteres)

### Etape 2: Configurer Google Cloud Secret Manager

```bash
# Creer le secret pour le mot de passe Gmail
echo -n "VOTRE_APP_PASSWORD" | gcloud secrets create GMAIL_APP_PASSWORD --data-file=-

# Creer le secret pour les emails admin
echo -n "grindcamp84@gmail.com,yacine@bestoftours.co.uk" | gcloud secrets create ADMIN_EMAILS --data-file=-

# Donner acces au service account de la fonction
gcloud secrets add-iam-policy-binding GMAIL_APP_PASSWORD \
  --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding ADMIN_EMAILS \
  --member="serviceAccount:YOUR_PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Etape 3: Deployer la fonction

```bash
cd functions
npm run deploy
```

## Test local

Pour tester localement:

```bash
export GMAIL_APP_PASSWORD="votre_app_password"
export ADMIN_EMAILS="votre@email.com"
export ALLOWED_ORIGINS="http://localhost:3000"

npm start
```

Puis envoyez une requete POST a http://localhost:8080

## Troubleshooting

### "No email configuration found"
- Verifiez que GMAIL_APP_PASSWORD est configure dans Secret Manager
- Verifiez que le service account a acces au secret

### "Emails non recus"
- Verifiez que l'App Password est correct
- Verifiez les logs: `gcloud functions logs read sendRegistrationEmail`

### "CORS error"
- Verifiez que ALLOWED_ORIGINS inclut votre domaine
