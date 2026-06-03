# TODO - Sunu-Idées (migration Cloud Supabase + IA OpenRouter)

## Étape 1 — Supabase (CRUD + READ initial)
- [ ] Installer/initialiser le client Supabase dans `app.js`
- [ ] Remplacer `localStorage` par CRUD Supabase (INSERT/SELECT/UPDATE/DELETE)
- [ ] Mettre à jour le rendu du mur (cartes) depuis Supabase

## Étape 2 — Supabase Realtime (synchronisation en temps réel)
- [ ] Activer un abonnement Realtime sur la table `idees`
- [ ] Rerendre la liste lors des changements (insert/update/delete)

## Étape 3 — IA OpenRouter (catégorisation)
- [ ] Préparer la fonction client `categoriserIdee(titre, description)`
- [ ] Envoyer `titre + description` au modèle OpenRouter (mistralai/mistral-7b-instruct:free ou meta-llama/llama-3-8b-instruct:free)
- [ ] Implémenter un `fallback` strict vers les catégories officielles :
  - Pédagogie
  - Événement
  - Vie de campus
  - Amélioration technique
- [ ] Brancher le formulaire : submit → catégorisation → INSERT Supabase

## Étape 4 — UX
- [ ] Loader + désactivation bouton pendant catégorisation
- [ ] Gestion erreurs réseau (toast)

## Étape 5 — UPDATE & DELETE
- [ ] Bouton Éditer → UPDATE Supabase
- [ ] Bouton Supprimer → DELETE Supabase

## Étape 6 — Déploiement
- [ ] Variables d’environnement (Supabase)
- [ ] Déployer sur Netlify/Vercel
- [ ] Tests en 2 onglets (temps réel)

