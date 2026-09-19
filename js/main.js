import { initCAD } from "./cube3d.js";
import { buildTree, setActive } from "./tree.js";

const tree = document.getElementById("tree");
const space = document.getElementById("scrollSpace");
const triadSvg = document.getElementById("triadSvg");
const viewLabel = document.getElementById("hudPath");
const viewButtons = document.getElementById("viewButtons");
const sbPhase = document.getElementById("sbPhase");
const sbRot = document.getElementById("sbRot");
const ISO = { rx: -28, ry: -42, zoom: 1 };
let KEYS = [{ p: 0, ...ISO }];
let SECTION_P = [];            // positions "phase" des sections (1, 2, 3, …)

const cadEl = document.getElementById("cad3d");
let ORIENT = [ISO];
let labels = [];
let targetP = 0;
let currentP = 0;

const lerp = (a, b, t) => a + (b - a) * t;
const rad = (d) => (d * Math.PI) / 180;



/* Une vue par section, dans l'ordre de data/sections.json (plus de cycle) */
const DROITE   = { rx: 0,   ry: -90  };  // caméra sur +X
const DEVANT   = { rx: 0,   ry: 0    };  // caméra sur +Z
const DESSUS   = { rx: -90, ry: -180 };  // au-dessus (−180 : chemin de rotation le plus court)
const DERRIERE = { rx: 0,   ry: -180 };  // caméra sur −Z

const VIEWS = [
  DROITE,    // S1 Expériences  → droite
  DEVANT,    // S2 Formations   → face
  DESSUS,    // S3 Projets      → dessus
  DERRIERE,  // S4 Compétences  → arrière
  DERRIERE,  // S5 le Reste     → arrière (partage la vue avec S4)
];

function buildKeys(sections) {
  const keys = [{ p: 0, ...ISO }];
  sections.forEach((s, i) => {
    const view = VIEWS[i % VIEWS.length];
    if (i > 0) keys.push({ p: i + 0.5, ...ISO });   // repasse par l'iso entre chaque vue
    keys.push({ p: i + 1, ...view, zoom: 1 });
  });
  return keys;
}

/* ---- Trièdre façon Blender ---- */
const SVG_NS = "http://www.w3.org/2000/svg";
const AXES = [
  { v: [0, 0, 1],  label: "X", cls: "x" },   // rouge  → droite
  { v: [1, 0, 0],  label: "Y", cls: "y" },   // verte  → profondeur
  { v: [0, -1, 0], label: "Z", cls: "z" },   // bleue  → haut
  { v: [0, 0, -1], label: null, cls: "x" },
  { v: [-1, 0, 0], label: null, cls: "y" },
  { v: [0, 1, 0],  label: null, cls: "z" },
];

function buildTriad(svg) {
  const parts = [];
  for (const ax of AXES) {
    const g = document.createElementNS(SVG_NS, "g");
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("class", `ax-${ax.cls}`);
    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("class", ax.label ? `tip tip--pos ax-${ax.cls}` : `tip tip--neg ax-${ax.cls}`);
    g.append(line, dot);
    let t = null;
    if (ax.label) {
      t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("class", "axlabel");
      t.textContent = ax.label;
      g.append(t);
    }
    svg.append(g);
    parts.push({ ax, line, dot, t });
  }
  const c = document.createElementNS(SVG_NS, "circle");
  c.setAttribute("class", "center");
  c.setAttribute("cx", 50); c.setAttribute("cy", 50); c.setAttribute("r", 2.5);
  svg.append(c);
  return parts;
}

function rotVec(rx, ry, [x, y, z]) {
  const b = rad(ry), a = rad(rx);
  const x1 = x * Math.cos(b) + z * Math.sin(b);
  const z1 = -x * Math.sin(b) + z * Math.cos(b);
  const y2 = y * Math.cos(a) - z1 * Math.sin(a);
  const z2 = y * Math.sin(a) + z1 * Math.cos(a);
  return [x1, y2, z2];
}

function updateTriad(rx, ry) {
  const L = 36, TIP = 1.8;                     // ← billes ×1.8
  const order = [];
  for (const { ax, line, dot, t } of triadParts) {
    const [x, y, z] = rotVec(rx, ry, ax.v);
    const px = 50 + x * L, py = 50 + y * L;
    const depth = (z + 1) / 2;
    line.setAttribute("x1", 50); line.setAttribute("y1", 50);
    line.setAttribute("x2", px.toFixed(1)); line.setAttribute("y2", py.toFixed(1));
    dot.setAttribute("cx", px.toFixed(1)); dot.setAttribute("cy", py.toFixed(1));
    dot.setAttribute("r", ((ax.label ? 6 : 5) * TIP * (0.8 + 0.2 * depth)).toFixed(1));
    if (t) { t.setAttribute("x", px.toFixed(1)); t.setAttribute("y", py.toFixed(1)); }
    line.parentNode.setAttribute("opacity", (0.35 + 0.65 * depth).toFixed(2));
    order.push({ g: line.parentNode, depth });
  }
  /* z-sort maison : on repeint loin → près, donc une ligne ne peut plus
     recouvrir la bille d'un axe plus proche */
  order.sort((a, b) => a.depth - b.depth);
  for (const { g } of order) triadSvg.append(g);
}

const triadParts = buildTriad(triadSvg);

const cad = initCAD(
  document.querySelector(".stage"),
  document.getElementById("cad3d"),
  document.getElementById("cad-annos")
);

/* ---- Specs cliquables → scroll vers la phase de la section ---- */
addEventListener("goto-section", (e) => {
  if (labels.length) scrollToPhase(e.detail.index);
});

/* ---- Fiche : voile semi-transparent au-dessus de la pièce ---- */
const overlay = document.createElement("div");
overlay.id = "ficheOverlay";
overlay.innerHTML = `
  <article class="fiche">
    <header>
      <h2 class="ficheTitre"></h2>
      <button class="ficheClose" aria-label="Fermer (Échap)">✕</button>
    </header>
    <p class="ficheMeta meta mono"></p>
    <div class="ficheContenu"></div>
    <p class="ficheTags"></p>
  </article>`;
document.body.append(overlay);

let ficheCache = null;
const loadFiches = () => (ficheCache ??= fetch("data/textes.json").then((r) => r.json()).catch(() => null));

async function openFiche(hrefOrId) {
  const id = decodeURIComponent(String(hrefOrId).match(/fiche=([^&]+)/)?.[1] ?? hrefOrId);
  const data = await loadFiches();
  const t = data?.[String(id)];
  if (!t) { console.warn("Fiche introuvable :", id); return; }
  overlay.querySelector(".ficheTitre").textContent = t.titre ?? "";
  overlay.querySelector(".ficheMeta").textContent = t.meta || "";
  const cont = overlay.querySelector(".ficheContenu");
  cont.replaceChildren();
  if (t.img) {
    const img = document.createElement("img");
    img.src = t.img;
    img.alt = t.titre ?? "";          // accessibilité
    img.className = "ficheImg";
    img.onerror = () => img.remove(); // logo manquant → pas de cadre vide
    cont.append(img);
  }
  for (const par of t.contenu || []) { const p = document.createElement("p"); p.textContent = par; cont.append(p); }
  if (t.imgs?.length) {
    const wrap = document.createElement("div");
    wrap.className = "ficheImgs";
    for (const src of t.imgs) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.className = "ficheImg";
      img.onerror = () => img.remove(); // même logique que t.img : image absente → pas de cadre vide
      wrap.append(img);
    }
    cont.append(wrap);
  }
  const tags = overlay.querySelector(".ficheTags");
  tags.replaceChildren();
  for (const tag of t.tags || []) { const sp = document.createElement("span"); sp.textContent = tag; tags.append(sp); }
  overlay.classList.add("is-open");
  document.documentElement.classList.add("fiche-lock");
  history.replaceState(null, "", `#fiche=${id}`);   // URL partageable
}
function closeFiche() {
  overlay.classList.remove("is-open");
  document.documentElement.classList.remove("fiche-lock");
  history.replaceState(null, "", location.pathname + location.search);   // retire le hash
}

addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay.classList.contains("is-open")) closeFiche();
});

overlay.querySelector(".ficheClose").addEventListener("click", closeFiche);
overlay.addEventListener("click", (e) => { if (e.target === overlay) closeFiche(); });   // clic sur le voile, hors de la fiche

/* ---- Intro panel : présentation sur la vue ISO (grille visible) ---- */
const introPanel = document.createElement("div");
introPanel.id = "introPanel";
introPanel.innerHTML = `
  <div class="intro-photo"><img src="assets/images/photogilles.jpeg" alt="Gilles"></div>
  <div class="intro-content">
    <h2 class="intro-name"></h2>
    <p class="intro-accroche"></p>
    <p class="intro-site">Ce site présente mon parcours sous la forme d'une pièce CAO : chaque face du cube est une section de mon CV. Naviguez avec la molette ou les flèches ←/→ pour explorer les spécifications cliquables.</p>
    <p class="intro-hint">↓ Faites défiler pour explorer</p>
  </div>`;
document.querySelector(".stage").append(introPanel);

const introImg = introPanel.querySelector(".intro-photo img");
introImg?.addEventListener("error", () => {
  introImg.replaceWith(Object.assign(document.createElement("div"),
    { className: "intro-photo--ph", textContent: "G" }));
});

/* ---- Légende des couleurs de specs ---- */
const legend = document.createElement("div");
legend.id = "legend";
legend.innerHTML = `
  <div class="legend-item"><span class="legend-dot legend-dot--normal"></span> Spécification</div>
  <div class="legend-item"><span class="legend-dot legend-dot--important"></span> Spécification importante</div>`;
document.querySelector(".stage").append(legend);

/* un seul handler pour TOUS les liens #fiche= (arbre + cartes du panneau S2-S5) ;
   Ctrl/Meta+clic est laissé au navigateur → nouvel onglet natif */
addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#fiche="]');
  if (!a || e.ctrlKey || e.metaKey) return;
  e.preventDefault();
  closeTreeDrawer();                       // referme le tiroir mobile
  openFiche(a.getAttribute("href"));
});
addEventListener("open-fiche", (e) => openFiche(e.detail.href));

/* boot : si l'URL contient déjà #fiche=N, ouvrir l'overlay au chargement */
const bootFiche = location.hash.match(/fiche=([^&]+)/);
if (bootFiche) openFiche(bootFiche[1]);

/* ---- Fenêtre d'affichage des annotations FTA ---- */
const LEAD = 0.45;   // plateau avant la clé (apparition anticipée)
const LAG  = 0.35;   // plateau après la clé  ← c'est le correctif
const FADE = 0.10;   // largeur du fondu
const smooth = (t) => t * t * (3 - 2 * t);        // smoothstep

function sectionWeights(q) {
  const w = [];
  const a = LEAD + FADE, b = LAG + FADE;
  for (let i = 1; i < labels.length; i++) {       // labels[0] = Home
    const d = q - i;                              // écart à la clé de la section i
    if (d <= -a || d >= b)  w[i] = 0;
    else if (d < -LEAD)     w[i] = smooth((d + a) / FADE);
    else if (d >  LAG)      w[i] = smooth((b - d) / FADE);
    else                    w[i] = 1;
  }
  return w;
}

/* Background */

/* ---- Cube ---- */
function apply(p) {
  if (KEYS.length < 2) return;
  const last = KEYS[KEYS.length - 1];
  const q = Math.min(Math.max(p, 0), last.p);
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].p < q) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = b.p === a.p ? 1 : (q - a.p) / (b.p - a.p);
  const rx = lerp(a.rx, b.rx, t);
  const ry = lerp(a.ry, b.ry, t);
  const zoom = lerp(a.zoom ?? 1, b.zoom ?? 1, t);
  cad.setPose(rx, ry);
  if (cad.setZoom) cad.setZoom(zoom);
  else cadEl.style.transform = `scale(${zoom})`;   // fallback CSS si cube3d n'a pas setZoom
  const k = Math.min(Math.max(q / 0.4, 0), 1);   // fondu sur 0 → 0.4
  const gridW = 1 - k * k * (3 - 2 * k);         // smoothstep
    cad.setGridFade(gridW);
      /* Intro panel : visible quand la grille est visible (ISO), masqué au scroll */
  introPanel.style.opacity = gridW;
  introPanel.style.pointerEvents = gridW > 0.5 ? "auto" : "none";
  introPanel.style.transform = `translateY(${(1 - gridW) * -16}px)`;
  /* Légende : reste visible, s'estompe légèrement hors ISO */
  legend.style.opacity = (0.5 + 0.5 * gridW).toFixed(2);
  updateTriad(rx, ry);
  const w = sectionWeights(q);
  cad.setSections(w);
  // section affichée = celle dont les annotations sont dominantes (même logique que le fondu)
  let cur = 0, best = 0;
  for (let i = 1; i < w.length; i++) if (w[i] > best) { best = w[i]; cur = i; }
  const name = cur === 0 ? "ISO" : labels[cur].toUpperCase();
  viewLabel.textContent = name;
  sbPhase.textContent = name;
  sbRot.textContent = `RX ${rx >= 0 ? "+" : "−"}${Math.abs(rx).toFixed(1)}°  RY ${ry >= 0 ? "+" : "−"}${Math.abs(ry).toFixed(1)}°  Z ×${zoom.toFixed(2)}`;
  setActive(cur);
  [...viewButtons.children].forEach((btn, k) => btn.classList.toggle("is-active", k === cur));
  viewButtons.style.setProperty("--seg", cur);   // pouce blanc du segmented control (CSS : translateX)
}

function frame() {
  currentP += (targetP - currentP) * 0.16;
  if (Math.abs(targetP - currentP) < 0.0005) currentP = targetP;
  apply(currentP);
  requestAnimationFrame(frame);
}

function onScroll() {
  const m = document.documentElement.scrollHeight - window.innerHeight;
  if (m > 0) targetP = (window.scrollY / m) * (labels.length - 1);
}

const secTitle = document.getElementById("secTitle");
/* Titre de section : suit la phase active via l'arbre (source de vérité déjà câblée) */
let secTitles = null;
fetch("data/sections.json").then(r => r.json()).then(d => {
  const arr = Array.isArray(d) ? d : d.sections;
  secTitles = ["Accueil", ...arr.map(s => s.titre)];
  const row = document.querySelector("#tree .tree__row.is-active");
  if (row) applyTitle(parseInt(row.dataset.phase, 10));   // rattrape l'état courant
});
function applyTitle(i) {
  const el = document.getElementById("secTitle");
  if (!el || !secTitles) return;
  const t = secTitles[i] ?? "";
  if (el.textContent === t) return;
  el.dataset.text = t;              // pour le ::before (liseré chrome)
  el.textContent = t;
}
new MutationObserver(() => {
  const row = document.querySelector("#tree .tree__row.is-active");
  if (row) applyTitle(parseInt(row.dataset.phase, 10));
}).observe(document.getElementById("tree"), { subtree: true, attributes: true, attributeFilter: ["class"] });

/* ---- Arbre mobile : tiroir (déclaré UNE fois, hors des fonctions) ---- */
const toolbar = document.querySelector(".toolbar");
const treeScrim = document.getElementById("treeScrim")
  ?? Object.assign(document.body.appendChild(document.createElement("div")), { id: "treeScrim" });
let menuBtn = document.getElementById("menuBtn");
if (!menuBtn && toolbar) {
  menuBtn = document.createElement("button");
  menuBtn.className = "toolbar__menu";
  menuBtn.id = "menuBtn";
  menuBtn.type = "button";
  menuBtn.setAttribute("aria-label", "Afficher l'arbre");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.innerHTML = "<span></span><span></span><span></span>";
  toolbar.querySelector(".toolbar__logo")?.after(menuBtn);
}

function setTreeDrawer(open) {
  tree.classList.toggle("is-open", open);
  treeScrim.classList.toggle("is-open", open);
  document.documentElement.classList.toggle("tree-lock", open);
  menuBtn?.setAttribute("aria-expanded", String(open));
}
function closeTreeDrawer() { setTreeDrawer(false); }

menuBtn?.addEventListener("click", () =>
  setTreeDrawer(!tree.classList.contains("is-open")));

/* clic hors du tiroir (ou sur le voile) → fermeture */
document.addEventListener("click", (e) => {
  if (!tree.classList.contains("is-open")) return;
  if (e.target.closest("#tree") || e.target.closest("#menuBtn")) return;
  closeTreeDrawer();
});

function scrollToPhase(i) {
  if (overlay.classList.contains("is-open")) return;
  closeTreeDrawer();                      // referme le tiroir après un saut
  const m = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: (i / (labels.length - 1)) * m, behavior: "smooth" });
}

addEventListener("keydown", (e) => {
  if (!labels.length) return;
  const cur = Math.round(targetP);
  if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); scrollToPhase(Math.min(cur + 1, labels.length - 1)); }
  if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { e.preventDefault(); scrollToPhase(Math.max(cur - 1, 0)); }
});

async function init() {
  try {
    const [resS, resT] = await Promise.all([fetch("data/sections.json"), fetch("data/textes.json")]);
    const data = await resS.json();
    const textes = await resT.json();
    const resP = await fetch("data/profil.json");
    const profil = await resP.json();

    const ICONS = {
      mail: '<svg viewBox="0 0 16 16"><path d="M0 3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V3Zm1.5.8L8 8.3l6.5-4.5V3.5l-6.5 4.5L1.5 3.5v.3Z"/></svg>',
      linkedin: '<svg viewBox="0 0 16 16"><path d="M3.4 5.7H.6V15h2.8V5.7ZM2 1a1.7 1.7 0 1 0 0 3.4A1.7 1.7 0 0 0 2 1Zm5.4 4.7H4.8V15h2.7v-4.9c0-2 2.6-2.2 2.6 0V15h2.7V9.2c0-4.3-4.4-4.1-5.4-2V5.7Z"/></svg>',
      github: '<svg viewBox="0 0 16 16"><path d="M8 0a8 8 0 0 0-2.5 15.6c.4 0 .5-.2.5-.4v-1.4c-2 .4-2.5-.9-2.5-.9-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8 0 1.2.8 1.2.8.7 1.3 2 .9 2.4.7 0-.6.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1 0-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.4 7.4 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.5 1.1.1 1.9.1 2.1.5.5.8 1.2.8 2.1 0 3.1-1.9 3.8-3.6 4 .3.2.6.7.6 1.5v2.2c0 .2.1.5.5.4A8 8 0 0 0 8 0Z"/></svg>'
    };

    const contacts = document.getElementById("contacts");
    contacts.innerHTML = `
      <a href="mailto:${profil.mail}">${ICONS.mail}<span>${profil.mail}</span></a>
      <a href="${profil.linkedin}" target="_blank" rel="noopener">${ICONS.linkedin}<span>LinkedIn</span></a>
      <a href="${profil.github}"  target="_blank" rel="noopener">${ICONS.github}<span>GitHub</span></a>`;
    /* Remplir l'intro panel avec les données du profil */
    introPanel.querySelector(".intro-name").textContent = profil.nom;
    introPanel.querySelector(".intro-accroche").textContent = profil.accroche;

    buildTree(tree, data, textes, scrollToPhase);

    labels = [data.home?.titre ?? "Home", ...data.sections.map(s => s.titre)];
    // 5 sections : S1..S4 en rotation autour de Y, S5 ramenée du dessus
    // Ordre : ISO → devant → derrière → dessus → droite → gauche
    KEYS = buildKeys(data.sections);
    labels.forEach((l, i) => {
      const b = document.createElement("button");
      b.textContent = i === 0 ? "ISO" : `S${i}`;
      b.title = l;
      b.addEventListener("click", () => scrollToPhase(i));
      viewButtons.append(b);
    });

    space.style.height = `${labels.length * 100}vh`;
    for (let i = 0; i < labels.length; i++) {
      const snap = document.createElement("div");
      snap.className = "snap";
      space.append(snap);
    }

    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    frame();
  } catch (err) {
    viewLabel.textContent = "ERREUR";
    sbPhase.textContent = "ÉCHEC DU CHARGEMENT";
    console.error(err);
  }
}
init();
