import * as THREE from "three";

const MAT = () => new THREE.MeshStandardMaterial({
  color: 0xc9d2da, metalness: 0.85, roughness: 0.32,
});

function plate(w, h, t, holes = [], bevel = 0.8) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, h / 2);   s.lineTo(-w / 2, h / 2); s.closePath();
  for (const { x, y, d } of holes) {
    const p = new THREE.Path();
    p.absarc(x, y, d / 2, 0, Math.PI * 2, true);
    s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, {
    depth: t, bevelEnabled: true, bevelThickness: bevel,
    bevelSize: bevel, bevelSegments: 1, curveSegments: 48,
  });
  return g;
}

function annulus(dOut, dIn, t) {
  const s = new THREE.Shape();
  s.absarc(0, 0, dOut / 2, 0, Math.PI * 2, false);
  const p = new THREE.Path();
  p.absarc(0, 0, dIn / 2, 0, Math.PI * 2, true);
  s.holes.push(p);
  return new THREE.ExtrudeGeometry(s, {
    depth: t, bevelEnabled: true, bevelThickness: 0.7,
    bevelSize: 0.7, bevelSegments: 1, curveSegments: 64,
  });
}

function gusset(len, height, t) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(len, 0); s.lineTo(len, height); s.closePath();
  return new THREE.ExtrudeGeometry(s, {
    depth: t, bevelEnabled: true, bevelThickness: 0.5,
    bevelSize: 0.5, bevelSegments: 1,
  });
}

export function buildPart() {
  const part = new THREE.Group();

  // --- Semelle 120 × 80 × 12, 4 trous Ø9 ---
  const base = new THREE.Mesh(
    plate(120, 80, 12, [
      { x: -50, y: -30, d: 9 }, { x: 50, y: -30, d: 9 },
      { x: -50, y: 30, d: 9 },  { x: 50, y: 30, d: 9 },
    ]), MAT());
  base.rotation.x = -Math.PI / 2;           // extrusion vers +Y
  base.position.y = 0;
  base.userData.footprint = { x: 120, z: 80 };
  part.add(base);

  // --- montant 80 × 60 × 14 avec alésage Ø40 + 2 trous M8 ---
  const up = new THREE.Mesh(
    plate(80, 60, 14, [
      { x: 0, y: 0, d: 40 },
      { x: -30, y: -18, d: 9 }, { x: 30, y: -18, d: 9 },
    ]), MAT());
  up.position.set(0, 42, -33);              // centré sur l'axe de l'alésage
  part.add(up);

  // --- bossage Ø56, percé Ø40, dépassement 20 ---
  const boss = new THREE.Mesh(annulus(56, 40, 20), MAT());
  boss.position.set(0, 42, -26);            // affleure la face avant du montant
  part.add(boss);

  // --- 2 nervures triangulaires ---
  for (const sx of [-1, 1]) {
    const g = new THREE.Mesh(gusset(46, 44, 8), MAT());
    g.rotation.y = Math.PI / 2;             // profil dans le plan ZY
    g.position.set(sx * 44, 12, 6);
    part.add(g);
  }

  // --- arêtes nettes, style "shaded with edges" ---
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x0d1117 });
  for (const mesh of part.children.slice()) {
    const e = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 30), edgeMat);
    e.position.copy(mesh.position);
    e.rotation.copy(mesh.rotation);
    part.add(e);
    mesh.castShadow = true;
  }
  return part;
}
