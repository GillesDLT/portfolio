/* tree.js — Arbre de conception façon CATIA (Feature Manager) */

function makeRow({ label, phase = null, icon = "◦", expandable = false }) {
  const row = document.createElement("div");
  row.className = "tree__row";
  if (phase != null) row.dataset.phase = String(phase);

  const caret = document.createElement("button");
  caret.type = "button";
  caret.className = "tree__caret" + (expandable ? "" : " is-leaf");
  if (expandable) caret.setAttribute("aria-expanded", "true");

  const ic = document.createElement("span");
  ic.className = "tree__icon";
  ic.textContent = icon;

  const a = document.createElement("a");
  a.href = "#";
  a.textContent = label;

  row.append(caret, ic, a);
  return { row, caret, a };
}

function nodeLi({ label, icon, phase, expandable, onActivate }) {
  const li = document.createElement("li");
  li.classList.add("is-open");
  const { row, caret, a } = makeRow({ label, icon, phase, expandable });

  function toggle() {
    li.classList.toggle("is-open");
    caret.setAttribute("aria-expanded", String(li.classList.contains("is-open")));
  }

  a.addEventListener("click", (e) => {
    e.preventDefault();
    if (onActivate) onActivate();
    else if (expandable) toggle();
  });

  if (expandable) {
    caret.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
    row.addEventListener("dblclick", toggle);   // comme CATIA
  }

  li.append(row);
  return { li, toggle };
}

function sectionLi(s, phase, textes, onSection) {
  const sousSections = s.sections || [];
  const fiches = s.inline ? [] : (s.textes || []);
  const items  = s.inline ? (s.items || []) : [];
  const hasKids = sousSections.length + fiches.length + items.length > 0;

  const node = nodeLi({
    label: s.titre, icon: "▣", phase, expandable: hasKids,
    onActivate: () => onSection(phase),
  });
  if (!hasKids) return node.li;

  const sub = document.createElement("ul");
  sousSections.forEach((ss) => sub.append(sectionLi(ss, null, textes, onSection)));
  for (const id of fiches) {
    const f = nodeLi({ label: textes?.[String(id)]?.titre ?? `Texte ${id}`,
                       icon: "◦", expandable: false });
    f.li.querySelector("a").href = `#fiche=${id}`;   // garde l'ouverture des fiches
    sub.append(f.li);
  }
  for (const item of items) {
    const p = nodeLi({ label: item, icon: "◦", expandable: false });
    p.li.querySelector(".tree__row").classList.add("tree__row--plain");
    sub.append(p.li);
  }
  node.li.append(sub);
  return node.li;
}

export function buildTree(treeEl, data, textes, onSection) {
  treeEl.innerHTML = "";

  /* Racine = le "Produit" ; les sections pendillent dessous (arbre CATIA) */
  const root = nodeLi({
    label: data.home?.titre ?? "Home", icon: "⌂", phase: 0,
    expandable: true, onActivate: () => onSection(0),
  });
  root.li.querySelector(".tree__row").classList.add("tree__row--root");

  const ul = document.createElement("ul");
  data.sections.forEach((s, i) => ul.append(sectionLi(s, i + 1, textes, onSection)));
  root.li.append(ul);

  treeEl.append(root.li);
}

export function setActive(phase) {
  document.querySelectorAll("#tree .tree__row").forEach((r) =>
    r.classList.toggle("is-active", r.dataset.phase === String(phase)));
  /* "reveal in tree" : déplie les ancêtres de la section active */
  document.querySelectorAll("#tree .tree__row.is-active").forEach((r) => {
    for (let p = r.parentElement; p && p.closest("#tree"); p = p.parentElement)
      if (p.tagName === "LI") p.classList.add("is-open");
  });
}
