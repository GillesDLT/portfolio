export function buildCube(cubeEl, data, textes) {
  // Un cube = 6 faces : 3 portent les sections, 3 sont fantômes.
  const s = data.sections;
  const plan = [
    { cls: "face--s1", section: s[0] ?? null },  // devant
    { cls: "face--s2", section: s[1] ?? null },  // derrière
    { cls: "face--s3", section: s[2] ?? null },  // dessus
    { cls: "face--s4", section: s[3] ?? null },  // droite
    { cls: "face--s5", section: s[4] ?? null },  // gauche
    { cls: "face--bottom", section: null },
  ];
  for (const { cls, section } of plan) {
    const face = document.createElement("div");
    face.className = `face ${cls}`;
    if (section) {
      const h = document.createElement("h2");
      h.textContent = section.titre;
      const ul = document.createElement("ul");
      for (const id of section.textes) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `pages/texte.html?id=${id}`;
        a.textContent = textes?.[String(id)]?.titre ?? `Texte ${id}`;
        li.append(a);
        ul.append(li);
      }
      face.append(h, ul);
    } else {
      face.classList.add("face--ghost");
    }
    cubeEl.append(face);
  }
}
