/* =====================================================================
   CARD SWAP — swap loop + click-to-focus behavior.
   Requires GSAP to be loaded before this file (already true in index.html).
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('cardSwap');
  if (!container || typeof gsap === 'undefined') return;

  const CARD_DISTANCE = 45;
  const VERTICAL_DISTANCE = 50;
  const SKEW_AMOUNT = 5;
  const DELAY = 3500;
  const EASING = 'elastic';

  const config = EASING === 'elastic'
    ? {
        ease: 'elastic.out(0.6,0.9)',
        durDrop: 1.6,
        durMove: 1.6,
        durReturn: 1.6,
        promoteOverlap: 0.85,
        returnDelay: 0.05
      }
    : {
        ease: 'power1.inOut',
        durDrop: 0.8,
        durMove: 0.8,
        durReturn: 0.8,
        promoteOverlap: 0.45,
        returnDelay: 0.2
      };

  const cards = Array.from(container.querySelectorAll('.card'));
  const total = cards.length;
  let order = cards.map((_, i) => i);
  let intervalId = null;
  let currentTl = null;
  let focusedCardIndex = null;

  const makeSlot = (i, distX, distY, totalCount) => ({
    x: i * distX,
    y: -i * distY,
    z: -i * distX * 1.5,
    zIndex: totalCount - i
  });

  const placeNow = (el, slot, skew) => {
    gsap.set(el, {
      x: slot.x,
      y: slot.y,
      z: slot.z,
      xPercent: -50,
      yPercent: -50,
      skewY: skew,
      transformOrigin: 'center center',
      zIndex: slot.zIndex,
      force3D: true
    });
  };

  cards.forEach((card, i) => {
    placeNow(card, makeSlot(i, CARD_DISTANCE, VERTICAL_DISTANCE, total), SKEW_AMOUNT);
  });

  const swap = () => {
    if (order.length < 2 || focusedCardIndex !== null) return;

    const [front, ...rest] = order;
    const elFront = cards[front];
    const tl = gsap.timeline();
    currentTl = tl;

    tl.to(elFront, {
      y: '+=450',
      duration: config.durDrop,
      ease: config.ease
    });

    tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
    rest.forEach((idx, i) => {
      const el = cards[idx];
      const slot = makeSlot(i, CARD_DISTANCE, VERTICAL_DISTANCE, total);
      tl.set(el, { zIndex: slot.zIndex }, 'promote');
      tl.to(el, {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        duration: config.durMove,
        ease: config.ease
      }, `promote+=${i * 0.12}`);
    });

    const backSlot = makeSlot(total - 1, CARD_DISTANCE, VERTICAL_DISTANCE, total);
    tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);

    tl.call(() => {
      gsap.set(elFront, { zIndex: backSlot.zIndex });
    }, null, 'return');

    tl.to(elFront, {
      x: backSlot.x,
      y: backSlot.y,
      z: backSlot.z,
      duration: config.durReturn,
      ease: config.ease
    }, 'return');

    tl.call(() => {
      order = [...rest, front];
    });
  };

  const startAutoSwap = () => {
    if (!intervalId && focusedCardIndex === null) {
      intervalId = setInterval(swap, DELAY);
    }
  };

  const stopAutoSwap = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  cards.forEach((card, cardIdx) => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      if (focusedCardIndex === cardIdx) {
        unfocusCards();
        return;
      }
      focusCard(cardIdx);
    });
  });

  const focusCard = (index) => {
    stopAutoSwap();
    if (currentTl) currentTl.pause();

    focusedCardIndex = index;

    cards.forEach((el, i) => {
      if (i === index) {
        el.classList.add('focused');
        gsap.to(el, {
          x: 0,
          y: 0,
          z: 100,
          skewY: 0,
          zIndex: 999,
          duration: 1.2,
          ease: 'power3.out'
        });
      } else {
        el.classList.remove('focused');
        const slotPos = order.indexOf(i);
        const slot = makeSlot(slotPos, CARD_DISTANCE, VERTICAL_DISTANCE, total);
        gsap.to(el, {
          x: slot.x,
          y: slot.y,
          z: slot.z - 50,
          skewY: SKEW_AMOUNT,
          zIndex: slot.zIndex,
          duration: 0.8,
          ease: 'power2.out'
        });
      }
    });
  };

  const unfocusCards = () => {
    focusedCardIndex = null;
    cards.forEach((el, i) => {
      el.classList.remove('focused');
      const slotPos = order.indexOf(i);
      const slot = makeSlot(slotPos, CARD_DISTANCE, VERTICAL_DISTANCE, total);
      gsap.to(el, {
        x: slot.x,
        y: slot.y,
        z: slot.z,
        skewY: SKEW_AMOUNT,
        zIndex: slot.zIndex,
        duration: 1,
        ease: 'power3.out'
      });
    });
    startAutoSwap();
  };

  document.body.addEventListener('click', () => {
    if (focusedCardIndex !== null) unfocusCards();
  });

  requestAnimationFrame(() => {
    startAutoSwap();
  });
});