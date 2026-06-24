// ── Navbar scroll effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ── Hamburger / mobile menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const closeMenu = document.getElementById('close-menu');

hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
hamburger.addEventListener('keydown', e => e.key === 'Enter' && mobileMenu.classList.add('open'));
closeMenu.addEventListener('click', closeMobileMenu);

function closeMobileMenu() { mobileMenu.classList.remove('open'); }

// ── Fade-in on scroll
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.12 });
fadeEls.forEach(el => observer.observe(el));

// ── Testimonials carousel
const track = document.getElementById('testimonials-inner');
const dots = document.querySelectorAll('.dot-btn');
let currentSlide = 0;
const totalSlides = document.querySelectorAll('.testimonial-card').length;
const visibleCount = window.innerWidth < 768 ? 1 : 3;

function goToSlide(idx) {
  const maxIdx = Math.max(0, totalSlides - visibleCount);
  currentSlide = Math.min(idx, maxIdx);
  const cardWidth = track.querySelector('.testimonial-card').offsetWidth + 28;
  track.style.transform = `translateX(-${currentSlide * cardWidth}px)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));

// Auto-advance
let autoplay = setInterval(() => goToSlide((currentSlide + 1) % (totalSlides - visibleCount + 1)), 5000);
track.addEventListener('mouseenter', () => clearInterval(autoplay));
track.addEventListener('mouseleave', () => {
  autoplay = setInterval(() => goToSlide((currentSlide + 1) % (totalSlides - visibleCount + 1)), 5000);
});

// ── Cookie banner
function hideBanner() { document.getElementById('cookie-banner').style.display = 'none'; }

document.getElementById('btn-accept-all').addEventListener('click', () => {
  localStorage.setItem('cookie_consent', 'all');
  hideBanner();
  // Activar GA4 si se aceptaron todas
  if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'granted' });
});

document.getElementById('btn-only-essential').addEventListener('click', () => {
  localStorage.setItem('cookie_consent', 'essential');
  hideBanner();
  if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'denied' });
});

// Si ya eligió anteriormente, no mostrar banner
if (localStorage.getItem('cookie_consent')) { hideBanner(); }

// ── Inicializar GA4 con consentimiento denegado por defecto (RGPD)
if (typeof gtag === 'function') {
  gtag('consent', 'default', { analytics_storage: 'denied', wait_for_update: 500 });
}

// ── Formulario con webhook
const form = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const successMsg = document.getElementById('form-success');
const errorMsg = document.getElementById('form-error');

// ⚙️ WEBHOOK n8n — producción
const WEBHOOK_URL = 'https://n8n-oxgm.srv1537739.hstgr.cloud/webhook/8c3eb489-1b3b-4a9d-aade-9548b21abc46';

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  successMsg.style.display = 'none';
  errorMsg.style.display = 'none';

  // Validación básica
  const nombre = form.nombre.value.trim();
  const apellidos = form.apellidos.value.trim();
  const telefono = form.telefono.value.trim();
  const consent = form.consent.checked;

  if (!nombre || !apellidos || !telefono || !consent) {
    errorMsg.textContent = '⚠️ Por favor, completa los campos obligatorios y acepta la política de privacidad.';
    errorMsg.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';

  const payload = {
    nombre,
    apellidos,
    telefono,
    email: form.email.value.trim(),
    servicio: form.servicio.value,
    mensaje: form.mensaje.value.trim(),
    timestamp: new Date().toISOString(),
    origen: 'web-clinicadentalguadalix.com',
    consentimiento_privacidad: true
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok || res.status === 200 || res.status === 201) {
      form.reset();
      form.style.display = 'none';
      successMsg.style.display = 'block';
      // Evento GA4
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { event_category: 'formulario', event_label: payload.servicio || 'general' });
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('Webhook error:', err);
    errorMsg.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar solicitud de cita →';
  }
});
