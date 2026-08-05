// Brandon Merritt site — shared behavior across all pages
document.addEventListener('DOMContentLoaded', () => {

  // ---- nav scroll state ----
  const nav = document.querySelector('.site-nav');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  // ---- mobile nav toggle ----
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.textContent = 'Menu';
    }));
  }

  // ---- reveal on scroll ----
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ---- autoplay videos: reinforce on mobile browsers ----
  // Some mobile browsers (especially in-app browsers like Instagram/Messages
  // preview, or iOS in Low Power Mode) ignore the autoplay attribute even when
  // muted. This sets muted via JS (more reliable than the attribute alone),
  // tries to play immediately, and retries silently on the first tap/click
  // anywhere on the page if the initial attempt was blocked.
  const autoplayVideos = document.querySelectorAll('video[autoplay]');
  if (autoplayVideos.length) {
    const tryPlayAll = () => autoplayVideos.forEach(v => {
      v.muted = true;
      v.setAttribute('muted', '');
      v.play().catch(() => {});
    });
    tryPlayAll();
    document.addEventListener('touchstart', tryPlayAll, { once:true, passive:true });
    document.addEventListener('click', tryPlayAll, { once:true });
  }

  // ---- hit counter (matches convention used on the other sites) ----
  const counterEl = document.querySelector('[data-hit-counter]');
  if (counterEl) {
    fetch('https://countapi.mileshilliard.com/api/v1/hit/iambrandonmerritt.com/site-visits')
      .then(r => r.json())
      .then(data => { counterEl.textContent = data.value.toLocaleString(); })
      .catch(() => { counterEl.textContent = '—'; });
  }
});

// ---- rotating 3D shirt viewers (Merch page) ----
// Each [data-shirt-viewer] element gets its own small Three.js scene, using
// data-front / data-back attributes for the textures. Drag to spin, gentle
// idle rotation when not being dragged. Requires three.min.js to be loaded
// on the page before this script runs (see merch.html).
function initShirtViewers() {
  const containers = document.querySelectorAll('[data-shirt-viewer]');
  if (!containers.length || typeof THREE === 'undefined') return;

  containers.forEach((el) => {
    const front = el.getAttribute('data-front');
    const back = el.getAttribute('data-back');
    const width = el.clientWidth;
    const height = el.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(2, 3, 4);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const loader = new THREE.TextureLoader();
    const frontTex = loader.load(front);
    const backTex = loader.load(back);
    [frontTex, backTex].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; });

    const fabricColor = 0x1a1a1a;
    const materials = [
      new THREE.MeshStandardMaterial({ color: fabricColor, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: fabricColor, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: fabricColor, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: fabricColor, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.85 }),
    ];

    const geo = new THREE.BoxGeometry(2.6, 3.0, 0.18);
    const shirt = new THREE.Mesh(geo, materials);
    scene.add(shirt);

    let dragging = false, lastX = 0, lastY = 0;
    let rotY = 0.3, rotX = 0, velY = 0.004;

    function pointerDown(x, y) { dragging = true; lastX = x; lastY = y; velY = 0; }
    function pointerMove(x, y) {
      if (!dragging) return;
      const dx = x - lastX, dy = y - lastY;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
      rotX = Math.max(-0.6, Math.min(0.6, rotX));
      lastX = x; lastY = y;
    }
    function pointerUp() { dragging = false; velY = 0.004; }

    renderer.domElement.addEventListener('mousedown', (e) => pointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => pointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', pointerUp);
    renderer.domElement.addEventListener('touchstart', (e) => { const t = e.touches[0]; pointerDown(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchmove', (e) => { if (!dragging) return; const t = e.touches[0]; pointerMove(t.clientX, t.clientY); }, { passive: true });
    window.addEventListener('touchend', pointerUp);

    function animate() {
      requestAnimationFrame(animate);
      if (!dragging) rotY += velY;
      shirt.rotation.y = rotY;
      shirt.rotation.x = rotX;
      renderer.render(scene, camera);
    }
    animate();
  });
}

document.addEventListener('DOMContentLoaded', initShirtViewers);

// ---- ambient star twinkle canvas (Music page background) ----
function initAmbientStars() {
  const canvas = document.getElementById('ambient-stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
  }
  resize();
  window.addEventListener('resize', resize);

  const STAR_COUNT = 70;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.4 + 0.4,
    phase: Math.random() * Math.PI * 2,
    speed: 0.4 + Math.random() * 0.6,
  }));

  function draw(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((s) => {
      const twinkle = reduced ? 0.7 : 0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r * window.devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,245,243,${(0.15 + 0.55 * twinkle).toFixed(2)})`;
      ctx.fill();
    });
    if (!reduced) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

document.addEventListener('DOMContentLoaded', initAmbientStars);

// ---- disintegration effect (Music page character canvas) ----
// Draws the source image, then runs a repeating "erode at the edges, shed
// glowing particles, reform" cycle, plus a slow independent drift so it
// floats at a different rhythm than the background. Degrades gracefully to
// a still image under prefers-reduced-motion.
function initDisintegrationEffect() {
  const canvases = document.querySelectorAll('[data-disintegrate]');
  if (!canvases.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  canvases.forEach((canvas) => {
    const src = canvas.getAttribute('data-src');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      if (reduced) {
        ctx.drawImage(img, 0, 0, W, H);
        return;
      }

      // sample source pixels once to find edge points (opaque pixel with a
      // nearby transparent neighbor) and their color, as particle/erosion seeds
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = W;
      sampleCanvas.height = H;
      const sctx = sampleCanvas.getContext('2d');
      sctx.drawImage(img, 0, 0, W, H);
      let data;
      try {
        data = sctx.getImageData(0, 0, W, H).data;
      } catch (e) {
        ctx.drawImage(img, 0, 0, W, H);
        return; // canvas tainted (e.g. file:// without a server) — just show it static
      }

      const step = 4;
      const edgePoints = [];
      const alphaAt = (x, y) => {
        if (x < 0 || y < 0 || x >= W || y >= H) return 0;
        return data[(y * W + x) * 4 + 3];
      };
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          const a = alphaAt(x, y);
          if (a < 140) continue;
          if (alphaAt(x + step * 2, y) < 40 || alphaAt(x - step * 2, y) < 40 ||
              alphaAt(x, y + step * 2) < 40 || alphaAt(x, y - step * 2) < 40) {
            const i = (y * W + x) * 4;
            edgePoints.push({ x, y, r: data[i], g: data[i + 1], b: data[i + 2] });
          }
        }
      }

      const CYCLE = 7000;
      const driftAmpX = 7, driftAmpY = 5;
      const driftPeriodX = 6400, driftPeriodY = 8200;

      const MAX_PARTICLES = 170;
      const particles = [];
      function spawnParticle(t0) {
        if (!edgePoints.length) return;
        const p = edgePoints[(Math.random() * edgePoints.length) | 0];
        particles.push({
          x: p.x, y: p.y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.3 - Math.random() * 0.6,
          size: 1.6 + Math.random() * 3.6,
          color: `rgb(${p.r},${p.g},${p.b})`,
          born: t0,
          life: 900 + Math.random() * 1400,
        });
      }

      function frame(t) {
        const phase = (t % CYCLE) / CYCLE;
        const erosion = Math.sin(phase * Math.PI); // 0 -> 1 -> 0 across the cycle

        const offsetX = Math.sin(t / driftPeriodX) * driftAmpX;
        const offsetY = Math.cos(t / driftPeriodY) * driftAmpY;

        ctx.clearRect(0, 0, W, H);
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.drawImage(img, 0, 0, W, H);

        // erode: punch soft holes near a subset of edge points, scaled by erosion
        if (erosion > 0.08 && edgePoints.length) {
          ctx.globalCompositeOperation = 'destination-out';
          const holeCount = Math.floor(erosion * 46);
          for (let k = 0; k < holeCount; k++) {
            const p = edgePoints[(Math.random() * edgePoints.length) | 0];
            const r = 3 + erosion * 10 * Math.random();
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
            grad.addColorStop(0, 'rgba(0,0,0,0.9)');
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.restore();

        // spawn new particles proportional to erosion intensity
        if (erosion > 0.15 && particles.length < MAX_PARTICLES) {
          const toSpawn = Math.ceil(erosion * 4);
          for (let k = 0; k < toSpawn; k++) spawnParticle(t);
        }

        // update + draw particles (in the same offset space as the figure)
        ctx.save();
        ctx.translate(offsetX, offsetY);
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          const age = t - p.born;
          if (age > p.life) { particles.splice(i, 1); continue; }
          const lifeFrac = age / p.life;
          p.x += p.vx;
          p.y += p.vy;
          p.vy -= 0.002; // gentle upward accel, ember-like
          const alpha = 1 - lifeFrac;
          ctx.globalAlpha = Math.max(alpha, 0);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    };
    img.src = src;
  });
}

document.addEventListener('DOMContentLoaded', initDisintegrationEffect);
