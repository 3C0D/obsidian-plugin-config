### 🟡 INCOHÉRENCE — Flags CLI inversés dans la doc

[INTERACTIVE_INJECTION.md:42-53](file:///c:/Users/dd200/Documents/Mes_projets/Mes%20repo%20obsidian%20new/obsidian-plugin-config/docs/INTERACTIVE_INJECTION.md#L42-L53)

Le tableau indique `--no, -n` pour la CLI globale comme « auto-confirme tous les remplacements ». C'est correct dans le code (`bin/obsidian-inject.js` L100 : `--no` / `-n`). Mais le nommage est contre-intuitif : `--no` signifie « pas de confirmation » (= auto-confirme tout), ce qui peut prêter à confusion car `--no` semble dire « non ».

---

### 🟡 Améliorations possibles (non-bloquantes)

| # | Suggestion | Impact |
|---|-----------|--------|
| 1 | Unifier les flags `--yes`/`--no` entre CLI globale et scripts locaux | UX |
| 3 | Nettoyer les numéros de lignes obsolètes dans `docs/SCSS-FLOW.md` | Doc maintenance |
