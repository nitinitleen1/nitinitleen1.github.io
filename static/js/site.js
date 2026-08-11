/*
 * site.js — scroll reveals, the About overlay, and nav scrollspy.
 *
 * Everything here degrades to "already visible, no motion" when the visitor has
 * asked for reduced motion, and to plain anchor links if JS never runs.
 */
(function () {
  'use strict';

  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------- scroll reveals */

  var revealables = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  revealables.forEach(function (el) {
    if (!el.hasAttribute('data-reveal-stagger')) return;
    Array.prototype.forEach.call(el.children, function (child, i) {
      child.style.transitionDelay = i * 60 + 'ms';
    });
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) {
      el.classList.add('is-in');
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );
    revealables.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ----------------------------------------------------------- About overlay */

  var modal = document.getElementById('about-modal');

  if (modal) {
    var openers = Array.prototype.slice.call(document.querySelectorAll('[data-about-open]'));
    var closers = Array.prototype.slice.call(modal.querySelectorAll('[data-about-close]'));
    var panel = modal.querySelector('.about-panel');
    var lastFocused = null;
    var isOpen = false;

    var FOCUSABLE =
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function focusable() {
      return Array.prototype.slice.call(modal.querySelectorAll(FOCUSABLE)).filter(function (el) {
        return el.offsetParent !== null;
      });
    }

    function openModal() {
      if (isOpen) return;
      isOpen = true;
      lastFocused = document.activeElement;
      modal.hidden = false;
      // force a reflow so the transition actually plays
      void modal.offsetWidth;
      modal.classList.add('is-open');
      document.body.classList.add('is-locked');
      openers.forEach(function (el) {
        el.setAttribute('aria-expanded', 'true');
      });
      var first = focusable()[0];
      if (first) first.focus();
    }

    function closeModal() {
      if (!isOpen) return;
      isOpen = false;
      modal.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      openers.forEach(function (el) {
        el.setAttribute('aria-expanded', 'false');
      });

      var finish = function () {
        modal.hidden = true;
        modal.removeEventListener('transitionend', finish);
      };
      if (reduceMotion) finish();
      else modal.addEventListener('transitionend', finish);

      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    openers.forEach(function (el) {
      el.setAttribute('aria-expanded', 'false');
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    });

    closers.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        closeModal();
      });
    });

    modal.addEventListener('click', function (e) {
      if (panel && !panel.contains(e.target)) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;

      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key !== 'Tab') return;

      var items = focusable();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* ------------------------------------------------------------- scrollspy */

  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('[data-section]'));

  if (spyLinks.length) {
    var sections = spyLinks
      .map(function (link) {
        var el = document.getElementById(link.getAttribute('data-section'));
        return el ? { link: link, el: el } : null;
      })
      .filter(Boolean);

    if (sections.length) {
      var current = null;

      var syncSpy = function () {
        var best = sections[0];
        for (var i = 0; i < sections.length; i++) {
          if (sections[i].el.getBoundingClientRect().top <= 140) best = sections[i];
        }
        if (best === current) return;
        current = best;
        sections.forEach(function (s) {
          s.link.classList.toggle('is-active', s === best);
        });
      };

      var ticking = false;
      window.addEventListener(
        'scroll',
        function () {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(function () {
            syncSpy();
            ticking = false;
          });
        },
        { passive: true }
      );
      syncSpy();
    }
  }

  /* -------------------------------------------- smooth in-page anchor jumps */

  if (!reduceMotion) {
    document.addEventListener('click', function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: top, behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    });
  }

  /* ------------------------------------------------ nav shadow once scrolled */

  var nav = document.querySelector('.topbar');
  if (nav) {
    var syncNav = function () {
      nav.classList.toggle('is-stuck', window.pageYOffset > 12);
    };
    window.addEventListener('scroll', syncNav, { passive: true });
    syncNav();
  }
})();
