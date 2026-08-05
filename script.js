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
