# Écrire une fiche du portfolio

Les informations de navigation (titre, date, section, mots-clés) restent dans `data/textes.json`. Le contenu long d’une fiche peut vivre dans son propre fichier Markdown, dans `data/pages/`.

## Relier un contenu Markdown

Dans l’entrée concernée de `data/textes.json`, indique le chemin de la page et un court résumé pour l’aperçu au survol :

```json
"exp:monExperience": {
  "titre": "Mon expérience",
  "section": 1,
  "meta": "2025 · Bordeaux",
  "page": "data/pages/experiences/monExperience.md",
  "resume": [
    "Une phrase courte pour l’aperçu au survol.",
    "Une deuxième phrase si elle apporte quelque chose."
  ],
  "tags": ["CAO", "Recherche"]
}
```

Le champ `page` doit pointer vers un fichier local sous `data/pages/`. Les fiches qui n’ont pas de champ `page` continuent à utiliser l’ancien format `contenu` / `imgs` : la migration peut se faire progressivement.

## Markdown au quotidien

Le rendu accepte les syntaxes Markdown usuelles :

- `**gras**`, `*italique*` et `~~barré~~` ;
- titres avec `##`, listes `-` / `1.`, citations avec `>` ;
- liens `[texte](https://...)`, images `![description](assets/images/image.jpg)` et blocs de code ;
- HTML éditorial simple, notamment `<figure>` / `<figcaption>`, pour contrôler précisément la taille et l’alignement d’une image.

Exemple d’image centrée de largeur personnalisée :

```html
<figure style="width: min(72%, 720px); margin: 2rem auto">
  <img src="assets/images/mon-schema.png" alt="Description du schéma">
  <figcaption>Une légende utile et accessible.</figcaption>
</figure>
```

Pour une galerie, utiliser un conteneur `<div class="media-grid">` avec plusieurs `<figure>`. La galerie passe en une colonne sur téléphone. Les chemins d’images sont relatifs à la racine du site, comme dans `textes.json`.

Les pages Markdown sont rendues avec Marked, puis nettoyées avec DOMPurify avant affichage : les scripts et attributs dangereux sont retirés. Ces deux bibliothèques sont incluses localement dans `js/vendor/`, donc le rendu Markdown ne dépend pas d’un CDN.
