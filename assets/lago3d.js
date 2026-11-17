/* Il lago dall'alto: modello 3D illustrativo del cratere del lago Albano con Castel Gandolfo.
   Si carica solo quando la sezione sta per comparire; si ferma quando esce dallo schermo. */
import * as THREE from "./vendor/three-r160.module.min.js";

const root = document.getElementById("lago3d");
const stage = root.querySelector(".l3-stage");
const canvas = stage.querySelector("canvas");
const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" }); }
catch (e) { root.classList.add("l3-off"); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x2c2a45, 9, 22);
const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

/* ---- forma del cratere (1 unità ≈ 1 km, rilievo esagerato) ---- */
const ROT = -0.55, A = 1.8, B = 1.2;                 // lago ellittico, orientato NW–SE
const ell = (x, z) => { const c = Math.cos(ROT), s = Math.sin(ROT); const u = x * c - z * s, v = x * s + z * c; return Math.hypot(u / A, v / B); };
const n2 = (x, z) => Math.sin(x * 1.7 + 1.3) * Math.cos(z * 1.9) * 0.08 + Math.sin(x * 4.1 - z * 3.3) * 0.035 + Math.cos(x * 7.3 + z * 6.1) * 0.015;
const CAVO = new THREE.Vector2(3.9, 2.1);            // Monte Cavo a est–sud-est
function height(x, z) {
  const r = ell(x, z);
  let h;
  if (r < 1) h = -0.3 + r * 0.26;
  else if (r < 1.7) { const t = (r - 1) / 0.7; h = -0.04 + (1 - Math.pow(1 - t, 2.2)) * 0.82; }
  else h = 0.78 - Math.min(1, (r - 1.7) / 2.4) * 0.6;
  const dc = Math.hypot(x - CAVO.x, z - CAVO.y); h += Math.max(0, 1.6 - dc * 0.6) * 0.62;
  return h + n2(x, z) * (r > 1 ? 1 : 0.3);
}
const SIZE = 14, SEG = 180;
const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); g.rotateX(-Math.PI / 2);
const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
const cLow = new THREE.Color(0x5d7a45), cHigh = new THREE.Color(0x2f4d2c), cRock = new THREE.Color(0x8a7d62), cShore = new THREE.Color(0x6f6a4a), tmp = new THREE.Color();
for (let i = 0; i < pos.count; i++) {
  const x = pos.getX(i), z = pos.getZ(i), h = height(x, z); pos.setY(i, h);
  const r = ell(x, z);
  if (r < 1.01) tmp.copy(cShore); else tmp.copy(cLow).lerp(cHigh, Math.min(1, Math.max(0, (h - 0.2) / 0.9)));
  if (h > 1.35) tmp.lerp(cRock, Math.min(1, (h - 1.35) / 0.5));
  tmp.offsetHSL(0, 0, n2(x * 0.9, z * 0.9) * 0.2);
  col.set([tmp.r, tmp.g, tmp.b], i * 3);
}
g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }));
scene.add(ground);

/* ---- acqua con onde e riflesso del sole ---- */
const wU = { uT: { value: 0 }, uDeep: { value: new THREE.Color() }, uSky: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3(1, 1, 0) }, uGlint: { value: new THREE.Color() }, uCam: { value: new THREE.Vector3() } };
const water = new THREE.Mesh(new THREE.CircleGeometry(2.4, 96).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
  uniforms: wU, transparent: true,
  vertexShader: `varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform float uT; uniform vec3 uDeep,uSky,uSun,uGlint,uCam; varying vec3 vP;
    void main(){
      vec2 p = vP.xz;
      float w = sin(p.x*9.+uT*1.3)*.5 + sin(p.y*11.-uT*1.1)*.5 + sin((p.x+p.y)*17.+uT*2.)*.25;
      vec3 n = normalize(vec3(cos(p.x*9.+uT*1.3)*.06 + cos((p.x+p.y)*17.+uT*2.)*.03, 1., cos(p.y*11.-uT*1.1)*.06));
      vec3 v = normalize(uCam - vP);
      float fr = pow(1. - max(dot(n, v), 0.), 3.);
      vec3 h = normalize(normalize(uSun) + v);
      float sp = pow(max(dot(n, h), 0.), 180.) * 1.6;
      vec3 c = mix(uDeep, uSky, fr*.7 + .12) + uGlint * sp + w*.012;
      gl_FragColor = vec4(c, .94);
    }`
}));
water.position.y = -0.02; water.scale.set(A / 2.4 * 1.07, 1, B / 2.4 * 1.07); water.rotation.y = -ROT;
scene.add(water);

/* ---- paesi sul bordo (Castel Gandolfo a ovest) con finestre che si accendono di notte ---- */
const houses = new THREE.InstancedMesh(new THREE.BoxGeometry(0.032, 0.032, 0.032), new THREE.MeshStandardMaterial({ color: 0xd9c9a8, roughness: 0.85, emissive: 0xffb45e, emissiveIntensity: 0 }), 260);
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3();
let k = 0; const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
function town(angle, spread, count) {
  for (let i = 0; i < count && k < 260; i++, k++) {
    const a = angle + (rnd() - 0.5) * spread, rr = 1.45 + rnd() * 0.35;
    const c = Math.cos(-ROT), s = Math.sin(-ROT), u = Math.cos(a) * A * rr, v = Math.sin(a) * B * rr;
    const x = u * c - v * s, z = u * s + v * c;
    pv.set(x, height(x, z) + 0.02, z); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 3);
    const hh = 0.6 + rnd() * 1.4; sc.set(0.8 + rnd(), hh, 0.8 + rnd());
    m4.compose(pv, q, sc); houses.setMatrixAt(k, m4);
  }
}
const PIN_A = Math.PI * 0.93;                         // bordo ovest: Castel Gandolfo
town(PIN_A, 0.6, 120); town(Math.PI * 0.42, 0.4, 40); town(Math.PI * 1.55, 0.35, 36);
houses.count = k; scene.add(houses);

/* ---- segnaposto Pio XI ---- */
const pinPos = (() => { const rr = 1.5, c = Math.cos(-ROT), s = Math.sin(-ROT), u = Math.cos(PIN_A) * A * rr, v = Math.sin(PIN_A) * B * rr; const x = u * c - v * s, z = u * s + v * c; return new THREE.Vector3(x, height(x, z), z); })();
const pin = new THREE.Group();
const gold = new THREE.MeshStandardMaterial({ color: 0xf0c178, emissive: 0xf0a040, emissiveIntensity: 0.5, roughness: 0.35, metalness: 0.3 });
const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), gold); head.position.y = 0.42;
const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 24), gold); tip.rotation.x = Math.PI; tip.position.y = 0.24;
const ring = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.11, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf0c178, transparent: true, side: THREE.DoubleSide }));
ring.position.y = 0.03; pin.add(head, tip, ring); pin.position.copy(pinPos); scene.add(pin);

/* ---- luci e atmosfere ---- */
const hemi = new THREE.HemisphereLight(0xffffff, 0x334433, 0.8); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2); scene.add(sun);
const MODES = {
  day:    { bg: ["#86bcd9", "#f3e4c6"], fog: 0xcfdde0, hemi: [0xe8f4ff, 0x3a4a32, 1.1], sun: [0xfff4e0, 2.4, [-4, 6, 3]], deep: 0x2a6f7c, sky: 0xbfe0ea, glint: 0xffffff, win: 0, exp: 1.0 },
  sunset: { bg: ["#2c2a45", "#f0a35e"], fog: 0x7a5a64, hemi: [0xffc9a0, 0x2a2638, 0.75], sun: [0xffa765, 2.6, [-6, 1.6, -1]], deep: 0x1f5562, sky: 0xd99c72, glint: 0xffd29a, win: 0.35, exp: 1.05 },
  night:  { bg: ["#0a1624", "#2c2a45"], fog: 0x151d30, hemi: [0x8aa6d6, 0x0b0f18, 0.35], sun: [0xbcd2ff, 0.7, [3, 5, -4]], deep: 0x0d2633, sky: 0x31476a, glint: 0xdfe8ff, win: 0.9, exp: 1.1 },
};
let cur = "sunset";
function mode(name) {
  const M = MODES[name]; cur = name;
  stage.style.setProperty("--l3a", M.bg[0]); stage.style.setProperty("--l3b", M.bg[1]);
  scene.fog.color.set(M.fog); hemi.color.set(M.hemi[0]); hemi.groundColor.set(M.hemi[1]); hemi.intensity = M.hemi[2];
  sun.color.set(M.sun[0]); sun.intensity = M.sun[1]; sun.position.set(...M.sun[2]);
  wU.uDeep.value.set(M.deep); wU.uSky.value.set(M.sky); wU.uGlint.value.set(M.glint); wU.uSun.value.copy(sun.position);
  houses.material.emissiveIntensity = M.win; renderer.toneMappingExposure = M.exp;
  stage.dataset.mode = name;
  root.querySelectorAll("[data-m]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.m === name)));
  kick();
}
root.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => mode(b.dataset.m)));

/* ---- etichette HTML agganciate alla scena ---- */
const labels = [...stage.querySelectorAll(".l3-lb [data-at]")].map(el => {
  const at = el.dataset.at, p = at === "pin" ? pinPos.clone().add(new THREE.Vector3(0, 0.62, 0))
    : at === "lake" ? new THREE.Vector3(0.2, 0.15, 0.1)
    : at === "cavo" ? new THREE.Vector3(CAVO.x, height(CAVO.x, CAVO.y) + 0.25, CAVO.y)
    : new THREE.Vector3(-5.6, 0.5, -3.6);   // Roma, verso nord-ovest
  return { el, p };
});
const v3 = new THREE.Vector3();
function placeLabels(w, h) {
  for (const L of labels) {
    v3.copy(L.p).project(cam);
    const hidden = v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05;
    L.el.style.opacity = hidden ? 0 : 1;
    const px = Math.min(w - L.el.offsetWidth / 2 - 8, Math.max(L.el.offsetWidth / 2 + 8, (v3.x * 0.5 + 0.5) * w));
    L.el.style.transform = `translate(${px}px,${(-v3.y * 0.5 + 0.5) * h}px) translate(-50%,-100%)`;
  }
}

/* ---- camera: gira da sola piano, trascinate in orizzontale per girarla ---- */
let az = 2.35, targetAz = az, auto = !RM, w = 0, h = 0;
function size() {
  w = stage.clientWidth; h = stage.clientHeight; renderer.setSize(w, h, false);
  cam.aspect = w / h; const portrait = w / h < 1; cam.fov = portrait ? 50 : 36; cam.updateProjectionMatrix();
  dist = portrait ? 9.4 : 7.6; kick();
}
let dist = 7.4;
let drag = null;
canvas.addEventListener("pointerdown", e => { drag = { x: e.clientX, az: targetAz }; auto = false; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointermove", e => { if (!drag) return; targetAz = drag.az - (e.clientX - drag.x) * 0.008; kick(); });
const end = () => { drag = null; setTimeout(() => { if (!drag && !RM) auto = true; }, 4000); };
canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);

let visible = false, raf = 0, last = performance.now(), still = 0;
function frame(t) {
  raf = 0; const dt = Math.min(0.05, (t - last) / 1000); last = t;
  if (auto) targetAz += dt * 0.07;
  az += (targetAz - az) * Math.min(1, dt * 6);
  cam.position.set(Math.cos(az) * dist, dist * 0.68, Math.sin(az) * dist); cam.lookAt(0.3, 0, 0.1);
  wU.uT.value = t / 1000; wU.uCam.value.copy(cam.position);
  const pulse = (t / 1600) % 1; ring.scale.setScalar(1 + pulse * 3.5); ring.material.opacity = 1 - pulse;
  head.position.y = 0.42 + Math.sin(t / 500) * (RM ? 0 : 0.025);
  renderer.render(scene, cam); placeLabels(w, h);
  if (visible && (!RM || Math.abs(targetAz - az) > 0.001 || still++ < 2)) raf = requestAnimationFrame(frame);
}
function kick() { if (visible && !raf) { still = 0; last = performance.now(); raf = requestAnimationFrame(frame); } }
new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }, { rootMargin: "100px" }).observe(stage);
new ResizeObserver(size).observe(stage);
document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
size(); mode("sunset"); root.classList.add("l3-on");
