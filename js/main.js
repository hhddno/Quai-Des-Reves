(function () {
  'use strict';

  const header = document.getElementById('header');
  const hero = document.getElementById('hero');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const scrollProgress = document.getElementById('scrollProgress');
  const reservationForm = document.getElementById('reservationForm');
  const reviewsInner = document.getElementById('reviewsInner');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const gallery = document.getElementById('gallery');

  let currentImageIndex = 0;
  let galleryImages = [];

  const sections = [...document.querySelectorAll('section[id]')];
  const navAnchors = navLinks ? [...navLinks.querySelectorAll('a[href^="#"]')] : [];

  document.body.classList.add('is-loaded');

  /* ---- Scroll progress ---- */
  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = progress + '%';
  }

  /* ---- Header scroll behavior ---- */
  function updateHeader() {
    if (!hero || !header) return;
    const heroBottom = hero.offsetHeight;
    const scrolled = window.scrollY > 60;

    header.classList.toggle('header--scrolled', scrolled);
    header.classList.toggle('header--hero', window.scrollY < heroBottom - 100);
  }

  function updateActiveNav() {
    const scrollPos = window.scrollY + 120;
    let current = '';

    sections.forEach(section => {
      if (scrollPos >= section.offsetTop) current = section.id;
    });

    navAnchors.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      a.classList.toggle('is-active', id === current);
    });
  }

  function updateHeroParallax() {
    if (!hero) return;
    const scrollY = window.scrollY;
    if (scrollY >= hero.offsetHeight) return;
    const img = hero.querySelector('.hero__bg img');
    const content = hero.querySelector('.hero__content');
    if (img) img.style.transform = `scale(1.08) translateY(${scrollY * 0.35}px)`;
    if (content) {
      content.style.transform = `translateY(${scrollY * 0.15}px)`;
      content.style.opacity = String(1 - scrollY / (hero.offsetHeight * 0.8));
    }
  }

  function onScroll() {
    updateHeader();
    updateScrollProgress();
    updateActiveNav();
    updateHeroParallax();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile navigation ---- */
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- Scroll reveal (unified) ---- */
  const animatedEls = document.querySelectorAll('.reveal, .reveal-scale, .reveal-stagger, .section__header, .rating');
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('rating')) animateRating(entry.target);
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  animatedEls.forEach(el => revealObserver.observe(el));

  /* Gallery stagger: observe parent then children */
  if (gallery) {
    const galleryObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          entry.target.querySelectorAll('.reveal-scale').forEach((item, i) => {
            item.style.transitionDelay = (i * 0.06) + 's';
            item.classList.add('visible');
          });
          galleryObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08 }
    );
    galleryObserver.observe(gallery);
  }

  /* ---- Rating counter ---- */
  function animateRating(el) {
    const numEl = el.querySelector('.rating__number');
    if (!numEl) return;
    const target = parseInt(numEl.dataset.count, 10) || 5;
    const duration = 800;
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      numEl.textContent = Math.round(eased * target);
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* ---- Card tilt effect ---- */
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.classList.add('is-tilting');
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-tilting');
      card.style.transform = '';
    });
  });

  /* ---- Reviews infinite scroll ---- */
  if (reviewsInner) {
    reviewsInner.innerHTML = reviewsInner.innerHTML + reviewsInner.innerHTML;
  }

  /* ---- Gallery lightbox ---- */
  const galleryItems = document.querySelectorAll('.gallery__item');
  galleryImages = Array.from(galleryItems).map(item => ({
    src: item.querySelector('img').src,
    alt: item.querySelector('img').alt
  }));

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightbox(index));
  });

  function openLightbox(index) {
    currentImageIndex = index;
    lightboxImg.src = galleryImages[index].src;
    lightboxImg.alt = galleryImages[index].alt;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function navigateLightbox(direction) {
    currentImageIndex = (currentImageIndex + direction + galleryImages.length) % galleryImages.length;
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = galleryImages[currentImageIndex].src;
      lightboxImg.alt = galleryImages[currentImageIndex].alt;
      lightboxImg.style.opacity = '1';
    }, 150);
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
  lightboxNext.addEventListener('click', () => navigateLightbox(1));

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });

  lightboxImg.style.transition = 'opacity 0.2s ease';

  /* ---- Reservation form ---- */
  if (reservationForm) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('arrivee').min = today;
    document.getElementById('depart').min = today;

    document.getElementById('arrivee').addEventListener('change', function () {
      document.getElementById('depart').min = this.value;
    });

    reservationForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const nom = document.getElementById('nom').value;
      const email = document.getElementById('email').value;
      const telephone = document.getElementById('telephone').value;
      const arrivee = document.getElementById('arrivee').value;
      const depart = document.getElementById('depart').value;
      const chambre = document.getElementById('chambre');
      const personnes = document.getElementById('personnes').value;
      const petitdej = document.getElementById('petitdej').checked;
      const message = document.getElementById('message').value;

      const chambreMap = {
        indifferent: 'Indifférent',
        chambre1: 'Chambre 1 — 50 €',
        chambre2: 'Chambre 2 — 50 €'
      };

      const body = [
        'Bonjour Marie-Claire,',
        '',
        'Je souhaiterais réserver une nuitée au Quai des Rêves.',
        '',
        `Nom : ${nom}`,
        `Email : ${email}`,
        telephone ? `Téléphone : ${telephone}` : '',
        `Arrivée : ${formatDate(arrivee)}`,
        `Départ : ${formatDate(depart)}`,
        `Chambre : ${chambreMap[chambre.value] || chambre.options[chambre.selectedIndex].text}`,
        `Personnes : ${personnes}`,
        petitdej ? 'Petit-déjeuner : Oui (7,50 € / personne)' : 'Petit-déjeuner : Non',
        message ? `\nMessage :\n${message}` : '',
        '',
        'Merci et à bientôt !'
      ].filter(Boolean).join('\n');

      const subject = encodeURIComponent(`Réservation — ${nom} — ${formatDate(arrivee)}`);
      window.location.href = `mailto:marieclairepaul57@gmail.com?subject=${subject}&body=${encodeURIComponent(body)}`;
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  /* ---- FAQ: one open at a time ---- */
  document.querySelectorAll('.faq__item').forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        document.querySelectorAll('.faq__item').forEach(other => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ---- Subtle magnetic buttons ---- */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  onScroll();

})();
