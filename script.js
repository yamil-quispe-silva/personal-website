(() => {
  const card = document.getElementById('mainCard');
  const avatar = document.getElementById('heroAvatar');
  const line1 = document.getElementById('heroLine1');
  const line2 = document.getElementById('heroLine2');
  const bodyContent = document.getElementById('bodyContent');
  const contactLinks = document.getElementById('contactLinks');
  const headerFade = document.getElementById('headerFade');
  const bottomVisual = document.querySelector('.bottom-visual');

  let progress = 0;
  let targetProgress = 0;
  let rafId = null;
  let bodyRevealed = false;

  // Scroll offset for content after transition completes
  let scrollOffset = 0;
  let targetScrollOffset = 0;

  // Cache base sizes (measured once at natural scale)
  let baseSizes = null;

  function measureBaseSizes() {
    avatar.style.transform = 'none';
    line1.style.transform = 'none';
    line2.style.transform = 'none';
    baseSizes = {
      aw: avatar.offsetWidth,
      ah: avatar.offsetHeight,
      l1w: line1.offsetWidth,
      l1h: line1.offsetHeight,
      l2w: line2.offsetWidth,
      l2h: line2.offsetHeight,
    };
    avatar.style.transform = '';
    line1.style.transform = '';
    line2.style.transform = '';
  }

  function getMaxScroll() {
    const bodyBottom = bodyContent.offsetTop + bodyContent.scrollHeight;
    const cardH = card.clientHeight;
    return Math.max(0, bodyBottom - cardH + 1000);
  }

  // ---- Entrance fade-in ----
  window.addEventListener('load', () => {
    measureBaseSizes();
    // Start with image hidden
    bottomVisual.style.opacity = 0;
    applyState(0);
    requestAnimationFrame(() => {
      avatar.style.transition = 'opacity 0.9s cubic-bezier(0.25,0.1,0.25,1)';
      line1.style.transition = 'opacity 0.9s cubic-bezier(0.25,0.1,0.25,1) 0.15s';
      line2.style.transition = 'opacity 0.9s cubic-bezier(0.25,0.1,0.25,1) 0.25s';
      bottomVisual.style.transition = 'opacity 1.5s cubic-bezier(0.25,0.1,0.25,1) 0.3s';
      avatar.style.opacity = 1;
      line1.style.opacity = 1;
      line2.style.opacity = 1;
      bottomVisual.style.opacity = 1;
      setTimeout(() => {
        avatar.style.transition = '';
        line1.style.transition = '';
        line2.style.transition = '';
        bottomVisual.style.transition = '';
      }, 2000);

    });
  });

  // ---- Wheel drives transition ----
  card.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY;

    if (delta > 0) {
      // Scrolling down
      if (targetProgress < 1) {
        targetProgress = clamp(targetProgress + delta * 0.0015, 0, 1);
      } else {
        targetScrollOffset = clamp(targetScrollOffset + delta, 0, getMaxScroll());
      }
    } else {
      // Scrolling up
      if (targetScrollOffset > 0) {
        targetScrollOffset = clamp(targetScrollOffset + delta, 0, getMaxScroll());
      } else {
        // Cannot reverse back to intro
        // targetProgress stays at 1
      }
    }
    startAnimation();
  }, { passive: false });

  // ---- Touch support ----
  let touchStartY = 0;
  card.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  card.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const delta = touchStartY - e.touches[0].clientY;
    touchStartY = e.touches[0].clientY;

    if (delta > 0) {
      if (targetProgress < 1) {
        targetProgress = clamp(targetProgress + delta * 0.003, 0, 1);
      } else {
        targetScrollOffset = clamp(targetScrollOffset + delta, 0, getMaxScroll());
      }
    } else {
      if (targetScrollOffset > 0) {
        targetScrollOffset = clamp(targetScrollOffset + delta, 0, getMaxScroll());
      } else {
        // Cannot reverse back to intro
      }
    }
    startAnimation();
  }, { passive: false });

  // ---- Animation loop ----
  function startAnimation() {
    if (rafId) return;
    rafId = requestAnimationFrame(tick);
  }

  function tick() {
    progress += (targetProgress - progress) * 0.08;
    scrollOffset += (targetScrollOffset - scrollOffset) * 0.12;

    if (Math.abs(progress - targetProgress) < 0.0003) progress = targetProgress;
    if (Math.abs(scrollOffset - targetScrollOffset) < 0.5) scrollOffset = targetScrollOffset;

    applyState(progress);

    const progressDone = Math.abs(progress - targetProgress) < 0.0002;
    const scrollDone = Math.abs(scrollOffset - targetScrollOffset) < 0.5;

    if (!progressDone || !scrollDone) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  // ---- Core layout interpolation ----
  function applyState(t) {
    if (!baseSizes) return;

    const cw = card.clientWidth;
    const ch = card.clientHeight;

    const { aw, ah, l1w, l1h, l2w, l2h } = baseSizes;

    const ease = easeOutCubic(t);

    // ========== No scale change ==========
    const scale = 1;

    const saw = aw * scale;
    const sah = ah * scale;
    const sl1w = l1w * scale;
    const sl1h = l1h * scale;
    const sl2w = l2w * scale;
    const sl2h = l2h * scale;

    // ========== STATE 1 (t=0): centered, stacked vertically ==========
    const stackGap = 10 * scale;
    const totalStackH = sah + stackGap + sl1h + 4 * scale + sl2h;
    const stackTopY = (ch - totalStackH) / 2 - 40;

    const s1 = {
      avatarX: (cw - saw) / 2,
      avatarY: stackTopY,
      line1X: (cw - sl1w) / 2,
      line1Y: stackTopY + sah + stackGap,
      line2X: (cw - sl2w) / 2,
      line2Y: stackTopY + sah + stackGap + sl1h + 4 * scale,
    };

    // ========== STATE 2 (t=1): horizontal row near top ==========
    const rowGap = 12 * scale;
    const rowY = 65;
    const textGap = 5 * scale;
    const totalRowW = saw + rowGap + sl1w + textGap + sl2w;
    const rowStartX = (cw - totalRowW) / 2;
    const textBaselineOffset = (sah - sl1h) / 2;

    const s2 = {
      avatarX: rowStartX,
      avatarY: rowY,
      line1X: rowStartX + saw + rowGap,
      line1Y: rowY + textBaselineOffset,
      line2X: rowStartX + saw + rowGap + sl1w + textGap,
      line2Y: rowY + textBaselineOffset,
    };

    // ========== Interpolate positions ==========
    const so = scrollOffset;

    // Header elements stay fixed (no scroll offset)
    avatar.style.left = lerp(s1.avatarX, s2.avatarX, ease) + 'px';
    avatar.style.top = lerp(s1.avatarY, s2.avatarY, ease) + 'px';
    avatar.style.transform = `scale(${scale})`;

    line1.style.left = lerp(s1.line1X, s2.line1X, ease) + 'px';
    line1.style.top = lerp(s1.line1Y, s2.line1Y, ease) + 'px';
    line1.style.transform = `scale(${scale})`;

    line2.style.left = lerp(s1.line2X, s2.line2X, ease) + 'px';
    line2.style.top = lerp(s1.line2Y, s2.line2Y, ease) + 'px';
    line2.style.transform = `scale(${scale})`;

    // ========== Bottom visual: slides down as user scrolls ==========
    const isMobile = cw < 768;
    const imgStartBottom = isMobile ? 0 : -5;
    const imgEndBottom = isMobile ? 0 : -20;
    const imgBottom = lerp(imgStartBottom, imgEndBottom, ease);
    bottomVisual.style.bottom = imgBottom + '%';

    // ========== Header fade overlay (covers from top to below header) ==========
    headerFade.style.top = '0';
    headerFade.style.height = (rowY + sah + 20) + 'px';
    headerFade.style.opacity = so > 0 ? 1 : 0;

    // ========== Body content ==========
    const bodyTopPos = rowY + sah + 80;
    bodyContent.style.top = (bodyTopPos - so) + 'px';

    const bodyAlpha = clamp((t - 0.55) / 0.4, 0, 1);
    bodyContent.style.opacity = bodyAlpha;

    if (bodyAlpha > 0) {
      bodyContent.classList.add('visible');
    } else {
      bodyContent.classList.remove('visible');
    }

    // Stagger-reveal paragraphs
    if (t > 0.65 && !bodyRevealed) {
      bodyRevealed = true;
      const paragraphs = bodyContent.querySelectorAll('.body-text');
      paragraphs.forEach((p, i) => {
        setTimeout(() => p.classList.add('visible'), i * 70);
      });
    } else if (t < 0.5 && bodyRevealed) {
      bodyRevealed = false;
      bodyContent.querySelectorAll('.body-text').forEach(p => p.classList.remove('visible'));
    }
  }

  // ---- Utilities ----
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  // ---- Handle resize ----
  window.addEventListener('resize', () => {
    measureBaseSizes();
    applyState(progress);
  });
})();
