(() => {
  'use strict';

  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  const desktopBreakpoint = window.matchMedia('(min-width: 901px)');
  const siteHeader = document.querySelector('.site-header');
  let progressFrame = 0;

  function updateScrollProgress() {
    progressFrame = 0;
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 1;
    const initialWidth = Math.min(145, siteHeader?.clientWidth || 145);
    const progress = initialWidth + ((siteHeader?.clientWidth || initialWidth) - initialWidth) * scrolled;
    siteHeader?.style.setProperty('--scroll-progress', `${progress}px`);
  }

  function scheduleScrollProgress() {
    if (!progressFrame) progressFrame = window.requestAnimationFrame(updateScrollProgress);
  }

  window.addEventListener('scroll', scheduleScrollProgress, { passive: true });
  window.addEventListener('resize', scheduleScrollProgress);
  updateScrollProgress();

  function closeMenu(restoreFocus = false) {
    if (!menuButton || !mobileNav) return;
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
    document.body.classList.remove('menu-open');
    if (restoreFocus) menuButton.focus();
  }

  menuButton?.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    mobileNav.hidden = !opening;
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('menu-open', opening);
    if (opening) mobileNav.querySelector('a')?.focus();
  });

  mobileNav?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') closeMenu(true);
    if (event.key !== 'Tab' || menuButton?.getAttribute('aria-expanded') !== 'true') return;
    const links = [...mobileNav.querySelectorAll('a')];
    const first = links[0];
    const last = links.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      menuButton.focus();
    } else if (!event.shiftKey && document.activeElement === menuButton) {
      event.preventDefault();
      first.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      menuButton.focus();
    } else if (event.shiftKey && document.activeElement === menuButton) {
      event.preventDefault();
      last.focus();
    }
  });

  desktopBreakpoint.addEventListener('change', (event) => {
    if (event.matches) closeMenu();
  });

  const reviewTrack = document.querySelector('#review-track');
  const reviewControls = document.querySelector('.review-controls');
  if (reviewTrack && reviewControls) {
    const cards = [...reviewTrack.querySelectorAll('.review-card')];
    const previous = reviewControls.querySelector('[data-review-prev]');
    const next = reviewControls.querySelector('[data-review-next]');
    const count = reviewControls.querySelector('.review-count');
    let settleTimer;
    let activeReview = 0;

    function currentReview() {
      const start = cards[0].offsetLeft;
      return cards.reduce((closest, card, index) =>
        Math.abs(card.offsetLeft - start - reviewTrack.scrollLeft) < Math.abs(cards[closest].offsetLeft - start - reviewTrack.scrollLeft) ? index : closest, 0);
    }

    function setReviewHeight() {
      const height = Math.max(...cards.map((card) => card.offsetHeight));
      if (height) reviewTrack.style.height = `${height}px`;
    }

    function updateReviews() {
      const current = currentReview();
      activeReview = current;
      previous.disabled = current === 0;
      next.disabled = current === cards.length - 1;
      const label = `${current + 1} из ${cards.length}`;
      if (count.textContent !== label) count.textContent = label;
    }

    function settleReview() {
      const current = currentReview();
      const left = cards[current].offsetLeft - cards[0].offsetLeft;
      if (Math.abs(reviewTrack.scrollLeft - left) > 1) {
        reviewTrack.scrollTo({ left, behavior: 'smooth' });
      }
      updateReviews();
    }

    function moveReview(direction) {
      clearTimeout(settleTimer);
      const target = Math.max(0, Math.min(currentReview() + direction, cards.length - 1));
      reviewTrack.scrollTo({ left: cards[target].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
    }

    previous.addEventListener('click', () => moveReview(-1));
    next.addEventListener('click', () => moveReview(1));
    reviewTrack.addEventListener('scroll', () => {
      updateReviews();
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settleReview, 160);
    }, { passive: true });
    window.addEventListener('resize', () => {
      reviewTrack.scrollLeft = cards[activeReview].offsetLeft - cards[0].offsetLeft;
      setReviewHeight();
      updateReviews();
    });
    document.fonts?.ready.then(setReviewHeight);
    reviewTrack.querySelectorAll('img').forEach((img) => img.addEventListener('load', setReviewHeight));
    reviewControls.hidden = false;
    setReviewHeight();
    updateReviews();
  }

  document.querySelectorAll('.request-dialog select[name="service"]').forEach((select) => {
    const field = select.closest('.form-field');
    const label = field?.querySelector('label');
    if (!field || !label) return;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = `${select.id}-button`;
    trigger.className = 'select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-labelledby', `${label.id || (label.id = `${select.id}-label`)} ${trigger.id}`);

    const list = document.createElement('ul');
    list.id = `${select.id}-options`;
    list.className = 'select-options';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-labelledby', label.id);
    list.hidden = true;
    trigger.setAttribute('aria-controls', list.id);

    const options = [...select.options].map((option, index) => {
      const item = document.createElement('li');
      item.id = `${select.id}-option-${index}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', 'false');
      item.tabIndex = -1;
      item.className = 'select-option';
      item.textContent = option.textContent;
      item.addEventListener('click', () => choose(index));
      list.append(item);
      return item;
    });

    function sync() {
      trigger.textContent = select.selectedOptions[0]?.textContent || select.options[0].textContent;
      trigger.classList.toggle('is-placeholder', !select.value);
      options.forEach((option, index) => option.setAttribute('aria-selected', String(index === select.selectedIndex)));
    }

    function close(restoreFocus = false) {
      list.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) trigger.focus();
    }

    function open() {
      list.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      options[Math.max(0, select.selectedIndex)]?.focus();
    }

    function choose(index) {
      select.selectedIndex = index;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      close(true);
    }

    trigger.addEventListener('click', () => list.hidden ? open() : close());
    trigger.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        open();
      }
    });
    list.addEventListener('keydown', (event) => {
      const index = options.indexOf(document.activeElement);
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length].focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        options[event.key === 'Home' ? 0 : options.length - 1].focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        choose(index);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      } else if (event.key === 'Tab') {
        close();
      }
    });
    document.addEventListener('pointerdown', (event) => {
      if (!field.contains(event.target)) close();
    });
    select.addEventListener('change', sync);
    select.addEventListener('invalid', () => trigger.focus());
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    label.htmlFor = trigger.id;
    field.classList.add('custom-select');
    field.append(trigger, list);
    sync();
  });

  document.querySelectorAll('[data-dialog-open]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      const dialog = document.getElementById(trigger.dataset.dialogOpen);
      if (!dialog || typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      if (menuButton?.getAttribute('aria-expanded') === 'true') closeMenu();
      const serviceField = dialog.querySelector('select[name="service"]');
      if (serviceField) {
        serviceField.value = trigger.dataset.dialogService || '';
        serviceField.dispatchEvent(new Event('change', { bubbles: true }));
      }
      dialog.showModal();
      document.body.classList.add('dialog-open');
      const firstField = serviceField && !serviceField.value ? dialog.querySelector('.select-trigger') : dialog.querySelector('input[name="name"]');
      firstField?.focus();
      dialog.addEventListener('close', () => trigger.focus(), { once: true });
    });
  });

  document.querySelectorAll('.request-dialog').forEach((dialog) => {
    dialog.querySelector('[data-dialog-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  });

  // A server endpoint is not configured. Guard against keyboard or scripted submits.
  document.querySelectorAll('.dialog-form').forEach((form) => {
    form.addEventListener('submit', (event) => event.preventDefault());
  });

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });
})();
