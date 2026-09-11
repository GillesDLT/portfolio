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
async function ficheTitle(href) {   // pour l'infobulle au survol
  const m = String(href).match(/[?&]id=([^&]+)/);
  if (!m) return null;
  const data = await loadTextes();
  return data?.[decodeURIComponent(m[1])]?.titre ?? null;
}

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
    sub.textContent = "→ ouvrir la fiche";
    ficheTitle(target).then((t) => { if (t) el.title = t; });
    el.addEventListener("click", () => { window.location.href = target; });
  }
}

/* ---- registre des plans de datum (rempli par buildFTA(getPlane)) ---- */
const planes = [null, null, null, null];

/* monde → (u,v) local du plan de la section i
   S1 face : u=x, v=y | S2 côté : u=−z, v=y | S3 dessus : u=x, v=−z */
function toUV(i, [x, y, z]) {
  return i === 1 ? [-z, y]     // S1 face DROITE (+X) — EXPERIENCE   ← modifié
       : i === 2 ? [-z, y]     // inchangé
       : i === 3 ? [-x, y]
       : i === 4 ? [z, y]
       : i === 5 ? [x, -z]
       : [x, y];
}

const LABEL_SCALE = 0.5; // px CSS → unités monde ; à régler une fois

function putLabel(el, i, u, v, section, z = 1, scale = LABEL_SCALE) {
  const o = new CSS3DObject(el);
  o.position.set(u, v, z);
  o.scale.setScalar(scale);
  planes[i].add(o);
  makeClickable(el, section);
  return o;
}

function flatPoly(i, pts, z = 0.2) {
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(
    pts.map(([u, v]) => new THREE.Vector3(u, v, z))), lineMat());
  l.renderOrder = 10;
  planes[i].add(l);
}

function flatTri(i, u, v, du, dv, w = 7, h = 8) { // flèche/triangle À PLAT
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
export function cote(text, i, p1, p2, off = -30, section) {
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
export function experienceNote(glyph, label, href, i, anchor, labelUV, scale) {
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
  planes[1] = getPlane(1); planes[2] = getPlane(2); planes[3] = getPlane(3);

  /* ---- S1 EXPÉRIENCES : face droite (+X), 6 annotations cliquables ---- */
  experienceNote("⌖", "Alternance Safran", "pages/texte.html?id=1",  1, [46, 24, -30], [64, 84]);
  experienceNote("⌖", "I2M tolérance",     "pages/texte.html?id=2",  1, [46, -4, -30], [64, -84]);
  experienceNote("⏥", "Planéité",          "pages/texte.html?id=16", 1, [46, -28, -12], [-38, -66]);
  experienceNote("⌭", "Cylindricité",      "pages/texte.html?id=3",  1, [46, 18, -30], [-28, 78]);
  cote("Ø28", 1, [46, 24, -30], [46, -4, -30],  30, "pages/texte.html?id=14"); // cotation Ø → STIRWELD
  cote("32",  1, [46, 10, -30], [46, 42, -30], -36, "pages/texte.html?id=15"); // cotation distance → I2M thermo

  /* ---- autres sections : inchangées ---- */
  toleranceFrame("↗", ["0.05", "A", "B"], 2, [11, -11, 40], [64, 86], 4);
  toleranceFrame("⌖", ["Ø0.2", "A", "B"], 2, [20, 42, -30], [64, -38], 4);
  toleranceFrame("⌖", ["Ø0.25", "A", "B"], 3, [46, 24, -30], [98, -44], 2);
  cote("Ø30 H7", 3, [-15, 0, 40], [15, 0, 40], -30, 2);
  planes[5] = getPlane(5);
  toleranceFrame("⏥", ["0.1", "A"], 5, [0, 30, 20], [70, 60], 3);
}
