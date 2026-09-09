import * as THREE from "three";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildPart } from "./part.js";
import { buildFTA } from "./fta.js";

const rad = (d) => (d * Math.PI) / 180;
const R = 420;

export function initCAD(container, canvas, annoEl) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14171c);
  scene.fog = new THREE.Fog(0x14171c, 700, 1600);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const css2d = new CSS2DRenderer({ element: annoEl });
  css2d.domElement.style.position = "absolute";
  css2d.domElement.style.inset = "0";
  css2d.domElement.style.pointerEvents = "none";

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0x8899aa, 0x22262c, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(180, 260, 200);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  const grid = new THREE.GridHelper(1200, 48, 0x2a3038, 0x1d2229);
  grid.position.y = -0.5;
  scene.add(grid);
  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.ShadowMaterial({ opacity: 0.28 })
  );
  sol.rotation.x = -Math.PI / 2;
  sol.receiveShadow = true;
  scene.add(sol);

  scene.add(buildPart());
  buildFTA(scene);

  let rx = -28, ry = -42;
  let azOff = 0, elOff = 0;

  function setPose(rxIn, ryIn) {
    rx = rxIn;
    ry = ryIn;
  }

  let drag = null;
  canvas.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag) return;
    azOff += (e.clientX - drag.x) * 0.4;
    elOff = Math.max(-40, Math.min(60, elOff + (e.clientY - drag.y) * 0.3));
    drag = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener("pointerup", () => { drag = null; });
  canvas.addEventListener("dblclick", () => { azOff = 0; elOff = 0; });

  let vw = 2, vh = 2;
  function resize() {
    const r = canvas.getBoundingClientRect();
    vw = Math.max(2, Math.round(r.width) || container.clientWidth || innerWidth);
    vh = Math.max(2, Math.round(r.height) || container.clientHeight || innerHeight);
    renderer.setSize(vw, vh, false);
    css2d.setSize(vw, vh);
  }
  addEventListener("resize", resize);
  resize();

  (function tick() {
    requestAnimationFrame(tick);
    const az = -ry + azOff;
    const el = Math.min(88, Math.max(1, -rx + elOff));
    camera.position.set(
      R * Math.cos(rad(el)) * Math.sin(rad(az)),
      R * Math.sin(rad(el)),
      R * Math.cos(rad(el)) * Math.cos(rad(az))
    );
    camera.lookAt(0, 25, 0);
    const half = 150;
    camera.left = -half * (vw / vh);
    camera.right = -camera.left;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    css2d.render(scene, camera);
  })();

  return { setPose };
}
