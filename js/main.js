/* =================================================================
   main.js — point d'entrée du portfolio
================================================================= */

import { chargerDonnees, construireArbre } from "./tree.js";
import { afficherFiche } from "./content-loader.js";

const arbre  = document.getElementById("arbre");
const statut = document.getElementById("status-gauche");

/* ---------- 0. rapport d'erreurs dans la barre de statut ---------- */
window.addEventListener("error", e => {
  const statut = document.getElementById("status-gauche");
  if (statut) statut.textContent = "Erreur JS : " + e.message;
});

/* ---------- 1. Données + arbre ---------- */
async function initArbre() {
  try {
    const themes = await chargerDonnees();
    construireArbre(arbre, themes, afficherFiche);
    statut.textContent = "Prêt";
  } catch (erreur) {
    console.error(erreur);
    statut.textContent = "Erreur de chargement";
    arbre.innerHTML = `
      <li class="erreur">
        Impossible de charger les fichiers JSON.<br>
        Lance un serveur local : <code>python -m http.server 8000</code><br>
        puis ouvre <code>http://localhost:8000</code>.
      </li>`;
  }
}

/* ---------- 2. Visionneuse 3D (cube filaire + trièdre) ---------- */
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
let W = 0, H = 0, t = 0;
const REDUIT = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function redimensionner() {
  const dpr = Math.min(devicePixelRatio || 1, 2);   // netteté sur écrans HiDPI
  const r = canvas.getBoundingClientRect();
  W = r.width; H = r.height;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const SOMMETS = [
  [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
  [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1],
];
const ARETES = [
  [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7],
];

function projeter([x, y, z]) {
  const ay = 0.7 + t * 0.15, ax = 0.45 + Math.sin(t * 0.4) * 0.12;
  const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
  const x1 =  x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const y1 =  y * cx - z1 * sx;
  const z2 =  y * sx + z1 * cx;
  const f = 5 / (5 + z2);                    // perspective (caméra en z = −5)
  const s = Math.min(W, H) * 0.30;
  return { x: W/2 + x1 * f * s, y: H/2 - y1 * f * s, z: z2 };
}

function dessinerScene() {
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/1.4);
  g.addColorStop(0, "rgba(59,130,246,.10)"); g.addColorStop(1, "rgba(59,130,246,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  const proj = SOMMETS.map(projeter);

  // arêtes : du plus loin au plus proche + fondu de profondeur
  for (const { a, b, z } of ARETES
      .map(([a, b]) => ({ a, b, z: (proj[a].z + proj[b].z) / 2 }))
      .sort((p, q) => q.z - p.z)) {
    const d = clamp((1.9 - z) / 3.8, 0, 1);  // 0 = loin, 1 = proche
    ctx.strokeStyle = `rgba(96,165,250,${0.22 + d * 0.55})`;
    ctx.lineWidth = 1 + d * 1.5; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(proj[a].x, proj[a].y); ctx.lineTo(proj[b].x, proj[b].y);
    ctx.stroke();
  }

  // sommets lumineux
  for (const p of proj) {
    const d = clamp((1.9 - p.z) / 3.8, 0, 1);
    ctx.fillStyle = `rgba(199,226,255,${0.35 + d * 0.6})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.5 + d * 2, 0, Math.PI * 2); ctx.fill();
  }

  dessinerAxes();
}

function dessinerAxes() {
  const ox = 42, oy = H - 42;
  const axes = [["#e5484d", 34, 0, "X"], ["#46a758", 0, -34, "Y"], ["#3b82f6", -22, -22, "Z"]];
  ctx.font = "10px Tahoma";
  ctx.fillStyle = "rgba(215,230,244,.6)";
  ctx.beginPath(); ctx.arc(ox, oy, 2.5, 0, Math.PI * 2); ctx.fill();   // origine
  for (const [c, dx, dy, label] of axes) {
    const ang = Math.atan2(dy, dx);
    ctx.strokeStyle = ctx.fillStyle = c; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + dx, oy + dy); ctx.stroke();
    ctx.beginPath();                                                   // pointe de flèche
    ctx.moveTo(ox + dx, oy + dy);
    ctx.lineTo(ox + dx - 7 * Math.cos(ang - 0.45), oy + dy - 7 * Math.sin(ang - 0.45));
    ctx.lineTo(ox + dx - 7 * Math.cos(ang + 0.45), oy + dy - 7 * Math.sin(ang + 0.45));
    ctx.closePath(); ctx.fill();
    ctx.fillText(label, ox + dx * 1.25, oy + dy * 1.25);
  }
}

/* ---------- Lancement ---------- */
function init3D() {
  redimensionner();
  new ResizeObserver(redimensionner).observe(canvas);
  if (REDUIT) { t = 1.2; dessinerScene(); return; }  // image fixe si mouvement réduit
  (function boucle() {
    t += 0.016;
    dessinerScene();
    requestAnimationFrame(boucle);  // se met en pause tout seul si l'onglet est masqué
  })();
}
initArbre();  // ← builds the specification tree
init3D();     // ← starts the 3D viewer

/* ----- recherche récursive d'un item par id dans les données ----- */
function chercherParId(noeuds, id) {
  for (const n of noeuds ?? []) {
    if (n.id === id) return n;
    const r = chercherParId(n.items, id);
    if (r) return r;
  }
  return null;
}

/* ----- ouvre la fiche indiquée dans l'URL (index.html#id) ----- */
function ouvrirDepuisHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const item = chercherParId(themes, id);
  if (item) {
    afficherFiche(item,
      document.querySelector(`.leaf[data-id="${CSS.escape(id)}"]`));
  }
}

/* à appeler juste après construireArbre(arbre, themes, afficherFiche) : */
ouvrirDepuisHash();
window.addEventListener("hashchange", ouvrirDepuisHash);
