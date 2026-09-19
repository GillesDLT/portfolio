/* tree.js — Arbre de conception façon CATIA, habillage "idea-tree" (navy/cyan) */
import { IMPORTANT_FICHES } from "./fta.js";

const SPRITE = `
<svg id="treeSprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
     style="position:absolute;width:0;height:0;overflow:hidden">
  <symbol id="ti-cube" viewBox="0 0 16 16">
    <path d="M8 1.8 14 5.2v5.6L8 14.2 2 10.8V5.2Z"/><path d="M2 5.2 8 8.6l6-3.4M8 8.6v5.6"/>
  </symbol>
  <symbol id="ti-gear" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="2.7"/>
    <path d="M8 1.6v2.3M8 12.1v2.3M14.4 8h-2.3M3.9 8H1.6M12.6 3.4 11 5M5 11l-1.6 1.6M12.6 12.6 11 11M5 5 3.4 3.4"/>
  </symbol>
  <symbol id="ti-cap" viewBox="0 0 16 16">
    <path d="M8 2.6 1.4 6 8 9.4 14.6 6Z"/>
    <path d="M3.9 7.6v3.2c0 1.2 1.9 2.2 4.1 2.2s4.1-1 4.1-2.2V7.6M14.2 6.4v3.8"/>
  </symbol>
  <symbol id="ti-wrench" viewBox="0 0 24 24">
    <path stroke-width="1.7" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </symbol>
  <symbol id="ti-rule" viewBox="0 0 24 24">
    <path stroke-width="1.7" d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.3 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/>
    <path stroke-width="1.7" d="m7.5 10.5 2 2m3-6 2 2m3-6 2 2"/>
  </symbol>
  <symbol id="ti-star" viewBox="0 0 16 16">
    <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6Z"/>
  </symbol>
  <symbol id="ti-box" viewBox="0 0 16 16">
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/>
  </symbol>
</svg>`;

const SEC_ICON = { 1: "ti-gear", 2: "ti-cap", 3: "ti-wrench", 4: "ti-rule", 5: "ti-star" };
const PREFIX_SYM = { exp: "⌖", etu: "∠", aso: "⊥", dip: "Ø", fac: "⏥", diy: "⌭", cmp: "◎", spr: "⌒", otr: "±" };

const ico = (id) => `<svg class="tree__ico" aria-hidden="true"><use href="#${id}"></use></svg>`;
const sym = (pre) => `<i class="tree__sym pre-${PREFIX_SYM[pre] ? pre : "otr"}">${PREFIX_SYM[pre] ?? "•"}</i>`;

/* nb de fiches/items d'une section, sous-sections comprises */
const countFiches = (s) =>
  s.inline ? (s.items?.length ?? 0)
           : (s.textes?.length ?? 0) + (s.sections ?? []).reduce((n, ss) => n + countFiches(ss), 0);

function makeRow({ label, phase = null, iconHtml = "", expandable = false, count = 0 }) {
  const row = document.createElement("div");
  row.className = "tree__row";
  if (phase != null) row.dataset.phase = String(phase);

  const caret = document.createElement("button");
  caret.type = "button";
  caret.className = "tree__caret" + (expandable ? "" : " is-leaf");
  if (expandable) caret.setAttribute("aria-expanded", "true");

  const ic = document.createElement("span");
  ic.className = "tree__icon";
  ic.innerHTML = iconHtml;

  const a = document.createElement("a");
  a.href = "#";
  a.textContent = label;

  row.append(caret, ic, a);
  if (count > 0) {
    const pill = document.createElement("span");
    pill.className = "tree__count";
    pill.textContent = String(count);
    row.append(pill);
  }
  return { row, caret, a };
}

function nodeLi({ label, iconHtml, phase, expandable, onActivate, count = 0 }) {
  const li = document.createElement("li");
  li.classList.add("is-open");
  const { row, caret, a } = makeRow({ label, iconHtml, phase, expandable, count });

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
    label: s.titre,
    iconHtml: ico(SEC_ICON[phase] ?? "ti-box"),
    phase, expandable: hasKids,
    count: countFiches(s),
    onActivate: () => onSection(phase),
  });
  if (!hasKids) return node.li;

  const sub = document.createElement("ul");
  sousSections.forEach((ss) => sub.append(sectionLi(ss, null, textes, onSection)));
  for (const id of fiches) {
    const pre = String(id).split(":")[0];
    const f = nodeLi({ label: textes?.[String(id)]?.titre ?? `Texte ${id}`,
                       iconHtml: sym(pre), expandable: false });
    f.li.querySelector("a").href = `#fiche=${id}`;
    if (IMPORTANT_FICHES.has(String(id)))
      f.li.querySelector(".tree__row").classList.add("tree__row--imp");
    sub.append(f.li);
  }
  for (const item of items) {
    const p = nodeLi({ label: item, iconHtml: sym("otr"), expandable: false });
    p.li.querySelector(".tree__row").classList.add("tree__row--plain");
    sub.append(p.li);
  }
  node.li.append(sub);
  return node.li;
}

export function buildTree(treeEl, data, textes, onSection) {
  if (!document.getElementById("treeSprite")) document.body.insertAdjacentHTML("beforeend", SPRITE);
  treeEl.innerHTML = "";

  const root = nodeLi({
    label: data.home?.titre ?? "Home", iconHtml: ico("ti-cube"), phase: 0,
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
