export function buildTree(treeEl, data, textes, onSection) {
  const root = document.createElement("a");
  root.className = "tree__root";
  root.dataset.phase = "0";
  root.textContent = data.home?.titre ?? "Home";
  root.href = "#";
  root.addEventListener("click", (e) => { e.preventDefault(); onSection(0); });

  const ul = document.createElement("ul");
  data.sections.forEach((s, i) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.dataset.phase = String(i + 1);
    a.textContent = s.titre;
    a.href = "#";
    a.addEventListener("click", (e) => { e.preventDefault(); onSection(i + 1); });
    li.append(a);

    const sub = document.createElement("ul");
    for (const id of s.textes) {
      const li2 = document.createElement("li");
      const a2 = document.createElement("a");
      a2.href = `pages/texte.html?id=${id}`;
      a2.textContent = textes?.[String(id)]?.titre ?? `Texte ${id}`;
      li2.append(a2);
      sub.append(li2);
    }
    li.append(sub);
    ul.append(li);
  });
  treeEl.append(root, ul);
}

export function setActive(phase) {
  document.querySelectorAll("#tree a").forEach((a) =>
    a.classList.toggle("is-active", a.dataset.phase === String(phase))
  );
}
