import * as THREE from "three";
import { CSS3DRenderer } from "three/addons/renderers/CSS3DRenderer.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildPart } from "./part.js";
import { buildFTA } from "./fta.js";

const rad = (d) => (d * Math.PI) / 180;
const R = 420;

export function initCAD(container, canvas, annoEl) {
  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(0x0b0e14, 900, 1900);              // fog douce, fond graphite


  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const css3d = new CSS3DRenderer({ element: annoEl });
  css3d.domElement.style.position = "absolute";
  css3d.domElement.style.inset = "0";
  css3d.domElement.style.pointerEvents = "none";

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;          // three r163+ ; sinon laisser et baisser les lights
  scene.add(new THREE.HemisphereLight(0x2c3a52, 0x0b0e14, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.9);   // key un peu plus forte pour compenser l'ambiance sombre
  key.position.set(180, 260, 200);
  key.castShadow = true;
  const rim = new THREE.DirectionalLight(0x7fb0ff, 0.8);   // rim bleu clair, sépare le modèle du fond
  rim.position.set(-220, 140, -180);
  scene.add(rim);
  // fill très faible
  const fill = new THREE.DirectionalLight(0xdfeaf7, 0.25);
  fill.position.set(-100, 80, 220);
  scene.add(fill);

  const grid = new THREE.GridHelper(1200, 48, 0x27476e, 0x1a2334);  // navy lines, light-blue subdivisions
  grid.position.y = -0.5;
  grid.material.transparent = true;
  grid.material.opacity = 0.30;                                     // subtle, "technical drawing" feel
  scene.add(grid);
  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.ShadowMaterial({ opacity: 0.18 })
  );
  sol.rotation.x = -Math.PI / 2;
  sol.receiveShadow = true;
  scene.add(sol);

  const modele = new THREE.Group();
  modele.add(buildPart());
  scene.add(modele);

  const annoPlanes = [null, null, null, null, null, null];   // indices 0..5
  const PLANE_ROT = {
    1: [0,  Math.PI / 2,  0],        // S1 Expériences : droite  (+X)
    2: [0,  0,            0],        // S2 Formations  : face    (+Z)
    3: [-Math.PI / 2, 0,  Math.PI],  // S3 Projets     : dessus
    4: [0,  Math.PI,      0],        // S4 Compétences : arrière (−Z)
    5: [0,  Math.PI,      0],        // S5 le Reste    : arrière (−Z)
  };
  function getAnnoPlane(i) {
    if (!PLANE_ROT[i]) return null;      // section sans plan (ex. ISO)
    if (!annoPlanes[i]) {
      const g = new THREE.Group();
      g.rotation.set(...PLANE_ROT[i]);
      g.visible = false;
      modele.add(g);
      annoPlanes[i] = g;
    }
    return annoPlanes[i];
  }
    /* ---- Fondu des annotations (au lieu d'un on/off) ---- */
  function applyWeight(pl, w) {
    const on = w > 0.002;
    pl.visible = on;
    pl.traverse((o) => {
      if (o.isCSS3DObject) {                       // cadres, datums, cotes (HTML)
        o.visible = on;
        const el = o.element;
        if (el) {
          el.style.opacity = w.toFixed(3);
          if (el.dataset.pe === undefined)
            el.dataset.pe = el.style.pointerEvents === "auto" ? "1" : "";
          if (el.dataset.pe === "1") el.style.pointerEvents = w > 0.6 ? "auto" : "none";
        }
      } else if (o.material) {                     // lignes / triangles THREE
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (m.userData.base === undefined) {
            m.userData.base = m.opacity ?? 1;
            m.transparent = true;
            m.needsUpdate = true;
          }
          m.opacity = m.userData.base * w;
        }
        o.visible = on;
      }
    });
  }

  /* poids 0..1 par section (indexé 1..N) */
  function setSections(weights) {
    annoPlanes.forEach((pl, i) => { if (pl) applyWeight(pl, weights[i] ?? 0); });
  }

  /* compat : une seule section nette (ISO, clic arbre, etc.) */
  function setSection(cur) {
    const w = [];
    for (let i = 0; i < 6; i++) w[i] = i === cur ? 1 : 0;
    setSections(w);
  }

buildFTA(getAnnoPlane);   // au lieu de buildFTA(scene)
  let rx = -28, ry = -42;
  let azOff = 0, elOff = 0;

  function setPose(rxIn, ryIn) {
    rx = rxIn;
    ry = ryIn;
  }

  let vw = 2, vh = 2;
  function resize() {
    const r = canvas.getBoundingClientRect();
    vw = Math.max(2, Math.round(r.width) || container.clientWidth || innerWidth);
    vh = Math.max(2, Math.round(r.height) || container.clientHeight || innerHeight);
    renderer.setSize(vw, vh, false);
    css3d.setSize(vw, vh);
  }
  addEventListener("resize", resize);
  resize();

  const TARGET = new THREE.Vector3(0, 25, 0);   // la caméra orbite autour du point visé

  (function tick() {
    requestAnimationFrame(tick);
    const az = -ry;
    const el = Math.min(88, Math.max(0, -rx));
    camera.position.set(
      TARGET.x + R * Math.cos(rad(el)) * Math.sin(rad(az)),
      TARGET.y + R * Math.sin(rad(el)),
      TARGET.z + R * Math.cos(rad(el)) * Math.cos(rad(az))
    );
    camera.lookAt(TARGET);
    const half = 134;
    camera.left = -half * (vw / vh);
    camera.right = -camera.left;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    css3d.render(scene, camera);
  })();
    function setFog(hex) {
       scene.fog.color.set(hex);
    }
    function setGridFade(w) {
      w = Math.max(0, Math.min(1, w));
      grid.visible = w > 0.01;
      grid.material.opacity = 0.45 * w;   // opacité "technical drawing" d'origine
      sol.material.opacity = 0.18 * w;    // (option) l'ombre au sol suit la grille
    }

    return { setPose, setSection, setSections, setFog, setGridFade };
}
