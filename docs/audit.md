# Audit — obsidian-plugin-config

Audit mis à jour du repo d'injection de configuration pour plugins Obsidian.

---

## 1. Bugs & problèmes fonctionnels restants ou nouveaux

### 🔴 BUG — Erreurs de compilation TypeScript dans les templates & conflits d'IDE

Le fait d'avoir un fichier `package.json` et `tsconfig.json` directement sous `templates/` perturbe les IDE et cause des erreurs de types car `node_modules` n'y est plus présent.
De plus, la racine du projet (`tsconfig.json` de la racine) inclut `templates/**/*.ts` mais son `package.json` ne contient pas les dépendances de développement utilisées par les templates (`dotenv`, `builtin-modules`, `esbuild`, `obsidian`, `obsidian-typings`, `tslib`). Cela produit des erreurs `Cannot find module 'dotenv'` lors de l'exécution de `tsc` à la racine.

**Actions recommandées :**
1. Renommer `templates/package.json` en `templates/package.json.template`.
2. Renommer `templates/tsconfig.json` en `templates/tsconfig.json.template`.
3. Installer les dépendances requises par les templates en tant que `devDependencies` dans le `package.json` racine pour que le compilateur TS de la racine résolve correctement les types sans nécessiter de dossier `node_modules` dans `templates/`.
4. Mettre à jour le code d'injection dans [inject-core.ts](file:///c:/Users/dd200/Documents/Mes_projets/Mes%20repo%20obsidian%20new/obsidian-plugin-config/scripts/inject-core.ts) pour copier à partir des fichiers `.template` et les restaurer sans suffixe dans la cible.
5. Mettre à jour la documentation et les scripts d'aide pour mentionner les nouveaux noms de templates.

---

## 2. Incohérences & améliorations de code restantes

### 🟡 INCOHÉRENCE — Flags CLI inversés dans la doc

[INTERACTIVE_INJECTION.md:42-53](file:///c:/Users/dd200/Documents/Mes_projets/Mes%20repo%20obsidian%20new/obsidian-plugin-config/docs/INTERACTIVE_INJECTION.md#L42-L53)

Le tableau indique `--no, -n` pour la CLI globale comme « auto-confirme tous les remplacements ». C'est correct dans le code (`bin/obsidian-inject.js` L100 : `--no` / `-n`). Mais le nommage est contre-intuitif : `--no` signifie « pas de confirmation » (= auto-confirme tout), ce qui peut prêter à confusion car `--no` semble dire « non ».

---

### 🟡 Améliorations possibles (non-bloquantes)

| # | Suggestion | Impact |
|---|-----------|--------|
| 1 | Unifier les flags `--yes`/`--no` entre CLI globale et scripts locaux | UX |
| 2 | Remplacer le mix fs sync/async dans `inject-core.ts` par une approche uniforme | Propreté |
| 3 | Nettoyer les numéros de lignes obsolètes dans `docs/SCSS-FLOW.md` | Doc maintenance |
