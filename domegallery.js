/* =====================================================================
   DOME GALLERY (vanilla JS)
   Turns any set of `.gallery-card` figures into a draggable, inertial,
   auto-rotating 3D photo sphere with a cinematic enlarge/close animation.
   No build step, no framework — works alongside the site's existing
   plain <script> files. Uses GSAP (already loaded on the page) for the
   showcase moments; everything else is dependency-free.
   ===================================================================== */
(function () {
  'use strict';

  var REDUCE_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HAS_GSAP = typeof window.gsap !== 'undefined';

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
  function normalizeAngle(d) { return ((d % 360) + 360) % 360; }
  function wrapAngleSigned(deg) {
    var a = (((deg + 180) % 360) + 360) % 360;
    return a - 180;
  }

  /* ---- pull image + caption data straight from existing markup ---- */
  function readImagesFrom(selector) {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(selector));
    return nodes.map(function (fig) {
      var img = fig.querySelector('img');
      if (!img) return null;
      var kicker = fig.querySelector('.card__kicker');
      var title = fig.querySelector('h4');
      var time = fig.querySelector('time');
      return {
        src: img.getAttribute('src') || '',
        alt: img.getAttribute('alt') || '',
        kicker: kicker ? kicker.textContent.trim() : '',
        title: title ? title.textContent.trim() : '',
        date: time ? time.textContent.trim() : ''
      };
    }).filter(function (d) { return d && d.src; });
  }

  /* ---- build the coordinate grid + assign images cyclically so every
     image in the source set is used (repeating only once the pool is
     exhausted) — nothing gets left out. ---- */
  function buildItems(pool, segments) {
    var xCols = [];
    for (var i = 0; i < segments; i++) xCols.push(-(segments - 1) + i * 2);
    var evenYs = [-4, -2, 0, 2, 4];
    var oddYs = [-3, -1, 1, 3, 5];

    var coords = [];
    xCols.forEach(function (x, c) {
      var ys = c % 2 === 0 ? evenYs : oddYs;
      ys.forEach(function (y) { coords.push({ x: x, y: y, sizeX: 2, sizeY: 2 }); });
    });

    if (!pool.length) return coords.map(function (c) { return Object.assign({}, c, { src: '', alt: '' }); });

    var used = coords.map(function (_, i) { return pool[i % pool.length]; });
    for (var k = 1; k < used.length; k++) {
      if (used[k].src === used[k - 1].src) {
        for (var j = k + 1; j < used.length; j++) {
          if (used[j].src !== used[k].src) {
            var tmp = used[k]; used[k] = used[j]; used[j] = tmp;
            break;
          }
        }
      }
    }
    return coords.map(function (c, i) { return Object.assign({}, c, used[i]); });
  }

  function baseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
    var unit = 360 / segments / 2;
    return {
      rotateY: unit * (offsetX + (sizeX - 1) / 2),
      rotateX: unit * (offsetY - (sizeY - 1) / 2)
    };
  }

  /* ===================================================================
     DomeGallery instance
     =================================================================== */
  function DomeGallery(root, images, opts) {
    this.root = root;
    this.images = images;
    this.opts = Object.assign({
      fit: 0.55,
      minRadius: 460,
      maxRadius: Infinity,
      segments: 20,
      maxVerticalRotationDeg: 8,
      dragSensitivity: 22,
      dragDampening: 2,
      autoRotateSpeed: 0.035, // deg per frame
      idleDelay: 2600
    }, opts || {});

    this.rotation = { x: 0, y: 0 };
    this.dragging = false;
    this.moved = false;
    this.inertiaRAF = null;
    this.autoRAF = null;
    this.lastInteraction = 0;
    this.focusedEl = null;

    this._buildDOM();
    this._buildTiles();
    this._observeResize();
    this._bindPointer();
    if (!REDUCE_MOTION) this._startAutoRotate();
    this._revealTiles();
  }

  DomeGallery.prototype._buildDOM = function () {
    var root = this.root;
    root.innerHTML =
      '<main class="dome-gallery__main">' +
      '<div class="dome-gallery__stage"><div class="dome-gallery__sphere"></div></div>' +
      '<div class="dome-gallery__overlay"></div>' +
      '<div class="dome-gallery__overlay--blur"></div>' +
      '<div class="dome-gallery__edge dome-gallery__edge--top"></div>' +
      '<div class="dome-gallery__edge dome-gallery__edge--bottom"></div>' +
      '</main>';

    this.main = root.querySelector('.dome-gallery__main');
    this.stage = root.querySelector('.dome-gallery__stage');
    this.sphere = root.querySelector('.dome-gallery__sphere');

    root.style.setProperty('--segments-x', this.opts.segments);
    root.style.setProperty('--segments-y', this.opts.segments);
  };

  DomeGallery.prototype._buildTiles = function () {
    var items = buildItems(this.images, this.opts.segments);
    var frag = document.createDocumentFragment();
    var self = this;

    items.forEach(function (it) {
      if (!it.src) return;
      var item = document.createElement('div');
      item.className = 'dome-item';
      item.style.setProperty('--offset-x', it.x);
      item.style.setProperty('--offset-y', it.y);
      item.style.setProperty('--item-size-x', it.sizeX);
      item.style.setProperty('--item-size-y', it.sizeY);
      item.dataset.offsetX = it.x;
      item.dataset.offsetY = it.y;
      item.dataset.sizeX = it.sizeX;
      item.dataset.sizeY = it.sizeY;

      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'dome-item__tile';
      tile.setAttribute('aria-label', it.alt || it.title || 'Open image');
      tile.dataset.kicker = it.kicker || '';
      tile.dataset.title = it.title || '';
      tile.dataset.date = it.date || '';

      var img = document.createElement('img');
      img.src = it.src;
      img.alt = it.alt || '';
      img.loading = 'lazy';
      img.draggable = false;
      tile.appendChild(img);

      tile.addEventListener('click', function (e) {
        if (self.moved || self.dragging) return;
        self._openTile(tile, item);
      });

      item.appendChild(tile);
      frag.appendChild(item);
    });

    this.sphere.appendChild(frag);
    this._applyTransform(0, 0);
  };

  DomeGallery.prototype._revealTiles = function () {
    var tiles = Array.prototype.slice.call(this.sphere.querySelectorAll('.dome-item'));
    if (REDUCE_MOTION) { tiles.forEach(function (t) { t.classList.add('is-visible'); }); return; }
    // gentle stagger so the sphere feels like it assembles itself
    tiles.forEach(function (t, i) {
      setTimeout(function () { t.classList.add('is-visible'); }, 8 * (i % 40));
    });
  };

  DomeGallery.prototype._applyTransform = function (x, y) {
    this.sphere.style.transform = 'translateZ(calc(var(--radius) * -1)) rotateX(' + x + 'deg) rotateY(' + y + 'deg)';
  };

  DomeGallery.prototype.setImages = function (images) {
    var self = this;
    this.images = images && images.length ? images : this.images;
    // close any open enlarge view first
    if (this.focusedEl) this._closeTile(this.focusedEl);
    this._stopInertia();

    var oldTiles = Array.prototype.slice.call(this.sphere.querySelectorAll('.dome-item'));
    var rebuild = function () {
      self.sphere.innerHTML = '';
      self._buildTiles();
      self._revealTiles();
    };
    if (oldTiles.length && !REDUCE_MOTION) {
      oldTiles.forEach(function (t) { t.classList.remove('is-visible'); });
      setTimeout(rebuild, 260);
    } else {
      rebuild();
    }
  };

  DomeGallery.prototype._observeResize = function () {
    var self = this;
    var ro = new ResizeObserver(function (entries) {
      var cr = entries[0].contentRect;
      var w = Math.max(1, cr.width), h = Math.max(1, cr.height);
      if (w < 10 || h < 10) return; // not visible yet (e.g. closed <dialog>)
      var basis = w >= h * 1.3 ? w : Math.min(w, h);
      var radius = clamp(basis * self.opts.fit, self.opts.minRadius, self.opts.maxRadius);
      radius = Math.min(radius, h * 1.4);
      self.root.style.setProperty('--radius', Math.round(radius) + 'px');
    });
    ro.observe(this.root);
    this._ro = ro;
  };

  DomeGallery.prototype.refresh = function () {
    var r = this.root.getBoundingClientRect();
    if (r.width > 10) {
      var basis = r.width >= r.height * 1.3 ? r.width : Math.min(r.width, r.height);
      var radius = clamp(basis * this.opts.fit, this.opts.minRadius, this.opts.maxRadius);
      radius = Math.min(radius, r.height * 1.4);
      this.root.style.setProperty('--radius', Math.round(radius) + 'px');
    }
  };

  /* ---------------- drag + inertia + idle auto-rotate ---------------- */
  DomeGallery.prototype._markInteraction = function () {
    this.lastInteraction = performance.now();
    this.root.closest('.dome-wrap') && this.root.closest('.dome-wrap').classList.add('is-interacted');
  };

  DomeGallery.prototype._stopAutoRotate = function () {
    if (this.autoRAF) { cancelAnimationFrame(this.autoRAF); this.autoRAF = null; }
  };

  DomeGallery.prototype._startAutoRotate = function () {
    var self = this;
    this._stopAutoRotate();
    var step = function () {
      var idleFor = performance.now() - self.lastInteraction;
      if (!self.dragging && !self.focusedEl && idleFor > self.opts.idleDelay) {
        var nextY = wrapAngleSigned(self.rotation.y + self.opts.autoRotateSpeed);
        self.rotation.y = nextY;
        self._applyTransform(self.rotation.x, nextY);
      }
      self.autoRAF = requestAnimationFrame(step);
    };
    this.autoRAF = requestAnimationFrame(step);
  };

  DomeGallery.prototype._stopInertia = function () {
    if (this.inertiaRAF) { cancelAnimationFrame(this.inertiaRAF); this.inertiaRAF = null; }
  };

  DomeGallery.prototype._startInertia = function (vx, vy) {
    var self = this;
    var MAX_V = 1.4;
    var vX = clamp(vx, -MAX_V, MAX_V) * 80;
    var vY = clamp(vy, -MAX_V, MAX_V) * 80;
    var frames = 0;
    var d = clamp(this.opts.dragDampening, 0, 1);
    var frictionMul = 0.94 + 0.055 * d;
    var stopThreshold = 0.015 - 0.01 * d;
    var maxFrames = Math.round(90 + 270 * d);
    this._stopInertia();
    var step = function () {
      vX *= frictionMul; vY *= frictionMul;
      if ((Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) || ++frames > maxFrames) {
        self.inertiaRAF = null; return;
      }
      var nextX = clamp(self.rotation.x - vY / 200, -self.opts.maxVerticalRotationDeg, self.opts.maxVerticalRotationDeg);
      var nextY = wrapAngleSigned(self.rotation.y + vX / 200);
      self.rotation = { x: nextX, y: nextY };
      self._applyTransform(nextX, nextY);
      self.inertiaRAF = requestAnimationFrame(step);
    };
    this.inertiaRAF = requestAnimationFrame(step);
  };

  DomeGallery.prototype._bindPointer = function () {
    var self = this;
    var startPos = null, startRot = null, pointerId = null;

    this.main.addEventListener('pointerdown', function (e) {
      if (self.focusedEl) return;
      self._stopInertia();
      self._markInteraction();
      self.dragging = true;
      self.moved = false;
      startRot = { x: self.rotation.x, y: self.rotation.y };
      startPos = { x: e.clientX, y: e.clientY, t: performance.now() };
      pointerId = e.pointerId;
      try { self.main.setPointerCapture(pointerId); } catch (err) {}
    });

    this.main.addEventListener('pointermove', function (e) {
      if (!self.dragging || !startPos) return;
      var dx = e.clientX - startPos.x, dy = e.clientY - startPos.y;
      if (!self.moved && (dx * dx + dy * dy) > 16) self.moved = true;
      var nextX = clamp(startRot.x - dy / self.opts.dragSensitivity, -self.opts.maxVerticalRotationDeg, self.opts.maxVerticalRotationDeg);
      var nextY = wrapAngleSigned(startRot.y + dx / self.opts.dragSensitivity);
      self.rotation = { x: nextX, y: nextY };
      self._applyTransform(nextX, nextY);
      var rect = self.root.getBoundingClientRect();
      self.root.style.setProperty('--spot-x', ((e.clientX - rect.left) / rect.width * 100) + '%');
      self.root.style.setProperty('--spot-y', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });

    function end(e) {
      if (!self.dragging) return;
      self.dragging = false;
      self._markInteraction();
      if (startPos) {
        var dt = Math.max(1, performance.now() - startPos.t);
        var dx = (e.clientX != null ? e.clientX : startPos.x) - startPos.x;
        var dy = (e.clientY != null ? e.clientY : startPos.y) - startPos.y;
        var vx = clamp((dx / dt) * 16 / self.opts.dragSensitivity, -1.2, 1.2);
        var vy = clamp((dy / dt) * 16 / self.opts.dragSensitivity, -1.2, 1.2);
        if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) self._startInertia(vx, vy);
      }
      startPos = null;
      setTimeout(function () { self.moved = false; }, 60);
    }
    this.main.addEventListener('pointerup', end);
    this.main.addEventListener('pointercancel', end);
    this.main.addEventListener('pointerleave', function () {
      if (!self.dragging) self.root.style.setProperty('--spot-y', '-50%');
    });
  };

  /* ---------------- shared fullscreen lightbox (singleton) ---------------- */
  var sharedLightbox = null;
  function getLightbox() {
    if (sharedLightbox) return sharedLightbox;

    var el = document.createElement('div');
    el.className = 'dome-lightbox';
    el.innerHTML =
      '<div class="dome-lightbox__scrim"></div>' +
      '<button type="button" class="dome-lightbox__close" aria-label="Close">&#10005;</button>' +
      '<div class="dome-lightbox__stage">' +
      '<div class="dome-lightbox__frame"><img alt=""></div>' +
      '<div class="dome-lightbox__plaque"></div>' +
      '</div>';
    document.body.appendChild(el);

    sharedLightbox = {
      root: el,
      scrim: el.querySelector('.dome-lightbox__scrim'),
      closeBtn: el.querySelector('.dome-lightbox__close'),
      frame: el.querySelector('.dome-lightbox__frame'),
      img: el.querySelector('.dome-lightbox__frame img'),
      plaque: el.querySelector('.dome-lightbox__plaque'),
      onClose: null
    };

    function triggerClose() { if (sharedLightbox.onClose) sharedLightbox.onClose(); }
    sharedLightbox.scrim.addEventListener('click', triggerClose);
    sharedLightbox.closeBtn.addEventListener('click', triggerClose);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sharedLightbox.root.classList.contains('is-open')) triggerClose();
    });

    return sharedLightbox;
  }

  /* ---------------- enlarge / close (viewport FLIP into the shared lightbox) ---------------- */
  DomeGallery.prototype._openTile = function (tile) {
    var lb = getLightbox();
    if (lb.root.classList.contains('is-open') || this.focusedEl) return;

    this.focusedEl = tile;
    this._markInteraction();
    document.body.classList.add('dg-scroll-lock');

    var tileRect = tile.getBoundingClientRect();
    var img = tile.querySelector('img');
    tile.style.visibility = 'hidden';

    lb.img.src = img.src;
    lb.img.alt = img.alt || '';

    var kicker = tile.dataset.kicker, title = tile.dataset.title, date = tile.dataset.date;
    var hasCaption = !!(kicker || title || date);
    lb.plaque.innerHTML =
      (kicker ? '<p class="card__kicker">' + kicker + '</p>' : '') +
      (title ? '<h4>' + title + '</h4>' : '') +
      (date ? '<time>' + date + '</time>' : '');
    lb.plaque.style.display = hasCaption ? '' : 'none';

    // size the frame to a large, centered target that preserves the
    // tile's own aspect ratio, leaving room below for the caption plaque
    var vw = window.innerWidth, vh = window.innerHeight;
    var padX = Math.max(24, vw * 0.06);
    var reserveBelow = hasCaption ? 130 : 40;
    var maxW = Math.min(vw - padX * 2, 960);
    var maxH = vh - 140 - reserveBelow;
    var aspect = tileRect.width / tileRect.height;
    var targetW = maxW, targetH = maxW / aspect;
    if (targetH > maxH) { targetH = maxH; targetW = maxH * aspect; }

    lb.frame.style.width = targetW + 'px';
    lb.frame.style.height = targetH + 'px';

    lb.root.classList.add('is-open');

    var finalRect = lb.frame.getBoundingClientRect();
    var dx = tileRect.left - finalRect.left;
    var dy = tileRect.top - finalRect.top;
    var sx = tileRect.width / finalRect.width;
    var sy = tileRect.height / finalRect.height;

    var self = this;
    lb.onClose = function () { self._closeTile(tile); };

    if (HAS_GSAP && !REDUCE_MOTION) {
      gsap.set(lb.frame, { x: dx, y: dy, scaleX: sx, scaleY: sy, transformOrigin: '0 0' });
      gsap.to(lb.frame, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.55, ease: 'power3.out' });
      if (hasCaption) gsap.fromTo(lb.plaque, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.28, ease: 'power2.out' });
    } else {
      lb.frame.style.transform = 'none';
      lb.plaque.style.opacity = '1';
    }
  };

  DomeGallery.prototype._closeTile = function (tile) {
    var lb = getLightbox();
    var self = this;

    var tileRect = tile.getBoundingClientRect();
    var frameRect = lb.frame.getBoundingClientRect();
    var dx = tileRect.left - frameRect.left;
    var dy = tileRect.top - frameRect.top;
    var sx = tileRect.width / frameRect.width;
    var sy = tileRect.height / frameRect.height;

    var finish = function () {
      lb.root.classList.remove('is-open');
      lb.img.src = '';
      lb.frame.style.transform = '';
      tile.style.visibility = '';
      self.focusedEl = null;
      document.body.classList.remove('dg-scroll-lock');
    };

    if (HAS_GSAP && !REDUCE_MOTION) {
      gsap.to(lb.plaque, { opacity: 0, duration: 0.15 });
      gsap.to(lb.frame, { x: dx, y: dy, scaleX: sx, scaleY: sy, duration: 0.4, ease: 'power2.inOut', onComplete: finish });
    } else {
      finish();
    }
  };

  window.DomeGallery = DomeGallery;
  window.readDomeImagesFrom = readImagesFrom;

  /* =====================================================================
     Auto-init: teaser dome + full immersive dome + grid/dome toggle
     ===================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    var sourceSelector = '#modal-library-gallery .gallery-card';
    var images = readImagesFrom(sourceSelector);
    if (!images.length) return;

    var instances = {};

    document.querySelectorAll('[data-dome-gallery]').forEach(function (el) {
      var opts = {
        fit: parseFloat(el.getAttribute('data-fit')) || 0.55,
        minRadius: parseFloat(el.getAttribute('data-min-radius')) || 460,
        segments: parseInt(el.getAttribute('data-segments'), 10) || 20,
        idleDelay: parseFloat(el.getAttribute('data-idle-delay')) || 2600
      };
      instances[el.id] = new DomeGallery(el, images, opts);
    });

    // Re-measure the full/modal dome once its <dialog> actually opens
    // (a closed dialog has zero size, so ResizeObserver can't size it yet).
    var trigger = document.getElementById('library-gallery-trigger');
    var fullDome = instances['library-dome-full'];
    if (trigger && fullDome) {
      trigger.addEventListener('click', function () {
        requestAnimationFrame(function () { fullDome.refresh(); });
        setTimeout(function () { fullDome.refresh(); }, 120);
      });
    }

    // Grid <-> Dome toggle inside the full gallery modal
    var toggleBtns = document.querySelectorAll('.gallery-view-toggle .view-toggle-btn');
    var grid = document.getElementById('library-grid-fallback');
    var domeWrap = document.getElementById('library-dome-full-wrap');
    if (toggleBtns.length && grid && domeWrap) {
      toggleBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          toggleBtns.forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          var view = btn.getAttribute('data-view');
          if (view === 'dome') {
            grid.classList.add('is-hidden');
            domeWrap.classList.remove('is-hidden');
            if (fullDome) requestAnimationFrame(function () { fullDome.refresh(); });
          } else {
            domeWrap.classList.add('is-hidden');
            grid.classList.remove('is-hidden');
          }
        });
      });
    }

    // Category filter chips ("All / Tacloban / Briefing / GACPA / Relief") —
    // clicking one rebuilds every dome (teaser + full) with only that
    // category's photos, and hides the rest in the grid fallback too.
    var filterRow = document.getElementById('library-filter-row');
    if (filterRow) {
      var chips = Array.prototype.slice.call(filterRow.querySelectorAll('.filter-chip'));
      var gridFigures = grid ? Array.prototype.slice.call(grid.querySelectorAll('.gallery-card')) : [];

      // tag each grid figure with its category, read straight from its own kicker
      gridFigures.forEach(function (fig) {
        var kicker = fig.querySelector('.card__kicker');
        fig.dataset.category = kicker ? kicker.textContent.trim().toLowerCase() : '';
      });

      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          chips.forEach(function (c) { c.classList.remove('is-active'); });
          chip.classList.add('is-active');

          var filter = (chip.getAttribute('data-filter') || chip.textContent.trim()).toLowerCase();
          var matched = filter === 'all'
            ? images
            : images.filter(function (d) { return (d.kicker || '').trim().toLowerCase() === filter; });

          var teaserDome = instances['library-dome-teaser'];
          if (teaserDome) teaserDome.setImages(matched);
          if (fullDome) fullDome.setImages(matched);

          gridFigures.forEach(function (fig) {
            var show = filter === 'all' || fig.dataset.category === filter;
            fig.classList.toggle('is-hidden', !show);
          });
        });
      });
    }
  });
})();