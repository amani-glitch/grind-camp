# Security Audit Tool

Outil complet de vérification de sécurité avant mise en production. Analyse votre projet pour détecter les vulnérabilités courantes, les secrets exposés, les mauvaises configurations et les problèmes de sécurité.

## Fonctionnalités

- **Détection de secrets** : API keys, mots de passe, tokens, clés privées
- **Audit des dépendances** : Vulnérabilités npm connues
- **Patterns de code dangereux** : XSS, injection SQL, eval(), etc.
- **Sécurité d'authentification** : Hachage faible, stockage de tokens
- **Configuration** : CORS, HTTPS, debug mode
- **Fichiers sensibles** : Clés, certificats, bases de données
- **Headers de sécurité** : CSP, HSTS, X-Frame-Options
- **Validation des entrées** : Bibliothèques et patterns
- **Rate limiting** : Protection contre les abus
- **Gestion des erreurs** : Exposition de stack traces

## Installation

```bash
# Cloner ou copier le dossier security-audit dans votre projet
cp -r security-audit /path/to/your/project/

# Rendre le script exécutable
chmod +x security-audit/security-audit.sh
```

## Utilisation

### Usage basique

```bash
# Auditer le répertoire courant
./security-audit/security-audit.sh

# Auditer un projet spécifique
./security-audit/security-audit.sh -p /path/to/project

# Mode verbose
./security-audit/security-audit.sh -v
```

### Options

| Option | Description | Défaut |
|--------|-------------|--------|
| `-p, --path` | Chemin du projet à analyser | `.` (répertoire courant) |
| `-o, --output` | Répertoire de sortie des rapports | `./security-report` |
| `-f, --format` | Format: `html`, `md`, `json`, `all` | `all` |
| `-v, --verbose` | Affichage détaillé | `false` |
| `-h, --help` | Affiche l'aide | - |

### Exemples

```bash
# Générer uniquement le rapport HTML
./security-audit.sh -f html

# Audit complet avec sortie personnalisée
./security-audit.sh -p ./mon-projet -o ./rapports -f all -v

# Pour CI/CD (format JSON)
./security-audit.sh -f json -o ./reports
```

## Rapports générés

L'outil génère trois types de rapports :

### 1. Rapport HTML (`security-report.html`)
- Interface visuelle interactive
- Codes couleur par sévérité
- Checklist pré-production
- Idéal pour les revues d'équipe

### 2. Rapport Markdown (`security-report.md`)
- Format texte structuré
- Compatible GitHub/GitLab
- Idéal pour la documentation

### 3. Rapport JSON (`security-report.json`)
- Format machine-readable
- Intégration CI/CD
- Parsing automatisé

## Niveaux de sévérité

| Niveau | Description | Action requise |
|--------|-------------|----------------|
| **CRITICAL** | Vulnérabilité critique | ⛔ Bloquer le déploiement |
| **HIGH** | Risque élevé | ⚠️ Corriger avant production |
| **MEDIUM** | Risque modéré | 📋 Planifier correction |
| **LOW** | Risque faible | 📝 Amélioration suggérée |
| **INFO** | Information | ℹ️ À considérer |

## Codes de sortie

| Code | Signification |
|------|---------------|
| `0` | Aucun problème critique ou élevé |
| `1` | Problèmes de sévérité HIGH détectés |
| `2` | Problèmes CRITICAL détectés |

## Intégration CI/CD

### GitHub Actions

```yaml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run Security Audit
        run: |
          chmod +x ./security-audit/security-audit.sh
          ./security-audit/security-audit.sh -f json -o ./security-report

      - name: Upload Security Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: security-report
          path: ./security-report/

      - name: Check for Critical Issues
        run: |
          if [ -f ./security-report/security-report.json ]; then
            CRITICAL=$(cat ./security-report/security-report.json | jq '.summary.critical')
            if [ "$CRITICAL" -gt 0 ]; then
              echo "::error::Critical security issues found!"
              exit 1
            fi
          fi
```

### GitLab CI

```yaml
security-audit:
  stage: test
  image: node:20
  script:
    - npm ci
    - chmod +x ./security-audit/security-audit.sh
    - ./security-audit/security-audit.sh -f json -o ./security-report
  artifacts:
    when: always
    paths:
      - security-report/
    expire_in: 1 week
  allow_failure: false
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running security audit..."
./security-audit/security-audit.sh -f json -o /tmp/security-check

CRITICAL=$(cat /tmp/security-check/security-report.json | jq '.summary.critical')
HIGH=$(cat /tmp/security-check/security-report.json | jq '.summary.high')

if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
    echo "❌ Security issues detected! Please fix before committing."
    cat /tmp/security-check/security-report.json | jq '.findings[] | select(.severity == "CRITICAL" or .severity == "HIGH")'
    exit 1
fi

echo "✅ Security check passed"
exit 0
```

## Configuration

Le fichier `config.json` permet de personnaliser l'audit :

```json
{
  "scan_options": {
    "check_secrets": true,
    "check_dependencies": true,
    "check_dangerous_patterns": true
  },
  "exclude_paths": [
    "node_modules",
    "dist",
    "test"
  ],
  "severity_thresholds": {
    "fail_on_critical": true,
    "fail_on_high": true,
    "fail_on_medium": false
  }
}
```

## Patterns personnalisés

### Ajouter des patterns de secrets

Éditez `patterns/secrets.txt` :

```text
# Mon API personnalisée
MY_CUSTOM_API_KEY\s*=\s*['"][a-zA-Z0-9]{32}['"]
```

### Ajouter des patterns de code dangereux

Éditez `patterns/dangerous-code.txt` :

```text
# Format: SEVERITY|CATEGORY|PATTERN|DESCRIPTION
HIGH|CUSTOM|myDangerousFunction\s*\(|Custom dangerous function usage
```

## Checklist pré-production

Avant chaque mise en production, vérifiez :

- [ ] Aucun problème CRITICAL
- [ ] Aucun problème HIGH
- [ ] Variables d'environnement configurées
- [ ] `NODE_ENV=production`
- [ ] HTTPS forcé
- [ ] Headers de sécurité configurés
- [ ] Rate limiting activé
- [ ] Logs et monitoring en place
- [ ] Sauvegardes testées
- [ ] Dépendances à jour

## Limitations

- L'outil effectue une analyse statique (pas d'exécution)
- Les faux positifs sont possibles, vérifiez manuellement
- Ne remplace pas un audit de sécurité professionnel
- Nécessite bash et npm sur le système

## Contribution

Les contributions sont bienvenues ! Pour ajouter de nouveaux patterns ou fonctionnalités :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouveau-check`)
3. Commit (`git commit -m 'Ajout nouveau check'`)
4. Push (`git push origin feature/nouveau-check`)
5. Ouvrir une Pull Request

## Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

---

**Note** : Cet outil est fourni "tel quel" sans garantie. Il est recommandé de le compléter par des audits de sécurité professionnels pour les applications critiques.
