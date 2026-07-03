import * as THREE from "three";

// Renders the SpeakSmart logo as a cloud of ~9k particles that breathe,
// follow the mouse, and disperse as the user scrolls out of the hero.
export async function initParticles(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 9;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const points = await buildLogoPoints();
  scene.add(points);

  // Offset the logo to the right so it composes with the left-aligned hero text
  const group = new THREE.Group();
  scene.remove(points);
  group.add(points);
  scene.add(group);

  const state = {
    mouse: new THREE.Vector2(0, 0),
    targetMouse: new THREE.Vector2(0, 0),
    scroll: 0, // 0 = top of page, 1 = hero fully scrolled away
    time: 0,
  };

  window.addEventListener("pointermove", (e) => {
    state.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // On narrow screens center the logo behind the text; on wide, push right
    const wide = w / h > 1.1;
    group.position.x = wide ? 2.6 : 0;
    group.scale.setScalar(wide ? 1 : 0.75);
    points.material.userData.baseOpacity = wide ? 0.95 : 0.28;
  }
  resize();
  window.addEventListener("resize", resize);

  const positions = points.geometry.attributes.position;
  const base = positions.array.slice(); // pristine copy
  const rand = points.geometry.attributes.aRand.array;

  const clock = new THREE.Clock();

  function tick() {
    const t = clock.getElapsedTime();
    state.mouse.lerp(state.targetMouse, 0.06);

    const arr = positions.array;
    const disperse = state.scroll; // 0..1
    for (let i = 0; i < arr.length; i += 3) {
      const r = rand[i / 3];
      // gentle breathing noise
      const nx = Math.sin(t * 0.8 + r * 12.0) * 0.045;
      const ny = Math.cos(t * 0.7 + r * 9.0) * 0.045;
      const nz = Math.sin(t * 0.9 + r * 7.0) * 0.14;
      // scroll dispersal: particles fly outward along their own direction
      const dx = base[i] * disperse * (1.5 + r);
      const dy = base[i + 1] * disperse * (1.5 + r);
      arr[i] = base[i] + nx + dx;
      arr[i + 1] = base[i + 1] + ny + dy;
      arr[i + 2] = base[i + 2] + nz - disperse * r * 4.0;
    }
    positions.needsUpdate = true;

    // mouse parallax + slow idle sway
    group.rotation.y = state.mouse.x * 0.35 + Math.sin(t * 0.25) * 0.06;
    group.rotation.x = -state.mouse.y * 0.25 + Math.cos(t * 0.2) * 0.04;
    points.material.opacity = Math.max(0, points.material.userData.baseOpacity * (1 - disperse * 1.2));

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  tick();

  return {
    setScroll(v) {
      state.scroll = THREE.MathUtils.clamp(v, 0, 1);
    },
  };
}

// Draw the logo image to an offscreen canvas and sample the dark mark
// (ignoring the light background) into 3D points colored from the pixels.
async function buildLogoPoints() {
  const img = await loadImage("/assets/speaksmart_logo.svg");
  const size = 220;
  const c = document.createElement("canvas");
  // preserve aspect ratio, fit inside a square
  const scale = size / Math.max(img.width, img.height);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  c.width = c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  const data = ctx.getImageData(0, 0, size, size).data;

  const positions = [];
  const colors = [];
  const rands = [];
  const tmp = new THREE.Color();

  const step = 1; // sample every pixel
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const i = (y * size + x) * 4;
      if (data[i + 3] < 120) continue; // transparent
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 200) continue; // skip the light cream background
      // Map pixel to world space, centered, y flipped
      const px = (x / size - 0.5) * 6.4;
      const py = -(y / size - 0.5) * 6.4;
      const pz = (Math.random() - 0.5) * 0.5;
      positions.push(px + (Math.random() - 0.5) * 0.02, py + (Math.random() - 0.5) * 0.02, pz);
      tmp.setRGB(r / 255, g / 255, b / 255).offsetHSL(0, 0.05, (Math.random() - 0.5) * 0.08);
      colors.push(tmp.r, tmp.g, tmp.b);
      rands.push(Math.random());
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute("aRand", new THREE.Float32BufferAttribute(rands, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
