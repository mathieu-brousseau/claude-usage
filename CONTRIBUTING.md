# Contribuer à Claude Usage

Merci de ton intérêt ! Les contributions se font **via des Pull Requests depuis ton
propre fork** — personne n'a besoin d'un accès en écriture au dépôt.

## Workflow

1. **Fork** le dépôt (bouton *Fork* en haut à droite sur GitHub).
2. **Clone** ton fork :
   ```bash
   git clone https://github.com/<ton-compte>/claude-usage.git
   cd claude-usage
   ```
3. Crée une **branche** dédiée :
   ```bash
   git checkout -b fix/mon-correctif
   ```
4. Fais tes modifications, teste-les (voir ci-dessous), puis commit :
   ```bash
   git commit -m "Décris clairement le changement"
   ```
5. **Push** sur ton fork et ouvre une **Pull Request** vers `main` de ce dépôt.

Garde de préférence tes commits ajoutés `upstream` à jour :
```bash
git remote add upstream https://github.com/mathieu-brousseau/claude-usage.git
git fetch upstream
git rebase upstream/main
```

## Tester tes changements

Il n'y a **aucune étape de build** — c'est du JavaScript vanilla (Manifest V3).

1. Ouvre `chrome://extensions`
2. Active le **Mode développeur**
3. **Charger l'extension non empaquetée** → sélectionne le dossier du dépôt
4. Après chaque modification, clique sur ↻ sur la carte de l'extension pour la recharger
5. Débogue via *Inspecter les vues : service worker / popup*

Vérifie que le popup, le dashboard et le badge fonctionnent, et teste si possible un
compte **multi-organisation**.

## Bonnes pratiques pour une PR

- **Une PR = un sujet.** Les petites PR ciblées sont revues plus vite.
- Respecte le style existant (JS vanilla, pas de dépendance de build, pas de framework).
- Mets à jour le `README.md` si tu changes un comportement visible.
- L'endpoint `GET /api/organizations/{orgId}/usage` n'est **pas documenté** par Anthropic :
  s'il change, décris la nouvelle structure de réponse dans ta PR.
- Sois clair dans la description : *quoi*, *pourquoi*, et *comment tester*.

## Signaler un bug ou proposer une idée

Ouvre une **issue** avec les modèles fournis avant de te lancer sur une grosse PR, pour
qu'on valide l'approche ensemble.

Toute contribution est publiée sous la licence [MIT](LICENSE) du projet.
