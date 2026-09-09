import * as THREE from "three";

const MAT = () => new THREE.MeshStandardMaterial({
  color: 0xc9d2da, metalness: 0.85, roughness: 0.32,
});

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

// Plaquette à angles chanfreinés + alésage central
function chamferedPlate(w, h, t, chamfer, holeR) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + chamfer, -h / 2);
  s.lineTo(w / 2 - chamfer, -h / 2);
  s.lineTo(w / 2, -h / 2 + chamfer);
  s.lineTo(w / 2, h / 2 - chamfer);
  s.lineTo(w / 2 - chamfer, h / 2);
  s.lineTo(-w / 2 + chamfer, h / 2);
  s.lineTo(-w / 2, h / 2 - chamfer);
  s.lineTo(-w / 2, -h / 2 + chamfer);
  s.closePath();
  if (holeR) {
    const p = new THREE.Path();
    p.absarc(0, 0, holeR, 0, Math.PI * 2, true);
    s.holes.push(p);
  }
  return new THREE.ExtrudeGeometry(s, {
    depth: t, bevelEnabled: true, bevelThickness: 0.7,
    bevelSize: 0.7, bevelSegments: 1, curveSegments: 48,
  });
}

// Bouche de perçage simulée (disque noir affleurant — pas de CSG nécessaire)
function holeMouth(r, x, y, z, nx, ny, nz, inner = 0) {
  const n = new THREE.Vector3(nx, ny, nz);
  const pos = new THREE.Vector3(x, y, z);
  const disc = (rad, color, lift) => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(rad, 48),
      new THREE.MeshBasicMaterial({ color })
    );
    m.position.copy(pos).addScaledVector(n, lift);
    m.lookAt(m.position.clone().add(n));
    return m;
  };
  const discs = [disc(r, 0x0d1117, 0.12)];
  if (inner) discs.push(disc(inner, 0x05080c, 0.3)); // fond du contrelamage
  return discs;
}

export function buildPart() {
  const part = new THREE.Group();

  // --- Bride : disque Ø120 × 25, alésage traversant Ø30 ---
  const flange = new THREE.Mesh(annulus(120, 30, 25), MAT());
  part.add(flange);                                   // z 0 → 25

  // --- Pilote Ø70 : corps arrière ---
  const pilotBody = new THREE.Mesh(annulus(70, 30, 14), MAT());
  pilotBody.position.z = 25;                          // z 25 → 39
  part.add(pilotBody);

  // --- Pilote : face avant, contrelamage Ø46 × 8 ---
  const pilotFace = new THREE.Mesh(annulus(70, 46, 8), MAT());
  pilotFace.position.z = 39;                          // z 39 → 47
  part.add(pilotFace);

  // --- Bloc arrière 92 × 84 × 55, angles chanfreinés, alésage Ø30 ---
  const block = new THREE.Mesh(chamferedPlate(92, 84, 55, 14, 15), MAT());
  block.position.z = -55;                             // z -55 → 0
  part.add(block);

  // --- Arêtes nettes, style "shaded with edges" ---
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x0d1117 });
  for (const mesh of part.children.slice()) {
    const e = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 30), edgeMat);
    e.position.copy(mesh.position);
    e.rotation.copy(mesh.rotation);
    part.add(e);
    mesh.castShadow = true;
  }

  // --- Bouches des perçages perpendiculaires à l'axe (simulées) ---
  // Trou vertical Ø20 traversant le bloc
  part.add(...holeMouth(10, 20, 42, -30, 0, 1, 0));    // entrée (face dessus)
  part.add(...holeMouth(10, 20, -42, -30, 0, -1, 0));  // sortie (face dessous)
  // Trou latéral Ø16 traversant, contrelamage Ø28 côté droit
  part.add(...holeMouth(14, 46, 10, -30, 1, 0, 0, 8));
  part.add(...holeMouth(8, -46, 10, -30, -1, 0, 0));   // sortie

  return part;
}
