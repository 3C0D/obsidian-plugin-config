## 2. Incohérences & améliorations de code restantes

### ✅ APPLIQUÉ — Mix fs sync/async unifié dans `inject-core.ts`

Toutes les opérations `fs` sync ont été remplacées par leur équivalent `fs/promises` :

- `fs.readFileSync` → `await readFile`
- `fs.writeFileSync` → `await writeFile`
- `fs.existsSync` → helper local `pathExists` (basé sur `access`)
- `fs.unlinkSync` → `await unlink`
- `fs.mkdirSync` → `await mkdir`
- `fs.rmSync` → `await rm`
- `fs.renameSync` → `await rename`
- `fs.readdirSync` → `await readdir`

Fonctions converties en `async` (et leurs appelants mis à jour) :

- `findPluginConfigRoot()` → `Promise<string>`
- `copyFromLocal()` → `Promise<string>`
- `readInjectionInfo()` → `Promise<Record<string, string> | null>`

Bonus appliqués :

- Suppression de l'import dynamique inutile dans `showInjectionPlan` et `diffAndPromptFiles` (utilitaires remontés en import statique).
- Déduplication du bloc `git rev-parse` dans `ensurePluginConfigClean` (la branche est lue une seule fois).

Fichier mis à jour : `scripts/inject-core.ts` + `scripts/inject-path.ts`. Vérification `tsc --noEmit` : OK.

---

### 🟡 INCOHÉRENCE — Flags CLI inversés dans la doc

[INTERACTIVE_INJECTION.md:42-53](file:///c:/Users/dd200/Documents/Mes_projets/Mes%20repo%20obsidian%20new/obsidian-plugin-config/docs/INTERACTIVE_INJECTION.md#L42-L53)

Le tableau indique `--no, -n` pour la CLI globale comme « auto-confirme tous les remplacements ». C'est correct dans le code (`bin/obsidian-inject.js` L100 : `--no` / `-n`). Mais le nommage est contre-intuitif : `--no` signifie « pas de confirmation » (= auto-confirme tout), ce qui peut prêter à confusion car `--no` semble dire « non ».

---

### 🟡 Améliorations possibles (non-bloquantes)

| # | Suggestion | Impact |
|---|-----------|--------|
| 1 | Unifier les flags `--yes`/`--no` entre CLI globale et scripts locaux | UX |
| 2 | ~~Remplacer le mix fs sync/async dans `inject-core.ts` par une approche uniforme~~ ✅ APPLIQUÉ | Propreté |
| 3 | Nettoyer les numéros de lignes obsolètes dans `docs/SCSS-FLOW.md` | Doc maintenance |
