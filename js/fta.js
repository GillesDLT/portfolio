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
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // 1) Repère A : face d'appui de la bride (face avant du disque)
  g.add(...datum("A", V(-46, 20, 26), V(-12, 0, 24)));

  // 2) Repère B : alésage central Ø30 (au fond du contrelamage)
  g.add(...datum("B", V(11, -11, 40), V(14, -14, 12)));

  // 3) Batement circulaire du pilote Ø70 (ISO 1101)
  g.add(...toleranceFrame("↗", ["0.05", "A", "B"],
    V(0, 35, 33), V(40, 74, 44)));

  // 4) Position du trou vertical du bloc
  g.add(...toleranceFrame("⌖", ["Ø0.2", "A", "B"],
    V(20, 42, -30), V(64, 86, -38)));

  // 5) Position du trou latéral contrelamé
  g.add(...toleranceFrame("⌖", ["Ø0.25", "A", "B"],
    V(46, 24, -30), V(98, 44, -30)));

  // 6) Ajustement ISO 286 de l'alésage
  g.add(...cote(V(-15, 0, 40), V(15, 0, 40), "Ø30 H7", V(0, -36, 14)));

  scene.add(g);
}
