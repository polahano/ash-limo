(function () {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navShell = document.querySelector('[data-nav-shell]');
  if (navToggle && navShell) {
    navToggle.addEventListener('click', function () {
      navShell.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('.accordion-trigger').forEach(function (button) {
    button.addEventListener('click', function () {
      const item = button.closest('.faq-item');
      const panel = item.querySelector('.accordion-panel');
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (el) {
        if (el !== item) {
          el.classList.remove('open');
          const p = el.querySelector('.accordion-panel');
          if (p) p.style.maxHeight = '0px';
        }
      });
      item.classList.toggle('open', !open);
      panel.style.maxHeight = !open ? panel.scrollHeight + 'px' : '0px';
    });
  });

  const filters = document.querySelectorAll('[data-filter-button]');
  const filterItems = document.querySelectorAll('[data-filter-item]');
  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      const value = button.getAttribute('data-filter-button');
      filters.forEach(function (b) { b.classList.remove('active'); });
      button.classList.add('active');
      filterItems.forEach(function (item) {
        const matches = value === 'all' || item.getAttribute('data-filter-item') === value;
        item.classList.toggle('hide', !matches);
      });
    });
  });

  const radios = document.querySelectorAll('.radio-card input');
  function syncRadioCards() {
    document.querySelectorAll('.radio-card').forEach(function (card) {
      const input = card.querySelector('input');
      card.classList.toggle('is-selected', !!(input && input.checked));
    });
  }
  radios.forEach(function (radio) {
    radio.addEventListener('change', syncRadioCards);
  });
  syncRadioCards();

  const form = document.querySelector('[data-quote-form]');
  if (!form) return;

  const serviceRates = {
    airport: 145,
    corporate: 130,
    wedding: 180,
    event: 165,
    shuttle: 210,
    fifa: 245,
    private: 150,
  };
  const fleetData = [
    { slug: 'sedan', name: 'Executive Sedan', cap: 3, factor: 1.0, luggage: '2 bags', services: ['airport', 'corporate', 'private'] },
    { slug: 'suv', name: 'Luxury SUV', cap: 6, factor: 1.25, luggage: '6 bags', services: ['airport', 'corporate', 'private', 'event'] },
    { slug: 'limo', name: 'Stretch Limousine', cap: 10, factor: 1.6, luggage: 'Light luggage', services: ['wedding', 'private', 'event'] },
    { slug: 'sprinter', name: 'Executive Sprinter Van', cap: 14, factor: 1.85, luggage: '10 bags', services: ['airport', 'corporate', 'event', 'shuttle', 'fifa'] },
    { slug: 'party', name: 'Party Bus', cap: 24, factor: 2.3, luggage: 'Light luggage', services: ['wedding', 'event', 'private'] },
    { slug: 'mini', name: 'Mini Coach', cap: 31, factor: 2.8, luggage: '20 bags', services: ['wedding', 'event', 'shuttle', 'fifa'] },
    { slug: 'coach', name: 'Charter Coach', cap: 56, factor: 3.6, luggage: 'Full luggage bay', services: ['corporate', 'shuttle', 'fifa', 'event'] }
  ];

  const stepEls = Array.from(document.querySelectorAll('.wizard-step'));
  const chipEls = Array.from(document.querySelectorAll('.step-chip'));
  const nextButtons = Array.from(document.querySelectorAll('[data-step-next]'));
  const prevButtons = Array.from(document.querySelectorAll('[data-step-prev]'));
  const successBox = document.querySelector('.success-message');
  let currentStep = 0;

  function getValue(selector) {
    const el = form.querySelector(selector);
    if (!el) return '';
    if (el.type === 'checkbox') return el.checked;
    return el.value || '';
  }

  function getSelectedService() {
    const checked = form.querySelector('input[name="service_type"]:checked');
    return checked ? checked.value : 'airport';
  }

  function bestVehicle(passengers, service) {
    const count = Math.max(1, Number(passengers || 1));
    const byService = fleetData.filter(function (item) { return item.services.indexOf(service) !== -1; });
    const pool = byService.length ? byService : fleetData;
    return pool.find(function (item) { return count <= item.cap; }) || fleetData[fleetData.length - 1];
  }

  function calculateEstimate() {
    const service = getSelectedService();
    const passengers = Number(getValue('[name="passengers"]') || 1);
    const hoursRaw = Number(getValue('[name="hours"]') || 0);
    const vehicle = bestVehicle(passengers, service);
    const duration = hoursRaw > 0 ? hoursRaw : (service === 'airport' ? 1.5 : 4);
    const base = serviceRates[service] || 160;
    let extras = 0;
    if (getValue('[name="meet_greet"]')) extras += 35;
    if (getValue('[name="extra_stop"]')) extras += 40;
    if (getValue('[name="coordination"]')) extras += 75;
    if (getValue('[name="return_trip"]')) extras += 90;
    const luggage = getValue('[name="luggage"]');
    if (luggage === 'heavy') extras += 45;
    if (luggage === 'oversize') extras += 80;

    let low;
    let high;
    if (service === 'airport') {
      low = Math.round(base * vehicle.factor + extras);
      high = Math.round(low * 1.28 + 20);
    } else {
      low = Math.round(base * vehicle.factor * duration + extras);
      high = Math.round(low * 1.22 + 45);
    }
    return { low: low, high: high, vehicle: vehicle, duration: duration, service: service };
  }

  function serviceLabel(value) {
    const labels = {
      airport: 'Airport transfer',
      corporate: 'Corporate or roadshow',
      wedding: 'Wedding transportation',
      event: 'Sporting event or concert',
      shuttle: 'Recurring shuttle or charter',
      fifa: 'FIFA 2026 group transport',
      private: 'Private luxury ride'
    };
    return labels[value] || 'Custom trip';
  }

  function updateSummary() {
    const estimate = calculateEstimate();
    const summary = {
      service: serviceLabel(estimate.service),
      passengers: getValue('[name="passengers"]') || 'Not set',
      date: getValue('[name="travel_date"]') || 'Not set',
      time: getValue('[name="travel_time"]') || 'Not set',
      pickup: getValue('[name="pickup"]') || 'TBD',
      dropoff: getValue('[name="dropoff"]') || 'TBD',
      vehicle: estimate.vehicle.name,
      duration: estimate.duration,
      range: '$' + estimate.low.toLocaleString() + ' - $' + estimate.high.toLocaleString(),
    };

    Object.keys(summary).forEach(function (key) {
      document.querySelectorAll('[data-summary="' + key + '"]').forEach(function (el) {
        el.textContent = summary[key];
      });
    });
  }

  function showStep(index) {
    currentStep = Math.max(0, Math.min(index, stepEls.length - 1));
    stepEls.forEach(function (step, idx) {
      step.classList.toggle('active', idx === currentStep);
    });
    chipEls.forEach(function (chip, idx) {
      chip.classList.toggle('active', idx === currentStep);
    });
    window.scrollTo({ top: form.offsetTop - 120, behavior: 'smooth' });
    updateSummary();
  }

  function validateStep(index) {
    const step = stepEls[index];
    const required = Array.from(step.querySelectorAll('[required]'));
    for (let i = 0; i < required.length; i += 1) {
      const field = required[i];
      if (field.type === 'radio') {
        const name = field.name;
        if (!form.querySelector('input[name="' + name + '"]:checked')) {
          field.closest('.radio-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
          return false;
        }
      } else if (!field.value) {
        field.focus();
        return false;
      }
    }
    return true;
  }

  nextButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      if (!validateStep(currentStep)) return;
      showStep(currentStep + 1);
    });
  });

  prevButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      showStep(currentStep - 1);
    });
  });

  form.addEventListener('input', updateSummary);
  form.addEventListener('change', updateSummary);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!validateStep(currentStep)) return;
    const estimate = calculateEstimate();
    const name = getValue('[name="full_name"]') || 'there';
    successBox.classList.add('is-visible');
    successBox.innerHTML = '<strong>Thank you for your request.</strong><p>Thanks, ' + name + '. A team member can follow up with availability, a recommended vehicle of <strong>' + estimate.vehicle.name + '</strong>, and a planning range of <strong>$' + estimate.low.toLocaleString() + ' - $' + estimate.high.toLocaleString() + '</strong>.</p><p>Final pricing and reservation details are confirmed during the booking process.</p>';
    successBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const params = new URLSearchParams(window.location.search);
  const serviceParam = params.get('service');
  if (serviceParam) {
    const target = form.querySelector('input[name="service_type"][value="' + serviceParam + '"]');
    if (target) target.checked = true;
  }
  syncRadioCards();
  showStep(0);
})();

// Testimonials Carousel
(function () {
  const carousel = document.querySelector('.testimonials-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.carousel-track');
  const slides = carousel.querySelectorAll('.testimonial-slide');
  const prevBtn = carousel.querySelector('.prev-btn');
  const nextBtn = carousel.querySelector('.next-btn');
  const dots = carousel.querySelectorAll('.carousel-dot');

  let currentIndex = 0;
  let autoplayInterval;

  function updateDots() {
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function goToSlide(index) {
    currentIndex = index;
    const translateX = -100 * currentIndex;
    track.style.transform = `translateX(${translateX}%)`;
    updateDots();
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    goToSlide(currentIndex);
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    goToSlide(currentIndex);
  }

  function startAutoplay() {
    autoplayInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  // Event listeners
  prevBtn.addEventListener('click', () => {
    prevSlide();
    stopAutoplay();
    startAutoplay(); // Restart autoplay after manual interaction
  });

  nextBtn.addEventListener('click', () => {
    nextSlide();
    stopAutoplay();
    startAutoplay(); // Restart autoplay after manual interaction
  });

  // Add click listeners to dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      stopAutoplay();
      startAutoplay();
    });
  });

  // Pause autoplay on hover
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  // Initialize
  updateDots();
  startAutoplay();

  // Handle keyboard navigation
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
      stopAutoplay();
      startAutoplay();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
      stopAutoplay();
      startAutoplay();
    }
  });

  // Make carousel focusable for keyboard navigation
  carousel.setAttribute('tabindex', '0');
})();
