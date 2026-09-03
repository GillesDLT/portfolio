/* =================================================================
   tree.js — charge les JSON de data/ et construit l'arbre dépliable
================================================================= */

const THEMES = ["parcours-academique", "experience", "association", "projets"];

/* Charge les 4 fichiers JSON en parallèle */
export async function chargerDonnees(dossier = "data/") {
  const promesses = THEMES.map(async theme => {
    const reponse = await fetch(`${dossier}${theme}.json`);
    if (!reponse.ok) throw new Error(`Fichier introuvable : data/${theme}.json`);
    return reponse.json();
  });
  return Promise.all(promesses);
}

/* Construit l'arbre complet ; auClic(item, feuille) est appelé sur une feuille */
export function construireArbre(conteneur, themes, auClic) {
  themes.forEach((theme, i) => {
    conteneur.appendChild(creerNoeud(theme, auClic, i === 0));  // 1re branche ouverte
  });
}

/* Crée un nœud (branche si "items", sinon feuille cliquable) — récursif */
function creerNoeud(item, auClic, ouverte = false) {
  const li = document.createElement("li");
  const aDesEnfants = Array.isArray(item.items) && item.items.length > 0;

  if (aDesEnfants) {
    /* ----- branche dépliable ----- */
    li.className = "branch" + (ouverte ? " open" : "");

    const node = document.createElement("span");
    node.className = "node";
    node.innerHTML = `<span class="toggle">${ouverte ? "−" : "+"}</span>` +
                     `<span class="icon">${item.icone ?? "📁"}</span>${item.titre}`;

    node.addEventListener("click", () => {
      li.classList.toggle("open");
      node.querySelector(".toggle").textContent =
        li.classList.contains("open") ? "−" : "+";
    });

    const ul = document.createElement("ul");
    item.items.forEach(enfant => ul.appendChild(creerNoeud(enfant, auClic)));

    li.append(node, ul);

  } else {
    /* ----- feuille ----- */
    const leaf = document.createElement("span");
    leaf.className = "leaf";
    leaf.dataset.id = item.id ?? "";
    leaf.innerHTML = `<span class="icon">${item.icone ?? "📄"}</span>${item.titre}`;
    leaf.addEventListener("click", () => auClic(item, leaf));
    li.appendChild(leaf);
  }

  return li;
}
