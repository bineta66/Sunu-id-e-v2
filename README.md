# Sunu-Idées (SPA) — Simplon | Vercel + Supabase + OpenRouter

## Présentation
Sunu-Idées est une **Single Page Application (SPA)** qui permet de proposer, catégoriser et gérer des idées pour améliorer la vie du campus.

- Catégorisation automatique via **OpenRouter** (appel **uniquement** côté serveur)
- Persistance dans **Supabase** (CRUD complet)
- Interface réactive sans rechargement de page

## Fonctionnalités
- ✅ Validation formulaire (titre: min 5 caractères, description: min 10 caractères)
- ✅ Sanitization anti-XSS (on traite uniquement du texte)
- ✅ Catégorisation IA automatique via `POST /api/categorize`
- ✅ Fallback obligatoire sur erreur/timeout/taux limités : **"Amélioration technique"**
- ✅ CRUD Supabase :
  - Create (insert)
  - Read (select au chargement)
  - Update (édition sans rechargement)
  - Delete (suppression sans rechargement)
- ✅ UX : bouton désactivé + spinner et texte **"Analyse IA en cours..."**
- ✅ Notifications toast (succès / erreurs)

## Architecture
```
/
├── api
│   └── categorize.js
│
├── src
│   └── js
│       ├── main.js
│       ├── config
│       │   └── supabase.js
│       ├── services
│       │   ├── ai.service.js
│       │   └── ideas.service.js
│       ├── ui
│       │   ├── render.js
│       │   ├── loading.js
│       │   └── notifications.js
│       ├── utils
│       │   ├── validator.js
│       │   ├── sanitizer.js
│       │   ├── categories.js
│       │   └── aiFallback.js
│       └── events
│           └── formEvents.js
├── index.html
├── style.css
├── vercel.json
├── package.json
└── README.md
```

## Installation (local)
> Pour tester localement, il faut créer les variables d’environnement dans un fichier `.env.local`.

```bash
npm install
npm run dev
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
- **Aucune dépendance node-fetch** n’est requise : le handler utilise `fetch` natif (runtime Vercel)

```bash
vercel
```

## Technologies utilisées
- JavaScript Vanilla + ES Modules
- Vercel Serverless Functions
- OpenRouter (appel côté serveur)


