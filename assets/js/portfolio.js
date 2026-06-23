/* =========================================
   Portfolio - shared scripts
   ========================================= */
(function () {
  'use strict';

  // ---------- Year ----------
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ---------- Burger ----------
  const burger = document.getElementById('burgerBtn');
  const links = document.getElementById('navLinks');
  if (burger && links) {
    burger.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  // ---------- Reveal on scroll ----------
  const reveals = document.querySelectorAll('.pf-reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // ---------- Background particles ----------
  const bg = document.getElementById('bgShapes');
  if (bg) {
    const count = 18;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      const size = 3 + Math.random() * 6;
      dot.style.width = dot.style.height = size + 'px';
      dot.style.left = Math.random() * 100 + '%';
      dot.style.animationDuration = 14 + Math.random() * 14 + 's';
      dot.style.animationDelay = -Math.random() * 14 + 's';
      if (i % 3 === 0) dot.style.background = '#22d3ee';
      bg.appendChild(dot);
    }
  }

  // ---------- Active nav on scroll (in-page) ----------
  const sections = document.querySelectorAll('main section[id]');
  const navItems = document.querySelectorAll('.pf-nav-links a[href^="#"]');
  if (sections.length && navItems.length && 'IntersectionObserver' in window) {
    const map = {};
    navItems.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      if (id) map[id] = a;
    });
    const so = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.id;
        if (entry.isIntersecting && map[id]) {
          navItems.forEach(a => a.classList.remove('active'));
          map[id].classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach(s => so.observe(s));
  }
})();
