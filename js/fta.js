import * as THREE from "three";
import { CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

const lineMat = () => new THREE.LineBasicMaterial({ color: 0xdfe7ee, transparent: true, opacity: 0.85, depthTest: false });
const flatMat = () => new THREE.MeshBasicMaterial({ color: 0xdfe7ee, side: THREE.DoubleSide, depthTest: false });

/* ---- Specs cliquables → navigation vers la section ---- */
let sectionsCache = null;
function loadSections() {
  sectionsCache ??= fetch("data/sections.json")
    .then((r) => r.json())
    .catch(() => null);
  return sectionsCache;
}

async function sectionTitle(i) {
  const data = await loadSections();
  const arr = Array.isArray(data) ? data
    : data?.sections || Object.values(data || {});
  const s = arr[i - 1];
  return s?.titre || s?.title || s?.name || `Section ${i}`;
}

let textesCache = null;
function loadTextes() {
  textesCache ??= fetch("data/textes.json").then((r) => r.json()).catch(() => null);
  return textesCache;
}

async function ficheTitle(href) {
  const m = String(href).match(/fiche=([^&]+)/);
  if (!m) return null;
  const data = await loadTextes();
  return data?.[decodeURIComponent(m[1])]?.titre ?? null;
}

/* titre tronqué pour le sous-libellé : "Alternant en maîtrise …" */
const shortTitle = (s, n = 28) =>
  s.length > n
    ? s.slice(0, s.lastIndexOf(" ", n) > 0 ? s.lastIndexOf(" ", n) : n).trimEnd() + "…"
    : s;

function makeClickable(el, target) {
  if (!target) return;
  el.style.pointerEvents = "auto";   // l'annoEl parent est en pointer-events:none
  el.style.cursor = "pointer";
  const sub = document.createElement("div");
  sub.className = "gdnt-link";
  el.append(sub);
  if (typeof target === "number") {
    sub.textContent = "→ …";
    sectionTitle(target).then((t) => { sub.textContent = `→ ${t}`; });
    el.addEventListener("click", () =>
      window.dispatchEvent(new CustomEvent("goto-section", { detail: { index: target } })));
  } else {
    sub.textContent = "→ …";
    ficheTitle(target).then((t) => {
      sub.textContent = t ? `→ ${shortTitle(t)}` : "→ ouvrir la fiche";   // ex. « → Alternant en maîtrise … »
      if (t) el.title = t;                                                // titre complet au survol
    });
    el.addEventListener("click", (e) => {
      if (e.ctrlKey || e.metaKey) { window.open(target, "_blank"); return; }  // Ctrl+clic → nouvel onglet sur #fiche=N
      window.dispatchEvent(new CustomEvent("open-fiche", { detail: { href: target } }));
    });
  }
}

/* ---- registre des plans de datum (rempli par buildFTA(getPlane)) ---- */
const planes = [null, null, null, null];

/* monde → (u,v) local du plan de la section i
   S1 face : u=x, v=y | S2 côté : u=−z, v=y | S3 dessus : u=x, v=−z */
function toUV(i, [x, y, z]) {
  return i === 1 ? [-z, y]     // S1 droite
       : i === 2 ? [x, y]      // S2 face
       : i === 3 ? [-x, z]     // S3 Projets (dessus)
       : i === 4 ? [-x, y]     // S4 Compétences (arrière)
       : i === 5 ? [-x, y]     // S5 le Reste (arrière)
       : [x, y];
}

const LABEL_SCALE = 0.5; // px CSS → unités monde ; à régler une fois

function putLabel(el, i, u, v, section, z = 1, scale = LABEL_SCALE) {
    if (!planes[i]) return null;
  const o = new CSS3DObject(el);
  o.position.set(u, v, z);
  o.scale.setScalar(scale);
  planes[i].add(o);
  makeClickable(el, section);
  return o;
}

function flatPoly(i, pts, z = 0.2) {
  if (!planes[i]) { console.warn(`fta: plane ${i} absent — annotation ignorée`); return; }
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
    pts.map(([u, v]) => new THREE.Vector3(u, v, z))), lineMat());
  l.renderOrder = 10;
  planes[i].add(l);
}

function flatTri(i, u, v, du, dv, w = 7, h = 8) {
  if (!planes[i]) return;
  const len = Math.hypot(du, dv) || 1;
  const dx = du / len, dy = dv / len;
  const bx = u - dx * h, by = v - dy * h, px = -dy * w / 2, py = dx * w / 2;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(
    [u, v, 0.3, bx + px, by + py, 0.3, bx - px, by - py, 0.3], 3));
  const m = new THREE.Mesh(g, flatMat());
  m.renderOrder = 10;
  planes[i].add(m);
}

/* Cadre de tolérance : entité (ancrage 3D projeté) → label posé sur le plan */
export function toleranceFrame(symbol, values, i, anchor, labelUV, section) {
  const [au, av] = toUV(i, anchor), [lu, lv] = labelUV;
  flatPoly(i, [[au, av], [lu, lv]]);
  flatTri(i, au, av, lu - au, lv - av);
  const el = document.createElement("div");
  el.className = "gdnt";
  const sym = document.createElement("span");
  sym.className = "gdnt-sym"; sym.textContent = symbol;
  el.append(sym);
  for (const v of values) {
    const c = document.createElement("span");
    c.className = "gdnt-cell"; c.textContent = v;
    el.append(c);
  }
  return putLabel(el, i, lu, lv, section);
}

/* Datum : triangle à plat + leader + cadre lettré, tout sur le plan */
export function datum(letter, i, anchor, offset, section) {
  const [au, av] = toUV(i, anchor);
  const [bu, bv] = toUV(i, anchor.map((c, k) => c + offset[k]));
  flatTri(i, au, av, bu - au, bv - av);
  flatPoly(i, [[au, av], [bu, bv]]);
  const el = document.createElement("div");
  el.className = "gdnt-datum"; el.textContent = letter;
  return putLabel(el, i, bu, bv, section);
}

/* Cote : lignes de rappel + ligne de cote + flèches + texte, sur le plan */
export function dimensionISO(text, i, p1, p2, off = -30, section) {
  const [u1, v1] = toUV(i, p1), [u2, v2] = toUV(i, p2);
  const alongU = Math.abs(u2 - u1) >= Math.abs(v2 - v1);
  const s = Math.sign(off) || 1, d = Math.abs(off);
  const A = [u1 + (alongU ? 0 : s) * d, v1 + (alongU ? s : 0) * d];
  const B = [u2 + (alongU ? 0 : s) * d, v2 + (alongU ? s : 0) * d];
  flatPoly(i, [[u1, v1], A]); flatPoly(i, [[u2, v2], B]); flatPoly(i, [A, B]);
  flatTri(i, A[0], A[1], B[0] - A[0], B[1] - A[1]);
  flatTri(i, B[0], B[1], A[0] - B[0], A[1] - B[1]);
  const el = document.createElement("div");
  el.className = "gdnt-cote"; el.textContent = text;
  return putLabel(el, i, (A[0] + B[0]) / 2 + (alongU ? 0 : 12 * s),
                        (A[1] + B[1]) / 2 + (alongU ? 12 * s : 0), section);
}

/* Annotation « expérience » : ligne de rappel + flèche + cadre GD&T cliquable → fiche existante */
export function specificationISO(glyph, label, href, i, anchor, labelUV, scale) {
  const [au, av] = toUV(i, anchor), [lu, lv] = labelUV;
  flatPoly(i, [[au, av], [lu, lv]]);          // ligne de rappel
  flatTri(i, au, av, lu - au, lv - av);       // flèche sur la face
  const el = document.createElement("div");
  el.className = "gdnt";
  const sym = document.createElement("span");
  sym.className = "gdnt-sym"; sym.textContent = glyph;
  const val = document.createElement("span");
  val.className = "gdnt-cell"; val.textContent = label;
  el.append(sym, val);
  return putLabel(el, i, lu, lv, href, 1, scale);
}

export function buildFTA(getPlane) {
  planes[1] = getPlane(1);
  planes[2] = getPlane(2);
  planes[3] = getPlane(3);
  planes[4] = getPlane(4);                                   // ← NOUVEAU : face Certifications
  planes[5] = getPlane(5);
  planes[6] = getPlane(6);                            // ← prêt pour Projets (dessus)
  planes[7] = getPlane(7);
  planes[8] = getPlane(8);   // ← prêt pour Compétences / Le reste

  /* ---- S1 EXPÉRIENCES : face droite (+X), 6 annotations cliquables ---- */
  specificationISO("⌖", "Alternance Safran", "#fiche=exp:altSafran", 1, [46, 24, -30], [64, 84]);
  specificationISO("⌖", "I2M polytoCAT",     "#fiche=exp:i2mL3",     1, [46, -4, -30], [64, -84]);
  specificationISO("⏥", "Expert LaTeX",     "#fiche=exp:frlLaTeX",  1, [46, -28, -12], [-38, -66]);
  specificationISO("⌭", "Stage Exoes",       "#fiche=exp:stgExoes",  1, [46, 18, -30], [-28, 78]);
  dimensionISO("Ø28", 1, [46, 24, -30], [46, -4, -30],  30, "#fiche=exp:stgStirweld");
  dimensionISO("32",  1, [46, 10, -30], [46, 42, -30], -36, "#fiche=exp:i2mL2");

  /* ---- S2 FORMATIONS & DIVERS (face) : fiches 4 → 15 ---- */
  // Formations
  specificationISO("⌖", ["Ø0.2","A","B"], 2, [30, 30, 20],  [72, 78],  "#fiche=4");   // Master GM
  specificationISO("↗", ["0.05","A","B"], 2, [30, -30, 20], [72, -78], "#fiche=5");   // Licence SPI
  specificationISO("⌖", "Bac général", "#fiche=6", 2, [0, 45, 20],     [0, 92]);      // Bac
  // Bénévolat
  specificationISO("⌖", ["Ø0.25","A","B"], 2, [-30, 30, 20], [-72, 78], "#fiche=7");  // Chef scouts
  dimensionISO("Ø30 H7", 2, [-15, 0, 20], [15, 0, 20], -40, "#fiche=8");                    // Assistant intendant (alésage Ø30 [1])
  specificationISO("⏥", "Scouts GSE", "#fiche=9", 2, [-45, 0, 20],     [-100, 0]);    // Engagement en bref
  // Certifications
  specificationISO("⌖", "TOEIC C1", "#fiche=10", 2, [45, 0, 20],       [100, 0]);
  specificationISO("⏥", "PIX",      "#fiche=11", 2, [-30, -30, 20],    [-72, -78]);
  dimensionISO("Ø28", 2, [23, 24, 20], [23, -4, 20], 30, "#fiche=12");                      // BIA (sur le contrelamage Ø46 [1])
  // Freelance & Divers
  specificationISO("⌖", "STIRWELD FSW", "#fiche=14", 2, [0, -52, 20],  [0, -92]);
  specificationISO("⌖", "I2M thermo",   "#fiche=15", 2, [15, 15, 20],  [76, 40]);

    /* ---- S3 PROJETS (dessus · plane 6) : 12 fiches, 2 colonnes ---- */
  // Colonne gauche (u = -x) : projets académiques
  specificationISO("⌖", "Indus M1",      "#fiche=fac:indusM1",           3, [ 30, 46,  24], [-70,  88]);
  specificationISO("⏥", "Rétro-conc.",  "#fiche=fac:retroconceptionM1", 3, [ 30, 46,  14], [-70,  63]);
  specificationISO("⌭", "Tolérancement", "#fiche=fac:tolerancementM2",   3, [ 30, 46,   4], [-70,  38]);
  specificationISO("⏥", "TP métro",     "#fiche=fac:TPmetroM2",         3, [ 30, 46,  -6], [-70,  13]);
  specificationISO("⌖", "Design L2",     "#fiche=fac:designL2",          3, [ 30, 46, -16], [-70, -13]);
  specificationISO("⌭", "Calcul L3",     "#fiche=fac:dimensionnementL3", 3, [ 30, 46, -24], [-70, -38]);
  specificationISO("⏥", "R2D2",         "#fiche=fac:conceptionL3",      3, [ 12, 46,  24], [-70, -63]);
  specificationISO("⌖", "Cahier fiches", "#fiche=fac:cahierFiches",      3, [ 12, 46,  14], [-70, -88]);
  // Colonne droite : projets perso
  specificationISO("⌖", "Homelab",   "#fiche=diy:homelab",      3, [-25, 46,  20], [70,  60]);
  specificationISO("⏥", "Clavier",   "#fiche=diy:clavierAZ",    3, [-25, 46,   7], [70,  20]);
  specificationISO("⌭", "Obsidian",  "#fiche=diy:obsidianWiki", 3, [-25, 46,  -7], [70, -20]);
  specificationISO("⌖", "Portfolio", "#fiche=diy:portfolio",    3, [-25, 46, -20], [70, -60]);

  /* ---- S4 COMPÉTENCES (arrière · plane 8) : 11 fiches, 2 colonnes ---- */
  // Gauche : mécanique
  specificationISO("⌖", "Conception",    "#fiche=cmp:conception",     4, [ 30, 24, -20], [-70,  88]);
  specificationISO("⏥", "Maîtrise dim.", "#fiche=cmp:maitriseDim",    4, [ 15, 42, -20], [-70,  53]);
  specificationISO("⌭", "Métrologie",    "#fiche=cmp:metrologie",     4, [  0, 46, -20], [-70,  18]);
  specificationISO("⌖", "Fermeture G.",  "#fiche=cmp:fermetureGeom",  4, [-15, 42, -20], [-70, -18]);
  specificationISO("⏥", "Usinage",       "#fiche=cmp:usinage",        4, [-30, 24, -20], [-70, -53]);
  specificationISO("⌭", "Fab. additive", "#fiche=cmp:fabAdditive",    4, [-30,  0, -20], [-70, -88]);
  // Droite : numérique
  specificationISO("⌖", "Win/Linux",   "#fiche=cmp:windowsLinux",  4, [-30, -24, -20], [70,  72]);
  specificationISO("⏥", "Pack Office", "#fiche=cmp:packOffice",    4, [-15, -42, -20], [70,  36]);
  specificationISO("⌭", "Prog.",       "#fiche=cmp:programmation", 4, [  0, -46, -20], [70,   0]);
  specificationISO("⌖", "LLM/IA",      "#fiche=cmp:llmIA",         4, [ 15, -42, -20], [70, -36]);
  specificationISO("⏥", "Stats",       "#fiche=cmp:statistiques",  4, [ 30, -24, -20], [70, -72]);

  /* ---- S5 LE RESTE (arrière · plane 7) : 6 fiches ---- */
  // Sports
  specificationISO("⌖", "Escalade",  "#fiche=spr:escalade",   5, [ 30, 40, -25], [-72,  70]);
  specificationISO("⏥", "Haltéro",   "#fiche=spr:halter",     5, [ 30, 13, -25], [-72,  23]);
  specificationISO("⌭", "Vélo",      "#fiche=spr:velo",       5, [ 30,-13, -25], [-72, -23]);
  specificationISO("⌖", "Randonnée", "#fiche=spr:rando",      5, [ 30,-40, -25], [-72, -70]);
  // Divers
  specificationISO("⏥", "Jeux vidéo", "#fiche=otr:videogames", 5, [-30, 20, -25], [72,  45]);
  specificationISO("⌖", "Bricolage",  "#fiche=diy:bricolage",  5, [-30,-20, -25], [72, -45]);
}
