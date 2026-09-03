/* =================================================================
   main.js — point d'entrée du portfolio
================================================================= */

import { chargerDonnees, construireArbre } from "./tree.js";
import { afficherFiche } from "./content-loader.js";

const arbre  = document.getElementById("arbre");
const statut = document.getElementById("status-gauche");

/* ---------- 1. Données + arbre ---------- */
async function init() {
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
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
let t = 0;

const SOMMETS = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) SOMMETS.push([x, y, z]);
const ARETES = [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];

function dessinerScene() {
  canvas.width = canvas.offsetWidth;   // gère le redimensionnement
  canvas.height = canvas.offsetHeight;
  const w = canvas.width, h = canvas.height;
  const s = Math.min(w, h) / 5, cx = w / 2, cy = h / 2;

  const proj = SOMMETS.map(([x, y, z]) => {
    const x1 = x * Math.cos(t) - y * Math.sin(t);
    const y1 = x * Math.sin(t) + y * Math.cos(t);
    const y2 = y1 * Math.cos(t / 2) - z * Math.sin(t / 2);
    const z2 = y1 * Math.sin(t / 2) + z * Math.cos(t / 2);
    const d = 5 + z2;
    return [cx + (x1 / d) * s * 4, cy - (y2 / d) * s * 4];
  });

  ctx.strokeStyle = "#d7e6f4";
  ctx.lineWidth = 1.3;
  for (const [a, b] of ARETES) {
    ctx.beginPath();
    ctx.moveTo(proj[a][0], proj[a][1]);
    ctx.lineTo(proj[b][0], proj[b][1]);
    ctx.stroke();
  }

  const ox = 42, oy = h - 42;
  const axes = [["#e5484d", 34, 0, "X"], ["#46a758", 0, -34, "Y"], ["#3b82f6", -22, -22, "Z"]];
  ctx.font = "10px Tahoma";
  for (const [c, dx, dy, label] of axes) {
    ctx.strokeStyle = ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + dx, oy + dy); ctx.stroke();
    ctx.fillText(label, ox + dx * 1.25, oy + dy * 1.25);
  }

  t += 0.01;
  requestAnimationFrame(dessinerScene);
}
dessinerScene();

/* ---------- Lancement ---------- */
init();
