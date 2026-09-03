/* =================================================================
   1. CONTENU DU PORTFOLIO — personnalise les textes ici
================================================================= */
const PAGES = {
  master:    { titre: "Master Génie Mécanique",  sous: "Université … — 2024 → 2026",
               texte: "Mécanique des structures, CAO (CATIA V5), éléments finis…" },
  licence:   { titre: "Licence SPI",             sous: "Université … — 2021 → 2024",
               texte: "Sciences pour l'Ingénieur : mécanique rationnelle, matériaux, Python…" },
  lycee:     { titre: "Lycée",                   sous: "Bac scientifique — …",
               texte: "Mention …, spécialités …" },
  stage1:    { titre: "Stage — Bureau d'études", sous: "Entreprise … — été 2025",
               texte: "Missions : …" },
  stage2:    { titre: "Stage — Production",      sous: "Entreprise … — été 2024",
               texte: "Missions : …" },
  bde:       { titre: "Bureau des Élèves",       sous: "Rôle — 2023 → 2024",
               texte: "Organisation d'événements, gestion de budget…" },
  robotique: { titre: "Club Robotique",          sous: "Membre — 2022 → 2025",
               texte: "Conception CAO et impression 3D…" },
  pfe:       { titre: "Projet de fin d'études",  sous: "2026",
               texte: "Sujet : …" },
  drone:     { titre: "Conception d'un drone",   sous: "Projet associatif — 2024",
               texte: "Châssis modélisé sous CATIA V5, choix des moteurs, essais…" }
};

/* =================================================================
   2. ARBRE — replier / déplier (comme le +/- de CATIA)
================================================================= */
document.querySelectorAll(".node").forEach(node => {
  node.addEventListener("click", () => {
    const li = node.parentElement;
    li.classList.toggle("open");
    node.querySelector(".toggle").textContent =
      li.classList.contains("open") ? "−" : "+";
  });
});

/* =================================================================
   3. FEUILLES — cliquer affiche la fiche dans la visionneuse
================================================================= */
const fiche = document.getElementById("fiche");

document.querySelectorAll(".leaf").forEach(leaf => {
  leaf.addEventListener("click", () => {
    document.querySelectorAll(".leaf.selected").forEach(l => l.classList.remove("selected"));
    leaf.classList.add("selected");
    const p = PAGES[leaf.dataset.page];
    fiche.innerHTML = `<h2>${p.titre}</h2><p class="sous">${p.sous}</p><p>${p.texte}</p>`;
    fiche.classList.remove("hidden");
  });
});

/* =================================================================
   4. VISIONNEUSE — cube filaire rotatif + repère X/Y/Z
================================================================= */
const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
let t = 0;

const SOMMETS = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) SOMMETS.push([x, y, z]);
const ARETES = [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];

function draw() {
  canvas.width = canvas.offsetWidth;   // gère aussi le redimensionnement
  canvas.height = canvas.offsetHeight;
  const w = canvas.width, h = canvas.height;
  const s = Math.min(w, h) / 5, cx = w / 2, cy = h / 2;

  // Projection 3D → 2D (rotation Z puis X, perspective simple)
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

  // Repère trièdre, comme en CAO
  const ox = 42, oy = h - 42;
  const axes = [["#e5484d", 34, 0, "X"], ["#46a758", 0, -34, "Y"], ["#3b82f6", -22, -22, "Z"]];
  ctx.font = "10px Tahoma";
  for (const [c, dx, dy, label] of axes) {
    ctx.strokeStyle = ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + dx, oy + dy); ctx.stroke();
    ctx.fillText(label, ox + dx * 1.25, oy + dy * 1.25);
  }

  t += 0.01;
  requestAnimationFrame(draw);
}
draw();
