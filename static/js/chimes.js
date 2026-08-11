/*
 * chimes.js — hanging beaded strands, verlet-simulated.
 *
 * Strands are pinned at the top of the hero and fall under gravity. Moving the
 * pointer (or dragging on touch) parts them; they swing and settle. Sweeping
 * across a strand rings it, but only once the visitor has unmuted.
 *
 * No dependencies. No audio files — the chime is synthesised on the fly.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('chimes-canvas');
  if (!canvas || !canvas.getContext) return;

  var host = canvas.parentNode;
  var ctx = canvas.getContext('2d');
  var TAU = Math.PI * 2;

  var motionQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
  var reduceMotion = motionQuery ? motionQuery.matches : false;

  /* ---------------------------------------------------------------- tuning */

  var POINTS_PER_STRAND = 18;
  var GRAVITY = 0.42;
  var DAMPING = 0.985;
  var RELAX_PASSES = 6;
  var POINTER_RADIUS = 98;
  var STRAND_LENGTH_RATIO = 0.78; // longest strand, as a fraction of hero height
  var STRIKE_SPEED = 2.2; // px per frame before a strand rings
  var STRIKE_COOLDOWN = 170; // ms

  /* ------------------------------------------------------------------ state */

  var W = 0;
  var H = 0;
  var strands = [];
  var maxReach = 0;
  var rafId = 0;
  var running = false;
  var visible = true;

  var pointer = { x: -9999, y: -9999, px: -9999, py: -9999, active: false };

  var styles = getComputedStyle(document.documentElement);
  function token(name, fallback) {
    var v = styles.getPropertyValue(name);
    return v && v.trim() ? v.trim() : fallback;
  }
  var INK = token('--strand-ink', 'rgba(36, 34, 27, 0.26)');
  var BEAD = token('--strand-bead', 'rgba(36, 34, 27, 0.4)');
  var ACCENT = token('--accent-lacquer', '#9c3b28');

  /* ------------------------------------------------------------------ audio */

  // Two octaves of a major pentatonic, so a left-to-right sweep plays a run
  // rather than a chromatic smear.
  var SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26];
  var BASE_FREQ = 392; // G4

  var audio = {
    on: false,
    ctx: null,
    master: null,

    init: function () {
      if (this.ctx) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      return true;
    },

    ring: function (index, velocity) {
      if (!this.on || !this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      var t = this.ctx.currentTime;
      var freq = BASE_FREQ * Math.pow(2, SCALE[index % SCALE.length] / 12);

      var gain = this.ctx.createGain();
      var filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3400;

      var body = this.ctx.createOscillator();
      body.type = 'triangle';
      body.frequency.value = freq;

      var shimmer = this.ctx.createOscillator();
      shimmer.type = 'sine';
      shimmer.frequency.value = freq * 2.01; // slight detune, gives it a beat
      var shimmerGain = this.ctx.createGain();
      shimmerGain.gain.value = 0.3;

      body.connect(gain);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(gain);
      gain.connect(filter);
      filter.connect(this.master);

      var peak = 0.16 * (0.45 + velocity * 0.55);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.25);

      body.start(t);
      shimmer.start(t);
      body.stop(t + 1.3);
      shimmer.stop(t + 1.3);
    }
  };

  /* ------------------------------------------------------------------ build */

  function build() {
    var rect = host.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var count = Math.max(10, Math.min(34, Math.round(W / 46)));
    var gap = W / (count + 1);
    var longest = H * STRAND_LENGTH_RATIO;

    strands = [];
    maxReach = 0;

    for (var s = 0; s < count; s++) {
      var x = gap * (s + 1);

      // Vary the hem so the curtain reads as hand-strung rather than machined:
      // a slow wave across the row, plus a small deterministic jitter.
      var wave = Math.sin(s * 0.62) * 0.5 + Math.sin(s * 1.71 + 1.3) * 0.5;
      var jitter = ((Math.sin(s * 12.9898) * 43758.5453) % 1 + 1) % 1;
      var length = longest * (0.72 + 0.14 * (wave * 0.5 + 0.5) + 0.14 * jitter);
      var spacing = length / (POINTS_PER_STRAND - 1);
      if (length > maxReach) maxReach = length;

      var pts = [];
      for (var i = 0; i < POINTS_PER_STRAND; i++) {
        pts.push({ x: x, y: i * spacing, ox: x, oy: i * spacing });
      }
      strands.push({ restX: x, pts: pts, spacing: spacing, lastRing: 0 });
    }
  }

  /* ---------------------------------------------------------------- physics */

  function step() {
    var dx = pointer.x - pointer.px;
    var dy = pointer.y - pointer.py;
    var moving = pointer.active && Math.abs(dx) + Math.abs(dy) > 0.01;

    for (var s = 0; s < strands.length; s++) {
      var pts = strands[s].pts;
      var spacing = strands[s].spacing;
      var i, p;

      // integrate
      for (i = 1; i < pts.length; i++) {
        p = pts[i];
        var vx = (p.x - p.ox) * DAMPING;
        var vy = (p.y - p.oy) * DAMPING;
        p.ox = p.x;
        p.oy = p.y;
        p.x += vx;
        p.y += vy + GRAVITY;
      }

      // pointer push, with linear falloff
      if (moving) {
        for (i = 1; i < pts.length; i++) {
          p = pts[i];
          var ddx = p.x - pointer.x;
          var ddy = p.y - pointer.y;
          var d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < POINTER_RADIUS) {
            var f = 1 - d / POINTER_RADIUS;
            p.x += dx * f * 0.5;
            p.y += dy * f * 0.28;
          }
        }
      }

      // hold segment length; point 0 stays pinned to the top edge
      for (var pass = 0; pass < RELAX_PASSES; pass++) {
        pts[0].x = strands[s].restX;
        pts[0].y = 0;
        for (i = 0; i < pts.length - 1; i++) {
          var a = pts[i];
          var b = pts[i + 1];
          var ax = b.x - a.x;
          var ay = b.y - a.y;
          var dist = Math.sqrt(ax * ax + ay * ay) || 0.0001;
          var diff = ((dist - spacing) / dist) * 0.5;
          var ox = ax * diff;
          var oy = ay * diff;
          if (i === 0) {
            b.x -= ox * 2;
            b.y -= oy * 2;
          } else {
            a.x += ox;
            a.y += oy;
            b.x -= ox;
            b.y -= oy;
          }
        }
      }
    }

    if (audio.on && pointer.active) {
      var speed = Math.abs(dx);
      if (speed >= STRIKE_SPEED && pointer.y >= 0 && pointer.y <= maxReach) {
        var lo = Math.min(pointer.px, pointer.x);
        var hi = Math.max(pointer.px, pointer.x);
        var now = Date.now();
        for (var k = 0; k < strands.length; k++) {
          var st = strands[k];
          if (st.restX < lo || st.restX > hi) continue;
          if (pointer.y > (POINTS_PER_STRAND - 1) * st.spacing) continue;
          if (now - st.lastRing < STRIKE_COOLDOWN) continue;
          st.lastRing = now;
          audio.ring(k, Math.min(1, speed / 26));
        }
      }
    }

    pointer.px = pointer.x;
    pointer.py = pointer.y;
  }

  /* ----------------------------------------------------------------- render */

  function render() {
    ctx.clearRect(0, 0, W, H);

    for (var s = 0; s < strands.length; s++) {
      var pts = strands[s].pts;
      var last = pts.length - 1;
      var i;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (i = 1; i < last; i++) {
        ctx.quadraticCurveTo(
          pts[i].x,
          pts[i].y,
          (pts[i].x + pts[i + 1].x) / 2,
          (pts[i].y + pts[i + 1].y) / 2
        );
      }
      ctx.lineTo(pts[last].x, pts[last].y);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = BEAD;
      for (i = 3; i <= last; i += 3) {
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 1.5 + (i / last) * 1.4, 0, TAU);
        ctx.fill();
      }

      // one warm bead per strand, low on the run
      var accentAt = Math.floor(last * 0.62);
      ctx.beginPath();
      ctx.arc(pts[accentAt].x, pts[accentAt].y, 3.1, 0, TAU);
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = ACCENT;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------------- loop */

  function frame() {
    step();
    render();
    rafId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    window.cancelAnimationFrame(rafId);
  }

  function settle() {
    // Drop the strands straight down and draw a single frame. Used for
    // reduced-motion, where nothing should move at all.
    build();
    render();
  }

  /* ----------------------------------------------------------------- events */

  function localPoint(e) {
    var rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  }

  function onMove(e) {
    if (reduceMotion) return;
    if (!pointer.active) {
      localPoint(e);
      pointer.px = pointer.x;
      pointer.py = pointer.y;
      pointer.active = true;
      return;
    }
    localPoint(e);
  }

  function onLeave() {
    pointer.active = false;
    pointer.x = pointer.px = -9999;
    pointer.y = pointer.py = -9999;
  }

  if (window.PointerEvent) {
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerdown', onMove);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('pointercancel', onLeave);
  } else {
    host.addEventListener('mousemove', onMove);
    host.addEventListener('mouseleave', onLeave);
    host.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches.length) onMove(e.touches[0]);
    });
    host.addEventListener('touchend', onLeave);
  }

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      build();
      if (reduceMotion) render();
    }, 160);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (visible && !reduceMotion) start();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 }
    ).observe(host);
  }

  if (motionQuery && motionQuery.addEventListener) {
    motionQuery.addEventListener('change', function (e) {
      reduceMotion = e.matches;
      if (reduceMotion) {
        stop();
        settle();
      } else {
        start();
      }
    });
  }

  /* --------------------------------------------------------- audio controls */

  var STORAGE_KEY = 'chimes:audio';
  var toggle = document.getElementById('chimes-audio');

  function readStored() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'on';
    } catch (err) {
      return false;
    }
  }

  function writeStored(on) {
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch (err) {
      /* private mode — preference simply won't persist */
    }
  }

  function applyAudio(on) {
    // The AudioContext is only created once the visitor asks for sound, which
    // sidesteps browser autoplay policy entirely.
    if (on && !audio.init()) return;
    audio.on = on;
    if (on && audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
    if (toggle) {
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      toggle.classList.toggle('is-on', on);
      toggle.setAttribute('aria-label', on ? 'Mute chimes' : 'Unmute chimes');
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = !audio.on;
      applyAudio(next);
      writeStored(audio.on);
    });
    // Restore the stored preference, but only wire it up on first interaction:
    // creating an AudioContext before a gesture leaves it suspended anyway.
    if (readStored()) {
      var restore = function () {
        applyAudio(true);
        document.removeEventListener('pointerdown', restore);
        document.removeEventListener('keydown', restore);
      };
      document.addEventListener('pointerdown', restore);
      document.addEventListener('keydown', restore);
      toggle.setAttribute('aria-pressed', 'true');
      toggle.classList.add('is-on');
    }
  }

  /* ------------------------------------------------------------------ boot */

  build();
  if (reduceMotion) render();
  else start();
})();
