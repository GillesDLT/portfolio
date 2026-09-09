import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const lineMat = () => new THREE.LineBasicMaterial({
  color: 0xdfe7ee, transparent: true, opacity: 0.85, depthTest: false,
});
const arrowMat = () => new THREE.MeshBasicMaterial({
  color: 0xdfe7ee, depthTest: false,
});

// Cadre de tolérance : [symbole, valeurs..., datums]
export function toleranceFrame(symbol, values, anchor, labelPos) {
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
  const obj = new CSS2DObject(el);
  obj.position.copy(labelPos);
  const geo = new THREE.BufferGeometry().setFromPoints([anchor, labelPos]);
  const line = new THREE.Line(geo, lineMat());
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 7, 12), arrowMat());
  cone.position.copy(anchor);
  cone.lookAt(labelPos); cone.rotateX(Math.PI / 2);
  line.renderOrder = cone.renderOrder = 10;
  return [line, cone, obj];
}

// Datum : triangle plein + cadre lettré
export function datum(letter, anchor, offset) {
  const tri = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 8, 3), arrowMat());
  const p = anchor.clone().add(offset);
  tri.position.copy(p);
  tri.lookAt(anchor); tri.rotateX(-Math.PI / 2);
  const el = document.createElement("div");
  el.className = "gdnt-datum"; el.textContent = letter;
  const box = new CSS2DObject(el);
  box.position.copy(p.clone().add(offset));
  const line = new THREE.Line(new THREE.BufferGeometry()
    .setFromPoints([p, p.clone().add(offset)]), lineMat());
  return [tri, line, box];
}

// Cote : ligne + flèches + texte
export function cote(p1, p2, text, offset = new THREE.Vector3(0, 0, 0)) {
  const a = p1.clone().add(offset), b = p2.clone().add(offset);
  const pts = [a, b, p1, a, p2, b].map(v => v.clone());
  const geo = new THREE.BufferGeometry().setFromPoints(
    [a, b, p1, a, p2, b]);
  const line = new THREE.LineSegments(geo, lineMat());
  const el = document.createElement("div");
  el.className = "gdnt-cote"; el.textContent = text;
  const label = new CSS2DObject(el);
  label.position.copy(a.clone().add(b).multiplyScalar(0.5));
  return [line, label];
}

export function buildFTA(scene) {
  const g = new THREE.Group();
  // Datum A : face de pose (dessous semelle)
  g.add(...datum("A", new THREE.Vector3(-30, 0, 20),
    new THREE.Vector3(0, -14, 0)));
  // Datum B : flanc droit
  g.add(...datum("B", new THREE.Vector3(60, 6, 20),
    new THREE.Vector3(16, 0, 0)));
  // Position de l'alésage Ø40 H7
  g.add(...toleranceFrame("⌖", ["Ø0.05", "A", "B"],
    new THREE.Vector3(28, 42, -26), new THREE.Vector3(78, 66, -20)));
  // Perpendicularité du montant / A
  g.add(...toleranceFrame("⊥", ["0.02", "A"],
    new THREE.Vector3(20, 72, -33), new THREE.Vector3(40, 86, -33)));
  // Planéité face semelle
  g.add(...toleranceFrame("⏥", ["0.05"],
    new THREE.Vector3(-20, 12, 30), new THREE.Vector3(-58, 26, 30)));
  // Cotes
  g.add(...cote(new THREE.Vector3(-60, 0, 40), new THREE.Vector3(60, 0, 40),
    "120 ±0.1", new THREE.Vector3(0, -8, 10)));
  g.add(...cote(new THREE.Vector3(60, 0, -40), new THREE.Vector3(60, 0, 40),
    "80", new THREE.Vector3(14, 0, 0)));
  g.add(...cote(new THREE.Vector3(-50, 0, 30), new THREE.Vector3(50, 0, 30),
    "4 × Ø9", new THREE.Vector3(0, -4, 22)));
  scene.add(g);
}
