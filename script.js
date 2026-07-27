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
