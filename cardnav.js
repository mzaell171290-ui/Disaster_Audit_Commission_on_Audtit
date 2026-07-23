/* =====================================================================
   CARD NAV — vanilla JS port of the CardNav React component.
   Same behaviour: hamburger toggles an expanding nav bar that reveals
   up to 3 "cards" of links, animated in with GSAP.
   Requires GSAP to be loaded before this file.
   ===================================================================== */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.getElementById('cardNav');
    var content = document.getElementById('cardNavContent');
    var toggle = document.getElementById('hamburgerToggle');
    if (!nav || !content || !toggle || typeof gsap === 'undefined') return;

    var cards = Array.prototype.slice.call(content.querySelectorAll('.nav-card'));
    var isExpanded = false;
    var tl = null;
    var ease = 'power3.out';

    function calculateHeight() {
      var isMobile = window.matchMedia('(max-width: 768px)').matches;
      if (isMobile) {
        var wasVisibility = content.style.visibility;
        var wasPointerEvents = content.style.pointerEvents;
        var wasPosition = content.style.position;
        var wasHeight = content.style.height;

        content.style.visibility = 'visible';
        content.style.pointerEvents = 'auto';
        content.style.position = 'static';
        content.style.height = 'auto';

        // force reflow
        void content.offsetHeight;

        var topBar = 60;
        var padding = 16;
        var contentHeight = content.scrollHeight;

        content.style.visibility = wasVisibility;
        content.style.pointerEvents = wasPointerEvents;
        content.style.position = wasPosition;
        content.style.height = wasHeight;

        return topBar + contentHeight + padding;
      }
      return 260;
    }

    function createTimeline() {
      gsap.set(nav, { height: 60, overflow: 'hidden' });
      gsap.set(cards, { y: 50, opacity: 0 });

      var timeline = gsap.timeline({ paused: true });

      timeline.to(nav, {
        height: calculateHeight,
        duration: 0.4,
        ease: ease
      });

      timeline.to(cards, { y: 0, opacity: 1, duration: 0.4, ease: ease, stagger: 0.08 }, '-=0.1');

      return timeline;
    }

    tl = createTimeline();

    function toggleMenu() {
      if (!tl) return;
      if (!isExpanded) {
        isExpanded = true;
        toggle.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Close menu');
        nav.classList.add('open');
        content.setAttribute('aria-hidden', 'false');
        tl.play(0);
      } else {
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        tl.eventCallback('onReverseComplete', function () {
          isExpanded = false;
          nav.classList.remove('open');
          content.setAttribute('aria-hidden', 'true');
        });
        tl.reverse();
      }
    }

    toggle.addEventListener('click', toggleMenu);
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });

    window.addEventListener('resize', function () {
      if (!tl) return;

      if (isExpanded) {
        var newHeight = calculateHeight();
        gsap.set(nav, { height: newHeight });

        tl.kill();
        var newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tl = newTl;
        }
      } else {
        tl.kill();
        var freshTl = createTimeline();
        if (freshTl) tl = freshTl;
      }
    });
  });
})();