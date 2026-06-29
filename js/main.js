(function () {
  'use strict';

  const header = document.getElementById('header');
  const hero = document.getElementById('hero');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const scrollProgress = document.getElementById('scrollProgress');
  const reservationForm = document.getElementById('reservationForm');
  const formStatus = document.getElementById('formStatus');
  const reservationSubmit = document.getElementById('reservationSubmit');
  const reviewsInner = document.getElementById('reviewsInner');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const gallery = document.getElementById('gallery');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lightboxFocusables = lightbox
    ? [lightboxClose, lightboxPrev, lightboxNext].filter(Boolean)
    : [];

  let currentImageIndex = 0;
  let galleryImages = [];
  let lightboxTrigger = null;

  const sections = [...document.querySelectorAll('section[id]')];
  const navAnchors = navLinks ? [...navLinks.querySelectorAll('a[href^="#"]')] : [];

  document.body.classList.add('is-loaded');

  function setNavOpen(isOpen) {
    if (!navToggle || !navLinks) return;
    navToggle.classList.toggle('active', isOpen);
    navLinks.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

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
    if (!hero || reducedMotion) return;
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
      setNavOpen(!navLinks.classList.contains('open'));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setNavOpen(false));
    });
  }

  /* ---- Scroll reveal (unified) ---- */
  const animatedEls = document.querySelectorAll('.reveal, .reveal-scale, .reveal-stagger, .section__header');
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
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

  /* ---- Card tilt effect ---- */
  if (!reducedMotion) {
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
  }

  /* ---- Reviews infinite scroll ---- */
  if (reviewsInner && !reducedMotion) {
    reviewsInner.innerHTML = reviewsInner.innerHTML + reviewsInner.innerHTML;
  }

  /* ---- Gallery lightbox ---- */
  const galleryItems = document.querySelectorAll('.gallery__item');
  galleryImages = Array.from(galleryItems).map(item => {
    const img = item.querySelector('img');
    return {
      src: img.currentSrc || img.src,
      alt: img.alt
    };
  });

  galleryItems.forEach((item, index) => {
    const alt = galleryImages[index]?.alt;
    if (alt) item.setAttribute('aria-label', `Agrandir : ${alt}`);
    item.addEventListener('click', () => openLightbox(index, item));
  });

  function trapLightboxFocus(e) {
    if (!lightbox.classList.contains('active') || e.key !== 'Tab') return;
    const focusable = lightboxFocusables;
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openLightbox(index, trigger) {
    currentImageIndex = index;
    lightboxTrigger = trigger || document.activeElement;
    lightboxImg.src = galleryImages[index].src;
    lightboxImg.alt = galleryImages[index].alt;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
    document.addEventListener('keydown', trapLightboxFocus);
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapLightboxFocus);
    if (lightboxTrigger && typeof lightboxTrigger.focus === 'function') {
      lightboxTrigger.focus();
    }
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
  function showFormStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.hidden = false;
    formStatus.classList.remove('form-status--success', 'form-status--error');
    formStatus.classList.add(type === 'success' ? 'form-status--success' : 'form-status--error');
  }

  function clearFormStatus() {
    if (!formStatus) return;
    formStatus.hidden = true;
    formStatus.textContent = '';
    formStatus.classList.remove('form-status--success', 'form-status--error');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function buildReservationBody(fields) {
    const { nom, email, telephone, arrivee, depart, chambreLabel, personnes, petitdej, message } = fields;
    return [
      'Bonjour Marie-Claire,',
      '',
      'Je souhaiterais réserver une nuitée au Quai des Rêves.',
      '',
      `Nom : ${nom}`,
      `Email : ${email}`,
      telephone ? `Téléphone : ${telephone}` : '',
      `Arrivée : ${formatDate(arrivee)}`,
      `Départ : ${formatDate(depart)}`,
      `Chambre : ${chambreLabel}`,
      `Personnes : ${personnes}`,
      petitdej ? 'Petit-déjeuner : Oui (7,50 € / personne)' : 'Petit-déjeuner : Non',
      message ? `\nMessage :\n${message}` : '',
      '',
      'Merci et à bientôt !'
    ].filter(Boolean).join('\n');
  }

  function sendViaMailto(fields) {
    const body = buildReservationBody(fields);
    const subject = encodeURIComponent(`Réservation — ${fields.nom} — ${formatDate(fields.arrivee)}`);
    window.location.href = `mailto:marieclairepaul57@gmail.com?subject=${subject}&body=${encodeURIComponent(body)}`;
  }

  async function sendViaFormSubmit(fields) {
    const body = buildReservationBody(fields);
    const response = await fetch('https://formsubmit.co/ajax/marieclairepaul57@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        name: fields.nom,
        email: fields.email,
        phone: fields.telephone || 'Non renseigné',
        _subject: `Réservation — ${fields.nom} — ${formatDate(fields.arrivee)}`,
        message: body,
        _template: 'table',
        _captcha: 'false'
      })
    });

    if (!response.ok) throw new Error('FormSubmit error');
    const data = await response.json();
    if (data.success !== 'true' && data.success !== true) throw new Error('FormSubmit rejected');
  }

  if (reservationForm) {
    const arriveeInput = document.getElementById('arrivee');
    const departInput = document.getElementById('depart');
    const today = new Date().toISOString().split('T')[0];
    arriveeInput.min = today;
    departInput.min = today;

    arriveeInput.addEventListener('change', function () {
      departInput.min = this.value;
      if (departInput.value && departInput.value <= this.value) {
        departInput.value = '';
      }
    });

    reservationForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearFormStatus();

      const nom = document.getElementById('nom').value.trim();
      const email = document.getElementById('email').value.trim();
      const telephone = document.getElementById('telephone').value.trim();
      const arrivee = arriveeInput.value;
      const depart = departInput.value;
      const chambre = document.getElementById('chambre');
      const personnes = document.getElementById('personnes').value;
      const petitdej = document.getElementById('petitdej').checked;
      const message = document.getElementById('message').value.trim();

      if (depart <= arrivee) {
        showFormStatus('La date de départ doit être postérieure à la date d\'arrivée.', 'error');
        departInput.focus();
        return;
      }

      const chambreMap = {
        indifferent: 'Indifférent',
        chambre1: 'Chambre 1 — 50 €',
        chambre2: 'Chambre 2 — 50 €'
      };

      const fields = {
        nom,
        email,
        telephone,
        arrivee,
        depart,
        chambreLabel: chambreMap[chambre.value] || chambre.options[chambre.selectedIndex].text,
        personnes,
        petitdej,
        message
      };

      if (reservationSubmit) {
        reservationSubmit.disabled = true;
        reservationSubmit.textContent = 'Envoi en cours…';
      }

      try {
        await sendViaFormSubmit(fields);
        showFormStatus('Demande envoyée ! Marie‑Claire vous répondra rapidement par email ou téléphone.', 'success');
        reservationForm.reset();
        arriveeInput.min = today;
        departInput.min = today;
      } catch {
        showFormStatus('Envoi automatique indisponible — ouverture de votre messagerie…', 'error');
        sendViaMailto(fields);
      } finally {
        if (reservationSubmit) {
          reservationSubmit.disabled = false;
          reservationSubmit.textContent = 'Envoyer la demande';
        }
      }
    });
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
  if (!reducedMotion) {
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
  }

  onScroll();

})();
