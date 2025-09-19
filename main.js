import * as THREE from 'https://esm.sh/three@0.159.0';
import { EffectComposer } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://esm.sh/three@0.159.0/examples/jsm/postprocessing/UnrealBloomPass.js';

const canvas = document.getElementById('bg');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scene setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0b12, 0.045);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 300);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const pixelRatio = Math.min(window.devicePixelRatio, 1.6);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x090a10, 1);

// Lights (darker, directional highlight for the brain)
const ambient = new THREE.AmbientLight(0x8e96bf, 0.30);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0x9fa7e8, 0.85);
dir.position.set(-2.2, 3.8, 2.6);
scene.add(dir);
const rim = new THREE.DirectionalLight(0x73fbd3, 0.25);
rim.position.set(2.5, -1.5, -2.8);
scene.add(rim);

// Root
const root = new THREE.Group();
scene.add(root);

// Colors
const colorA = new THREE.Color(0x8a7efc);
const colorB = new THREE.Color(0x73fbd3);
const colorC = new THREE.Color(0xff7edb);

// ---------- Reactive shader grid (backdrop) ----------
const gridGeom = new THREE.PlaneGeometry(30, 18, 160, 90);
const gridMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uColorA: { value: colorA },
    uColorB: { value: colorB },
    uColorC: { value: colorC },
    uIntensity: { value: 0.6 },
    uAlpha: { value: 0.18 }
  },
  vertexShader: `
    uniform float uTime; uniform vec2 uMouse; 
    varying vec2 vUv; 
    void main() {
      vUv = uv; 
      vec3 pos = position; 
      float d = distance(vUv, uMouse);
      float wave = sin((pos.x*0.7 + pos.y*0.9) * 0.6 + uTime*0.8) * 0.18;
      float ripple = (0.22/(0.15 + d)) * 0.18 * sin(uTime*1.2 - d*16.0);
      pos.z += wave + ripple; 
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv; 
    uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC; 
    uniform float uIntensity; uniform float uAlpha;
    void main() {
      float grid = (sin(vUv.x*80.0) * sin(vUv.y*60.0))*0.5 + 0.5; 
      float glow = smoothstep(0.6, 1.0, grid);
      vec3 grad = mix(uColorA, uColorB, vUv.x);
      grad = mix(grad, uColorC, 0.35 + 0.35 * vUv.y);
      vec3 col = grad * (0.20 + 0.60*glow) * uIntensity; 
      gl_FragColor = vec4(col, uAlpha);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const gridMesh = new THREE.Mesh(gridGeom, gridMat);
gridMesh.position.set(0, 0, -8);
root.add(gridMesh);

// ---------- Phase 0: Central "brain" shader ----------
const brainGroup = new THREE.Group();
root.add(brainGroup);
const brainGeo = new THREE.IcosahedronGeometry(1.25, 5);
const brainMat = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAmp: { value: 1.0 },
    uColorA: { value: new THREE.Color(0xbcaeff) },
    uColorB: { value: new THREE.Color(0x73fbd3) },
    uColorC: { value: new THREE.Color(0xff7edb) }
  },
  vertexShader: `
    uniform float uTime; uniform float uAmp; 
    varying float vRidge; varying vec3 vN; 
    float ridge(vec3 p){
      float n = 0.0;
      n += sin(p.x*3.1 + uTime*0.6)*0.45;
      n += sin(p.y*4.3 - uTime*0.4)*0.35;
      n += sin(p.z*3.7 + uTime*0.5)*0.30;
      n += sin((p.x+p.y)*2.2 - uTime*0.3)*0.25;
      return abs(n);
    }
    void main(){
      vec3 pos = position; 
      pos.x *= 1.02 + 0.06*sin(normal.y*3.0);
      pos.y *= 1.02 + 0.04*cos(normal.x*3.0);
      float r = ridge(normal*2.2 + pos*0.6);
      vRidge = r; vN = normal;
      pos += normal * r * 0.28 * uAmp;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying float vRidge; varying vec3 vN; 
    uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC; 
    void main(){
      float g = smoothstep(0.15, 0.85, vRidge);
      vec3 col = mix(uColorA, uColorB, g);
      col = mix(col, uColorC, smoothstep(0.5, 1.0, g));
      // fake lambert shading for depth
      vec3 L = normalize(vec3(-0.4, 0.8, 0.6));
      float lambert = clamp(dot(normalize(vN), L), 0.0, 1.0);
      col *= 0.35 + 0.75*lambert;
      // soft rim
      float rim = pow(1.0 - abs(dot(normalize(vN), vec3(0.0,0.0,1.0))), 2.0);
      col += rim * 0.20;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
  transparent: true,
});
const brain = new THREE.Mesh(brainGeo, brainMat);
brainGroup.add(brain);
// Wireframe outline for extra definition
const brainWire = new THREE.Mesh(
  brainGeo.clone(),
  new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.10 })
);
brainWire.scale.setScalar(1.004);
brainGroup.add(brainWire);

// ---------- Floating AI terms (sprites) ----------
const AI_TERMS = [
  'LLMs','RAG','Agents','Evals','Fine-tuning','Embeddings','Vector DB','Guardrails','MLOps','Latency','Cost','On-device','Tools','Multi-modal','Knowledge','Planning','Reasoning','Context','Memory','Safety'
];
function createTextSprite(text){
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const pad = 16; const fontSize = 44; const font = `600 ${fontSize}px Inter, system-ui, -apple-system`;
  ctx.font = font; const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width) + pad*2; const h = fontSize + pad*2;
  canvas.width = 512; canvas.height = 128;
  const scale = Math.min((canvas.width-2*pad)/w, (canvas.height-2*pad)/h);
  ctx.scale(scale, scale);
  ctx.font = font; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  const gw = canvas.width/scale; const gh = canvas.height/scale;
  ctx.fillStyle = 'rgba(255,255,255,0.00)';
  ctx.fillRect(0,0,gw,gh);
  ctx.fillStyle = '#DDE1F2';
  ctx.fillText(text, gw/2, gh/2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.2, 0.6, 1);
  return sprite;
}
const labelsGroup = new THREE.Group();
root.add(labelsGroup);
const labelSprites = []; const labelStart = []; let labelTargets = [];
for (let i = 0; i < AI_TERMS.length; i++) {
  const s = createTextSprite(AI_TERMS[i]);
  const angle = (i / AI_TERMS.length) * Math.PI * 2;
  const r = 2.0 + (i%3)*0.16;
  const pos = new THREE.Vector3(Math.cos(angle)*r, Math.sin(angle*2.0)*0.25, Math.sin(angle)*r);
  s.position.copy(pos);
  labelsGroup.add(s);
  labelSprites.push(s);
  labelStart.push(pos.clone());
}

// ---------- Phase 1: Latent particle field ----------
const latentGroup = new THREE.Group();
root.add(latentGroup);
const baseDensity = window.innerWidth < 900 ? 0.7 : 1.0;
const density = prefersReducedMotion ? 0.55 * baseDensity : 1.0 * baseDensity;
const latentCount = Math.round(2000 * density);
const latPos = new Float32Array(latentCount * 3);
const latVel = new Float32Array(latentCount * 3);
for (let i = 0; i < latentCount; i++) {
  const i3 = i*3;
  const r = 2.4 + Math.random()*1.4;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2*Math.random()-1);
  latPos[i3+0] = r * Math.sin(phi) * Math.cos(theta);
  latPos[i3+1] = (Math.random()-0.5)*1.2;
  latPos[i3+2] = r * Math.sin(phi) * Math.sin(theta);
  latVel[i3+0] = (Math.random()-0.5)*0.0035;
  latVel[i3+1] = (Math.random()-0.5)*0.0035;
  latVel[i3+2] = (Math.random()-0.5)*0.0035;
}
const latentGeo = new THREE.BufferGeometry();
latentGeo.setAttribute('position', new THREE.BufferAttribute(latPos, 3));
const latentMat = new THREE.PointsMaterial({ size: 0.023, color: 0xffffff, transparent: true, opacity: 0.85, vertexColors: false, blending: THREE.AdditiveBlending, depthWrite: false });
const latentPoints = new THREE.Points(latentGeo, latentMat);
latentGroup.add(latentPoints);

// ---------- Phase 2: Neural network (layers + packets) ----------
const networkGroup = new THREE.Group();
root.add(networkGroup);
const layerSpecs = [
  { x: -4.0, z: -1.5, count: Math.round(24 * density), radius: 0.95 },
  { x: -1.3, z:  0.0, count: Math.round(38 * density), radius: 1.15 },
  { x:  1.6, z:  0.6, count: Math.round(30 * density), radius: 1.05 },
  { x:  4.0, z:  1.5, count: Math.round(16 * density), radius: 0.85 },
];
function generateLayerPositions(count, centerX, centerZ, radius, jitterY = 0.6) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(Math.random()) * radius;
    const theta = Math.random() * Math.PI * 2;
    const x = centerX + Math.cos(theta) * r;
    const y = (Math.random() - 0.5) * jitterY;
    const z = centerZ + Math.sin(theta) * r;
    positions.push(new THREE.Vector3(x, y, z));
  }
  return positions;
}
const layers = layerSpecs.map(s => generateLayerPositions(s.count, s.x, s.z, s.radius));
const nodeGeo = new THREE.SphereGeometry(0.065, 18, 18);
const nodeMat = new THREE.MeshBasicMaterial({ color: 0xbfc6ee, transparent: true, opacity: 0.75 });
const totalNodes = layers.reduce((acc, l) => acc + l.length, 0);
const nodesMesh = new THREE.InstancedMesh(nodeGeo, nodeMat, totalNodes);
nodesMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
networkGroup.add(nodesMesh);
let nodeIndex = 0;
const nodePositions = [];
const tmpMatrix = new THREE.Matrix4();
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
for (const layer of layers) {
  for (const p of layer) {
    tmpMatrix.makeTranslation(p.x, p.y, p.z);
    nodesMesh.setMatrixAt(nodeIndex++, tmpMatrix);
    nodePositions.push(p.clone());
  }
}
nodesMesh.instanceMatrix.needsUpdate = true;
const connectionProb = 0.24;
const linePositions = [];
const connections = [];
for (let li = 0; li < layers.length - 1; li++) {
  const a = layers[li];
  const b = layers[li + 1];
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (Math.random() < connectionProb) {
        const p1 = a[i]; const p2 = b[j];
        linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        connections.push({ start: p1.clone(), end: p2.clone() });
      }
    }
  }
}
const lineGeo = new THREE.BufferGeometry();
lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(linePositions), 3));
const lineMat = new THREE.LineBasicMaterial({ color: 0x8d95c6, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
const lines = new THREE.LineSegments(lineGeo, lineMat);
networkGroup.add(lines);
const packetCount = Math.max(100, Math.round(connections.length * 0.35));
const packetGeo = new THREE.SphereGeometry(0.042, 12, 12);
const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
const packetsMesh = new THREE.InstancedMesh(packetGeo, packetMat, packetCount);
packetsMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
networkGroup.add(packetsMesh);
const packetState = new Array(packetCount).fill(null).map(() => ({
  edge: Math.floor(Math.random() * Math.max(1, connections.length)),
  t: Math.random(),
  speed: 0.14 + Math.random() * 0.45,
}));

// Map labels to random network node targets
labelTargets = labelSprites.map(() => nodePositions[Math.floor(Math.random()*nodePositions.length)] || new THREE.Vector3());

// ---------- Phase 3: Knowledge graph ----------
const graphGroup = new THREE.Group();
root.add(graphGroup);
const graphNodeCount = Math.round(120 * density);
const graphNodes = [];
for (let i = 0; i < graphNodeCount; i++) {
  const a = Math.random() * Math.PI * 2;
  const b = Math.acos(2*Math.random() - 1);
  const r = 2.0 + Math.random()*1.4;
  graphNodes.push(new THREE.Vector3(
    Math.sin(b)*Math.cos(a)*r,
    Math.cos(b)*0.9,
    Math.sin(b)*Math.sin(a)*r
  ));
}
const graphNodeGeo = new THREE.SphereGeometry(0.055, 16, 16);
const graphNodeMat = new THREE.MeshBasicMaterial({ color: 0xbfc6ee, transparent: true, opacity: 0.7 });
const graphNodesMesh = new THREE.InstancedMesh(graphNodeGeo, graphNodeMat, graphNodeCount);
for (let i = 0; i < graphNodeCount; i++) {
  tmpMatrix.makeTranslation(graphNodes[i].x, graphNodes[i].y, graphNodes[i].z);
  graphNodesMesh.setMatrixAt(i, tmpMatrix);
}
graphNodesMesh.instanceMatrix.needsUpdate = true;
graphGroup.add(graphNodesMesh);
const graphLinesPos = [];
for (let i = 0; i < graphNodeCount; i++) {
  for (let j = i+1; j < graphNodeCount; j++) {
    const d = graphNodes[i].distanceTo(graphNodes[j]);
    if (d < 1.5 && Math.random() < 0.2) {
      const a = graphNodes[i], b = graphNodes[j];
      graphLinesPos.push(a.x,a.y,a.z,b.x,b.y,b.z);
    }
  }
}
const graphLineGeo = new THREE.BufferGeometry();
graphLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(graphLinesPos), 3));
const graphLineMat = new THREE.LineBasicMaterial({ color: 0x9aa3cf, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
const graphLines = new THREE.LineSegments(graphLineGeo, graphLineMat);
graphGroup.add(graphLines);

// Camera and post
camera.position.set(-0.7, 0.4, 7.2);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.8, 0.85);
bloom.threshold = 0.0; bloom.strength = 0.55; bloom.radius = 0.45;
composer.addPass(bloom);

// Interaction
const pointer = new THREE.Vector2();
let targetRotX = 0; let targetRotY = 0;
window.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  targetRotX = pointer.y * 0.22;
  targetRotY = pointer.x * 0.32;
  gridMat.uniforms.uMouse.value.set((pointer.x+1)/2, (1-pointer.y)/2);
});

// Scroll progress
let scrollProgress = 0;
function updateScrollProgress() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  scrollProgress = Math.min(1, Math.max(0, (window.scrollY || window.pageYOffset) / maxScroll));
}
window.addEventListener('scroll', updateScrollProgress);
updateScrollProgress();

// Tab visibility
let isActive = true;
document.addEventListener('visibilitychange', () => { isActive = !document.hidden; });

function smoothstep(edge0, edge1, x){ x = Math.min(1, Math.max(0, (x-edge0)/(edge1-edge0))); return x*x*(3-2*x); }

// Animate
const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();

  gridMat.uniforms.uTime.value = t;
  gridMesh.rotation.z = Math.sin(t*0.05)*0.02;

  if (!prefersReducedMotion) {
    root.rotation.y += 0.0013;
    root.position.y = Math.sin(t * 0.4) * 0.045;
  }
  root.rotation.y += (targetRotY - root.rotation.y) * 0.03;
  root.rotation.x += (targetRotX - root.rotation.x) * 0.03;

  // Phase weights
  const wBrain  = 1.0 - smoothstep(0.12, 0.28, scrollProgress);
  const wLatent = smoothstep(0.05, 0.22, scrollProgress) * (1.0 - smoothstep(0.35, 0.5, scrollProgress));
  const wNet    = smoothstep(0.20, 0.45, scrollProgress) * (1.0 - smoothstep(0.65, 0.85, scrollProgress));
  const wGraph  = smoothstep(0.70, 0.90, scrollProgress);

  // Camera & bloom with scroll (dim bloom when focusing brain)
  camera.position.z = 7.2 - (scrollProgress * 2.6);
  camera.position.x = -0.7 + scrollProgress * 0.9;
  camera.position.y = 0.4 + Math.sin(scrollProgress * Math.PI) * 0.32;
  bloom.strength = 0.45 + (1.0 - wBrain) * (0.55 * scrollProgress);

  // Backdrop intensity/alpha reduce near brain
  gridMat.uniforms.uIntensity.value = 0.45 + 0.35 * (1.0 - wBrain) + 0.2 * (wNet + wGraph);
  gridMat.uniforms.uAlpha.value = 0.10 + 0.25 * (1.0 - wBrain);

  // Brain primary
  brainMat.uniforms.uTime.value = t;
  brainMat.uniforms.uAmp.value  = 0.8 + 0.35*Math.sin(t*0.8);
  brainGroup.visible = wBrain > 0.02;
  brain.material.opacity = 0.95;
  brainWire.visible = brainGroup.visible;
  brainWire.material.opacity = 0.06 + 0.10 * wBrain;

  // Labels morph + subdued when brain
  const wAttach = smoothstep(0.32, 0.52, scrollProgress);
  const wLabelAlpha = (1.0 - smoothstep(0.62, 0.78, scrollProgress)) * (0.85 - 0.35 * wBrain);
  for (let i = 0; i < labelSprites.length; i++) {
    const start = labelStart[i];
    const target = labelTargets[i] || start;
    const pos = start.clone().lerp(target, wAttach);
    pos.y += Math.sin(t*1.1 + i*0.6) * 0.05 * (1.0 - wAttach);
    labelSprites[i].position.copy(pos);
    labelSprites[i].material.opacity = Math.max(0, wLabelAlpha);
    labelSprites[i].scale.setScalar(1.0 + 0.12*Math.sin(t + i));
  }
  labelsGroup.visible = (wBrain + wLatent + wNet) > 0.02;

  // Latent dynamics (dimmed)
  if (!prefersReducedMotion && (wLatent > 0.01 || wBrain > 0.01)) {
    const pos = latentGeo.attributes.position.array;
    for (let i = 0; i < latentCount; i++) {
      const i3 = i*3;
      const x = pos[i3+0], y = pos[i3+1], z = pos[i3+2];
      const curlX = Math.sin(0.8*x + 0.6*z + t*0.8);
      const curlY = Math.cos(0.7*y + 0.5*x + t*0.7);
      const curlZ = Math.sin(0.6*z + 0.7*y + t*0.9);
      latVel[i3+0] += curlX * 0.0007; 
      latVel[i3+1] += curlY * 0.0007; 
      latVel[i3+2] += curlZ * 0.0007; 
      pos[i3+0] += latVel[i3+0];
      pos[i3+1] += latVel[i3+1];
      pos[i3+2] += latVel[i3+2];
      const d = Math.sqrt(pos[i3]*pos[i3] + pos[i3+1]*pos[i3+1] + pos[i3+2]*pos[i3+2]);
      if (d > 5.0) { pos[i3] *= 0.965; pos[i3+1] *= 0.965; pos[i3+2] *= 0.965; }
    }
    latentGeo.attributes.position.needsUpdate = true;
  }
  latentGroup.visible = (wLatent + wBrain) > 0.02;
  latentMat.opacity = 0.06 + 0.50 * Math.max(wLatent*0.8, wBrain*0.4);

  // Network: keep subdued until later
  let idx = 0;
  for (const p of nodePositions) {
    const pulse = 1 + (prefersReducedMotion ? 0 : (Math.sin(t * 1.8 + idx * 0.15) * 0.05 * (0.6 + scrollProgress)));
    tmpScale.setScalar(pulse);
    tmpQuat.set(0, 0, 0, 1);
    tmpMatrix.compose(p, tmpQuat, tmpScale);
    nodesMesh.setMatrixAt(idx, tmpMatrix);
    idx++;
  }
  nodesMesh.instanceMatrix.needsUpdate = true;
  const visiblePackets = Math.floor(packetCount * (0.20 + 0.80 * wNet));
  for (let i = 0; i < packetCount; i++) {
    const st = packetState[i];
    if (i > visiblePackets) { tmpMatrix.makeTranslation(0, -999, 0); packetsMesh.setMatrixAt(i, tmpMatrix); continue; }
    st.t += st.speed * (prefersReducedMotion ? 0.2 : 0.6 + scrollProgress * 1.1) * 0.016;
    if (st.t >= 1) { st.t = 0; st.edge = Math.floor(Math.random() * Math.max(1, connections.length)); st.speed = 0.14 + Math.random()*0.45; }
    const edge = connections[st.edge]; if (!edge) continue;
    tmpPos.copy(edge.start).lerp(edge.end, st.t);
    tmpQuat.set(0,0,0,1); tmpScale.setScalar(1.0 + Math.sin((st.t + t) * 6.28) * 0.18);
    tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
    packetsMesh.setMatrixAt(i, tmpMatrix);
  }
  packetsMesh.instanceMatrix.needsUpdate = true;
  lineMat.opacity = 0.12 + 0.30 * wNet;
  nodeMat.opacity = 0.20 + 0.55 * wNet;
  packetMat.opacity = 0.18 + 0.75 * wNet;
  networkGroup.visible = wNet > 0.02;

  // Graph
  if (!prefersReducedMotion) {
    for (let i = 0; i < graphNodeCount; i++) {
      const base = graphNodes[i];
      const offset = Math.sin(t*0.8 + i*0.17) * 0.03;
      tmpMatrix.makeTranslation(base.x * (1.0 + offset*0.02), base.y * (1.0 + offset*0.02), base.z * (1.0 + offset*0.02));
      graphNodesMesh.setMatrixAt(i, tmpMatrix);
    }
    graphNodesMesh.instanceMatrix.needsUpdate = true;
  }
  graphLineMat.opacity = 0.10 + 0.28 * wGraph;
  graphNodeMat.opacity = 0.18 + 0.60 * wGraph;
  graphGroup.visible = wGraph > 0.02;

  if (isActive) composer.render();
  requestAnimationFrame(animate);
}

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Smooth anchor scrolling and active nav
const links = document.querySelectorAll('.nav a[href^="#"]');
for (const a of links) {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href'); if (!href) return;
    const el = document.querySelector(href); if (!el) return;
    e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const id = entry.target.getAttribute('id'); if (!id) continue;
    const link = document.querySelector(`.nav a[href="#${id}"]`); if (!link) continue;
    if (entry.isIntersecting) { document.querySelectorAll('.nav a').forEach(el => el.classList.remove('active')); link.classList.add('active'); }
  }
}, { threshold: 0.5 });
['hero','services','cases','approach','contact'].forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });

// Year
const year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();

// WebGL check
function isWebGLAvailable() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
}
if (!isWebGLAvailable()) {
  const fallback = document.createElement('div');
  fallback.style.position = 'fixed'; fallback.style.inset = '0';
  fallback.style.background = 'radial-gradient(1000px 800px at 20% 10%, #0a0b13 0%, #090a10 45%, #07070d 100%)';
  document.body.appendChild(fallback);
} else {
  animate();
}
