/* =====================================================================
   FLOWING MENU — vanilla JS port of the React <FlowingMenu /> component.
   Same hover-marquee behavior, no React/JSX involved.
   Requires GSAP, which is already loaded via <script> earlier in the page.
   ===================================================================== */
(function () {
  function distMetric(x, y, x2, y2) {
    const dx = x - x2, dy = y - y2;
    return dx * dx + dy * dy;
  }

  function findClosestEdge(mouseX, mouseY, width, height) {
    const topEdgeDist = distMetric(mouseX, mouseY, width / 2, 0);
    const bottomEdgeDist = distMetric(mouseX, mouseY, width / 2, height);
    return topEdgeDist < bottomEdgeDist ? 'top' : 'bottom';
  }

  function buildMarqueePart(text, image, marqueeTextColor) {
    const part = document.createElement('div');
    part.className = 'marquee__part';
    part.style.color = marqueeTextColor;

    const span = document.createElement('span');
    span.textContent = text;
    part.appendChild(span);

    if (image) {
      const img = document.createElement('div');
      img.className = 'marquee__img';
      img.style.backgroundImage = "url('" + image + "')";
      part.appendChild(img);
    }
    return part;
  }

  function setupMenuItem(item, opts) {
    const link = item.link || '#';
    const text = item.text || '';
    const image = item.image || '';

    const itemEl = document.createElement('div');
    itemEl.className = 'menu__item';
    itemEl.style.borderColor = opts.borderColor;

    const a = document.createElement('a');
    a.className = 'menu__item-link';
    a.href = link;
    a.style.color = opts.textColor;
    a.textContent = text;
    itemEl.appendChild(a);

    const marquee = document.createElement('div');
    marquee.className = 'marquee';
    marquee.style.backgroundColor = opts.marqueeBgColor;

    const innerWrap = document.createElement('div');
    innerWrap.className = 'marquee__inner-wrap';

    const inner = document.createElement('div');
    inner.className = 'marquee__inner';
    inner.setAttribute('aria-hidden', 'true');

    innerWrap.appendChild(inner);
    marquee.appendChild(innerWrap);
    itemEl.appendChild(marquee);

    let animation = null;

    function renderRepetitions() {
      inner.innerHTML = '';
      const ref = buildMarqueePart(text, image, opts.marqueeTextColor);
      inner.appendChild(ref);
      const contentWidth = ref.offsetWidth || 200;
      const viewportWidth = window.innerWidth;
      const needed = Math.ceil(viewportWidth / Math.max(contentWidth, 1)) + 2;
      const repetitions = Math.max(4, needed);

      inner.innerHTML = '';
      for (let i = 0; i < repetitions; i++) {
        inner.appendChild(buildMarqueePart(text, image, opts.marqueeTextColor));
      }
      startMarquee();
    }

    function startMarquee() {
      const part = inner.querySelector('.marquee__part');
      if (!part) return;
      const contentWidth = part.offsetWidth;
      if (!contentWidth) return;
      if (animation) animation.kill();
      animation = gsap.to(inner, { x: -contentWidth, duration: opts.speed, ease: 'none', repeat: -1 });
    }

    renderRepetitions();
    window.addEventListener('resize', renderRepetitions);

    const animationDefaults = { duration: 0.6, ease: 'expo' };

    a.addEventListener('mouseenter', function (ev) {
      const rect = itemEl.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const edge = findClosestEdge(x, y, rect.width, rect.height);

      gsap.timeline({ defaults: animationDefaults })
        .set(marquee, { y: edge === 'top' ? '-101%' : '101%' }, 0)
        .set(inner, { y: edge === 'top' ? '101%' : '-101%' }, 0)
        .to([marquee, inner], { y: '0%' }, 0);
    });

    a.addEventListener('mouseleave', function (ev) {
      const rect = itemEl.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const edge = findClosestEdge(x, y, rect.width, rect.height);

      gsap.timeline({ defaults: animationDefaults })
        .to(marquee, { y: edge === 'top' ? '-101%' : '101%' }, 0)
        .to(inner, { y: edge === 'top' ? '101%' : '-101%' }, 0);
    });

    return itemEl;
  }

  window.createFlowingMenu = function (container, items, options) {
    if (!container || typeof gsap === 'undefined') return;
    options = options || {};
    const opts = {
      speed: options.speed || 15,
      textColor: options.textColor || '#fff',
      bgColor: options.bgColor || '#120F17',
      marqueeBgColor: options.marqueeBgColor || '#fff',
      marqueeTextColor: options.marqueeTextColor || '#120F17',
      borderColor: options.borderColor || '#fff'
    };

    container.classList.add('menu-wrap');
    container.style.backgroundColor = opts.bgColor;

    const nav = document.createElement('nav');
    nav.className = 'menu';
    (items || []).forEach(function (item) {
      nav.appendChild(setupMenuItem(item, opts));
    });

    container.innerHTML = '';
    container.appendChild(nav);
  };
})();