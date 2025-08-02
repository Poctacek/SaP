document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.getElementById('hero-carousel');
  const track = carousel.querySelector('.hero-track');
  let slides = Array.from(track.children);
  const slideCount = slides.length;

  // Clone first and last for infinite effect
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);
  firstClone.classList.add('clone');
  lastClone.classList.add('clone');
  track.appendChild(firstClone);
  track.insertBefore(lastClone, slides[0]);
  slides = Array.from(track.children);

  let currentIndex = 1; // Start at the first real slide (after the clone)
  let isDragging = false, startX = 0, currentTranslate = 0, lastTranslate = 0, moved = false;
  let isTransitioning = false;
  let autoSlideTimer = null;

  function getSlideWidth() {
    return carousel.offsetWidth;
  }

  function goToSlide(idx, instant = false) {
    currentIndex = idx;
    const offset = -currentIndex * getSlideWidth();
    lastTranslate = offset;
    if (instant) {
      track.style.transition = 'none';
      isTransitioning = false;
      enableDrag();
    } else {
      track.style.transition = 'transform 0.7s cubic-bezier(.6,.05,.28,.91)';
      isTransitioning = true;
      disableDrag();
    }
    track.style.transform = `translateX(${offset}px)`;
  }

  // Drag event handlers
  function onDragStart(e) {
    if (isTransitioning) return;
    if (e.button !== undefined && e.button !== 0) return; // Only left mouse button
    isDragging = true;
    moved = false;
    startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    currentTranslate = lastTranslate;
    track.style.transition = 'none';
    clearInterval(autoSlideTimer);
    track.classList.add('dragging');
  }
  function onDragMove(e) {
    if (!isDragging || isTransitioning) return;
    const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    let moveBy = x - startX;
    if (Math.abs(moveBy) > 10) moved = true;
    let minTrans = -(slides.length - 1) * getSlideWidth();
    let maxTrans = 0;
    let nextTranslate = currentTranslate + moveBy;
    // Allow a little resistance on overdrag for clones (for better feel)
    if (nextTranslate > maxTrans + 80) nextTranslate = maxTrans + 80;
    if (nextTranslate < minTrans - 80) nextTranslate = minTrans - 80;
    track.style.transform = `translateX(${nextTranslate}px)`;
  }
  function onDragEnd(e) {
    if (!isDragging || isTransitioning) return;
    isDragging = false;
    const x = e.type && e.type.includes('touch') ? (e.changedTouches[0]?.clientX ?? startX) : (e.clientX ?? startX);
    const moveBy = x - startX;
    const threshold = getSlideWidth() / 6;
    if (moved) {
      if (moveBy > threshold) {
        goToSlide(currentIndex - 1);
      } else if (moveBy < -threshold) {
        goToSlide(currentIndex + 1);
      } else {
        goToSlide(currentIndex);
      }
    } else {
      goToSlide(currentIndex);
    }
    startAutoSlide();
    track.classList.remove('dragging');
  }

  // Enable/disable drag listeners
  function enableDrag() {
    track.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    track.addEventListener('touchstart', onDragStart, { passive: true });
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
  }
  function disableDrag() {
    track.removeEventListener('mousedown', onDragStart);
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);

    track.removeEventListener('touchstart', onDragStart, { passive: true });
    window.removeEventListener('touchmove', onDragMove, { passive: false });
    window.removeEventListener('touchend', onDragEnd);
    isDragging = false; // Cancel drag if running
  }

  // On transition end, fix clones & allow drag again
  track.addEventListener('transitionend', () => {
    isTransitioning = false;
    enableDrag();
    if (currentIndex === 0) {
      goToSlide(slideCount, true);
    } else if (currentIndex === slides.length - 1) {
      goToSlide(1, true);
    }
  });

  function startAutoSlide() {
    clearInterval(autoSlideTimer);
    autoSlideTimer = setInterval(() => {
      if (!isTransitioning && !isDragging) goToSlide(currentIndex + 1);
    }, 3000);
  }

  // Prevent default image drag ghost
  track.querySelectorAll('img').forEach(img => {
    img.setAttribute('draggable', 'false');
  });

  // Responsive: adjust on resize
  window.addEventListener('resize', () => {
    goToSlide(currentIndex, true);
  });

  // Safety: reset on mouse leave/tab switch
  window.addEventListener('mouseleave', () => {
    isDragging = false;
    if (!isTransitioning) enableDrag();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isDragging = false;
      if (!isTransitioning) enableDrag();
    }
  });

  // Init
  goToSlide(currentIndex, true);
  startAutoSlide();
  enableDrag();
});