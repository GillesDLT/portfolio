const id = new URLSearchParams(location.search).get("id");

async function init() {
  try {
    const res = await fetch("../data/textes.json");
    const data = await res.json();
    const t = data[String(id)];
    if (!t) throw new Error(`Texte ${id} introuvable`);
    document.title = t.titre;
    document.getElementById("tTitre").textContent = t.titre;
    document.getElementById("tMeta").textContent = t.meta || "";
    const cont = document.getElementById("tContenu");
    for (const par of t.contenu || []) {
      const p = document.createElement("p");
      p.textContent = par;
      cont.append(p);
    }
    const tags = document.getElementById("tTags");
    for (const tag of t.tags || []) {
      const sp = document.createElement("span");
      sp.textContent = tag;
      tags.append(sp);
    }
  } catch (err) {
    document.getElementById("tTitre").textContent = "Impossible de charger ce texte";
    console.error(err);
  }
}
init();
