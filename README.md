# Sunu-Idées (SPA) — Simplon | vercel + Supabase + OpenRouter

## Présentation
Sunu-Idées est une **Single Page Application (SPA)** qui permet de proposer, catégoriser et gérer des idées pour améliorer la vie du campus.

- Catégorisation automatique via **OpenRouter** (appel **uniquement** côté serveur)
- Persistance dans **Supabase** (CRUD complet)
- Interface réactive sans rechargement de page

## Fonctionnalités
-  Validation formulaire (titre: 5-20 caractères, description: 30-255 caractères)
- Sanitization anti-XSS (on traite uniquement du texte)
- Catégorisation IA automatique via `POST /api/categorize`
-  Fallback obligatoire sur erreur/timeout/taux limités : **"Amélioration technique"**
- CRUD Supabase :
  - Create (insert)
  - Read (Realtime sync + select au chargement)
  - Update (édition sans rechargement)
  - Delete (suppression sans rechargement)
-  UX : bouton désactivé + spinner et texte **"Analyse IA en cours..."**
- Notifications toast (succès / erreurs)

## Architecture
```
/
├── api
│   └── categorize.js
│
 
├── index.html
├── style.css
├──app.js
└── README.md
```



## Variables d’environnement
Créer un fichier **.env.local** à la racine (non commité) :

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# OpenRouter (server-side uniquement)
OPENROUTER_API_KEY=
```

## Déploiement Vercel
- Déployer uniquement sur **Vercel**
- Le front sert l’`index.html`
- Les routes API servent depuis `api/`

vercel
```

## Technologies utilisées
- JavaScript Vanilla 
- Vercel Serverless Functions
- OpenRouter (appel côté serveur)
