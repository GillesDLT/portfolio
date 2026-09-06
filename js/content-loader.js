/* =================================================================
   content-loader.js — affiche la fiche d'un élément dans la visionneuse
================================================================= */

const fiche  = document.getElementById("fiche");
const statut = document.getElementById("status-gauche");

export function afficherFiche(item, feuille) {
  /* sélection visuelle dans l'arbre */
  document.querySelectorAll(".leaf.selected").forEach(l => l.classList.remove("selected"));
  feuille?.classList.add("selected");

  const morceaux = [];

  /* sous-titre : lieu + période */
  const lieu = item.etablissement || item.entreprise || item.organisation || "";
  if (lieu || item.periode) {
    morceaux.push(`<p class="sous">${lieu}${lieu && item.periode ? " — " : ""}${item.periode ?? ""}</p>`);
  }
  if (item.description) morceaux.push(`<p>${item.description}</p>`);
  if (item.points?.length) {
    morceaux.push("<ul>" + item.points.map(p => `<li>${p}</li>`).join("") + "</ul>");
  }
  if (item.images?.length) {
    morceaux.push('<div class="galerie">' +
      item.images.map(src => `<img src="${src}" alt="${item.titre}">`).join("") + "</div>");
  }
  if (item.pdf) {
    morceaux.push(`<p style="margin-top:8px"><a href="${item.pdf}" target="_blank">📄 Ouvrir le document (PDF)</a></p>`);
  }

    fiche.innerHTML = `<h2>${item.titre}</h2>` + morceaux.join("");
    installerFermeture();
  fiche.classList.remove("hidden");

  statut.textContent = "Fiche : " + item.titre;
}

/* --- fermeture de la grande fiche (✕ + Échap) --- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fiche.classList.add("hidden");
});

function installerFermeture() {
  const barre = document.createElement("div");
  barre.className = "fiche-barre";
  barre.innerHTML = `<button class="fiche-fermer" aria-label="Fermer la fiche">✕</button>`;
  barre.querySelector(".fiche-fermer").addEventListener("click", () => {
    fiche.classList.add("hidden");
  });
  fiche.prepend(barre);   // ← prepend, pas append : la barre reste en haut
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fiche.classList.add("hidden");
});
