const id = new URLSearchParams(location.search).get("id");

async function init() {
  const article = document.getElementById("article");
  try {
    const res = await fetch("../data/textes.json");
    const textes = await res.json();
    const t = textes[id];
    if (!t) throw new Error(`Texte ${id} introuvable`);

    document.title = `${t.titre} — Portfolio`;

    const h1 = document.createElement("h1");
    h1.textContent = t.titre;
    article.append(h1);

    if (t.meta) {
      const m = document.createElement("p");
      m.className = "meta mono";
      m.textContent = t.meta;
      article.append(m);
    }

    for (const p of t.contenu) {
      const el = document.createElement("p");
      el.textContent = p;
      article.append(el);
    }

    if (t.tags?.length) {
      const tags = document.createElement("div");
      tags.className = "tags mono";
      for (const tag of t.tags) {
        const s = document.createElement("span");
        s.textContent = tag;
        tags.append(s);
      }
      article.append(tags);
    }
  } catch (err) {
    article.textContent =
      "Impossible de charger le texte — lancez un serveur local (python -m http.server 8000).";
    console.error(err);
  }
}
init();
