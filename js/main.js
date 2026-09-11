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

/* Vues par défaut des sections, une par face (cyclées s'il y en a plus) */
const VIEWS = [
  { rx: 0,   ry: -90 },   // S1 Expériences : face DROITE (+X) — annotations cliquables  ← modifié
  { rx: 0,   ry: 180 },   // S2 Formations  : derrière       (inchangé)
  { rx: -90, ry: 180 },   // S3 Bénévolat   : dessus         (inchangé)
  { rx: 0,   ry: 270 },   // S4 Certifications : côté (+X)   (inchangé)
  { rx: 0,   ry: 0   },   // S5 Freelance & Divers : devant  (inchangé — épinglé ici, était VIEWS[0])
];

/* Règle : section inline → rien. > 5 boîtes → zoom, > 10 → 3 étapes. */
function buildKeys(sections) {
  const keys = [{ p: 0, ...ISO }];
  sections.forEach((s, i) => {
    const view = VIEWS[i % VIEWS.length];
    const boxes = (s.textes || []).length;
    const zoomable = boxes > 5 && !s.inline;
    const steps = zoomable ? (boxes > 10 ? 3 : 2) : 0;
    for (let k = 1; k <= steps; k++) {
      keys.push({
        p: i + k / (steps + 1),           // à l'intérieur de l'intervalle de la section
        rx: view.rx + k * 6,
        ry: view.ry + k * 18,             // petite dérive en rotation pour l'effet "exploration"
        zoom: 1 + k * (steps === 3 ? 0.7 : 0.9),
      });
    }
    keys.push({ p: i + 1, ...view, zoom: 1 });
  });
  return keys;
}

/* ---- Trièdre façon Blender ---- */
const SVG_NS = "http://www.w3.org/2000/svg";
const AXES = [
  { v: [1, 0, 0],  label: "X", cls: "x" },   // rouge  → droite
  { v: [0, 0, 1],  label: "Y", cls: "y" },   // verte  → profondeur
  { v: [0, -1, 0], label: "Z", cls: "z" },   // bleue  → haut
  { v: [-1, 0, 0], label: null, cls: "x" },
  { v: [0, 0, -1], label: null, cls: "y" },
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
  const L = 36;
  for (const { ax, line, dot, t } of triadParts) {
    const [x, y, z] = rotVec(rx, ry, ax.v);
    const px = 50 + x * L, py = 50 + y * L;
    const depth = (z + 1) / 2;             // 1 = vers nous, 0 = opposé
    line.setAttribute("x1", 50); line.setAttribute("y1", 50);
    line.setAttribute("x2", px.toFixed(1)); line.setAttribute("y2", py.toFixed(1));
    dot.setAttribute("cx", px.toFixed(1)); dot.setAttribute("cy", py.toFixed(1));
    dot.setAttribute("r", ((ax.label ? 7 : 4) * (0.8 + 0.2 * depth)).toFixed(1));
    if (t) { t.setAttribute("x", px.toFixed(1)); t.setAttribute("y", py.toFixed(1)); }
    line.parentNode.setAttribute("opacity", (0.35 + 0.65 * depth).toFixed(2));
  }
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

/* ---- Textes de la section affichés quand le scroll y arrive ---- */
let textesData = null;
let sectionsData = [];
let shownSection = -1;

const panel = document.createElement("aside");
panel.id = "sectionTexts";
panel.style.cssText =
  "position:fixed;right:16px;bottom:16px;width:340px;max-height:60vh;" +
  "overflow:auto;background:rgba(20,23,28,.92);border:1px solid #2a3038;" +
  "border-radius:10px;padding:14px 16px;z-index:20;display:none;";
document.body.append(panel);

(async () => {
  try {
    const [rs, rt] = await Promise.all([
      fetch("data/sections.json"),
      fetch("data/textes.json"),
    ]);
    const sData = await rs.json();
    sectionsData = Array.isArray(sData) ? sData : sData.sections || Object.values(sData);
    textesData = await rt.json();
    shownSection = -1;              // force un rafraîchissement au prochain apply()
  } catch (err) {
    console.error("Impossible de charger data/ — lance un serveur local", err);
  }
})();

function textesDeSection(i) {
  if (!textesData) return [];
  const s = sectionsData[i - 1];
  const ids = (s?.textes || []);
  return ids.map((id) => ({ id, ...textesData[String(id)] })).filter((t) => t.titre);
}

function showSectionTexts(i) {
  if (i === shownSection) return;
  shownSection = i;
  panel.replaceChildren();
  const s = sectionsData[i - 1];
  // ISO + S1 Expériences (+ sections inline) : la scène 3D porte elle-même les annotations
  if (!i || i === 1 || s?.inline) { panel.style.display = "none"; return; }
  const h2 = document.createElement("h2");
  h2.textContent = s?.titre || `Section ${i}`;
  panel.append(h2);
  for (const t of textesDeSection(i)) {
    const card = document.createElement("a");
    card.className = "card";
    card.href = `#fiche=${t.id}`;
    const h3 = document.createElement("h3");
    h3.textContent = t.titre;
    card.append(h3);
    if (t.meta) { const m = document.createElement("p"); m.className = "meta mono"; m.textContent = t.meta; card.append(m); }
    if (t.contenu?.length) { const p = document.createElement("p"); p.className = "cardExcerpt"; p.textContent = t.contenu[0].slice(0, 90) + "…"; card.append(p); }
    panel.append(card);
  }
  panel.style.display = "block";
}

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
  for (const par of t.contenu || []) { const p = document.createElement("p"); p.textContent = par; cont.append(p); }
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

/* un seul handler pour TOUS les liens #fiche= (arbre + cartes du panneau S2-S5) ;
   Ctrl/Meta+clic est laissé au navigateur → nouvel onglet natif */
addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#fiche="]');
  if (!a || e.ctrlKey || e.metaKey) return;
  e.preventDefault();
  openFiche(a.getAttribute("href"));
});
addEventListener("open-fiche", (e) => openFiche(e.detail.href));

/* boot : si l'URL contient déjà #fiche=N, ouvrir l'overlay au chargement */
const bootFiche = location.hash.match(/fiche=([^&]+)/);
if (bootFiche) openFiche(bootFiche[1]);

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
  updateTriad(rx, ry);
  const cur = q < 0.02 ? 0 : Math.ceil(q - 0.001); // p ∈ ]i-1, i] → section i
  cad.setSection(cur);
  showSectionTexts(cur);
  const name = cur === 0 ? "ISO" : labels[cur].toUpperCase();
  viewLabel.textContent = name;
  sbPhase.textContent = name;
  sbRot.textContent = `RX ${rx >= 0 ? "+" : "−"}${Math.abs(rx).toFixed(1)}°  RY ${ry >= 0 ? "+" : "−"}${Math.abs(ry).toFixed(1)}°  Z ×${zoom.toFixed(2)}`;
  setActive(cur);
  [...viewButtons.children].forEach((btn, k) => btn.classList.toggle("is-active", k === cur));
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

function scrollToPhase(i) {
  if (overlay.classList.contains("is-open")) return;
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
