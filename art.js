// Drawings shared by the site's pages: the runner, the ghost, obstacles and a
// small one-tap runner (the same jump as the game: vy -9.6, gravity 0.5,
// speed 4.5 rising to 9). Plain canvas, no libraries.
(function () {
  var Art = {};

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  Art.rr = rr;

  // The runner with its feet at (x, y), s = scale (1 = 18 x 30 game px).
  Art.runner = function (c, x, y, s, t, opt) {
    opt = opt || {};
    var air = opt.air, slide = opt.slide;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    if (slide) c.scale(1.3, 0.5);
    var step = air ? 0 : Math.sin(t * 18) * 3;
    c.fillStyle = "#c26a1d";
    c.fillRect(2, -8 + Math.max(0, step), 5, 8 - Math.max(0, step));
    c.fillRect(11, -8 + Math.max(0, -step), 5, 8 - Math.max(0, -step));
    c.fillStyle = opt.color || "#ff9f43";
    rr(c, 0, -31, 18, 25, 8);
    c.fill();
    c.fillStyle = "#e07a24";
    rr(c, -1, -15, 20, 6, 3);
    c.fill();
    c.fillStyle = "#fff";
    c.beginPath(); c.arc(8, -24, 4, 0, 7); c.arc(15, -24, 4, 0, 7); c.fill();
    c.fillStyle = "#1b1b2f";
    c.beginPath(); c.arc(9.5, -24, 2, 0, 7); c.arc(16.5, -24, 2, 0, 7); c.fill();
    c.strokeStyle = "#1b1b2f"; c.lineWidth = 1.4; c.lineCap = "round";
    c.beginPath(); c.arc(12, -19.5, 2.6, 0.2, Math.PI - 0.2); c.stroke();
    c.restore();
  };

  // The ghost: a cyan dome with a wavy hem, feet at (x, y).
  Art.ghost = function (c, x, y, s, t, alpha) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.globalAlpha = alpha == null ? 0.75 : alpha;
    c.fillStyle = "#9ff0ff";
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -19);
    c.arc(9, -19, 9, Math.PI, 0);
    c.lineTo(18, 0);
    var w = Math.sin(t * 8) * 1.5;
    for (var k = 0; k < 4; k++) {
      c.lineTo(18 - k * 4.5 - 2.25, -4 + (k % 2 ? w : -w));
      c.lineTo(18 - (k + 1) * 4.5, 0);
    }
    c.closePath();
    c.fill();
    c.globalAlpha = 1;
    c.fillStyle = "#2b1a4f";
    c.beginPath(); c.arc(6, -19, 2, 0, 7); c.arc(12.5, -19, 2, 0, 7); c.fill();
    c.restore();
  };

  // A tombstone obstacle in the box (x, y = bottom-left).
  Art.stone = function (c, x, y, w, h) {
    c.fillStyle = "#8a8fa8";
    rr(c, x, y - h, w, h, Math.min(8, w / 2));
    c.fill();
    c.fillStyle = "#6b7089";
    c.fillRect(x + w * 0.62, y - h + 4, w * 0.38 - 2, h - 4);
    c.fillStyle = "#4f9e5b";
    c.fillRect(x - 2, y - 3, w + 4, 3);
  };

  Art.star = function (c, x, y, r, rot) {
    c.save();
    c.translate(x, y);
    c.rotate(rot || 0);
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 ? r * 0.45 : r;
      c.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    c.closePath();
    c.fillStyle = "#ffd166";
    c.fill();
    c.restore();
  };

  // A mini game in a canvas. opts: {ghostEnd: metres where Max's ghost stops,
  // onState(state, metres)}. Returns {start}.
  Art.miniGame = function (canvas, opts) {
    opts = opts || {};
    var c = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, GROUND = 0, SCALE = 1;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var state = "ready", t = 0, acc = 0, last = 0;
    var g;  // game state
    var best = 0;
    try { best = +localStorage.getItem("bmg_best") || 0; } catch (e) {}
    var ghostEnd = (opts.ghostEnd || 150) * 10;

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      SCALE = Math.max(1, Math.min(2.2, H / 150));
      GROUND = H - 34;
    }
    function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
    function reset() {
      var rand = rng(20261022);
      var obs = [], x = 420;
      for (var i = 0; i < 400; i++) {
        var w = 18 + Math.floor(rand() * 15), h = 20 + Math.floor(rand() * 23);
        obs.push({ x: x, w: w, h: h });
        var sp = Math.min(9, 4.5 + x * 0.0004);
        x += w + sp * (46 + rand() * 36);
      }
      g = { d: 0, y: 0, vy: 0, air: false, obs: obs, gd: 30, gy: 0, gvy: 0, gair: false, gone: false, buffer: 0, beat: false };
    }
    function speed(d) { return Math.min(9, 4.5 + d * 0.0004); }
    function hits(d, y) {
      var left = d + 70, right = left + 18;
      for (var i = 0; i < g.obs.length; i++) {
        var o = g.obs[i];
        if (o.x > right) break;
        if (o.x + o.w > left && -y < o.h) return true;
      }
      return false;
    }
    function step() {
      if (g.buffer > 0) g.buffer--;
      if (g.buffer > 0 && !g.air) { g.vy = -9.6; g.air = true; g.buffer = 0; }
      if (g.air) { g.vy += 0.5; g.y += g.vy; if (g.y >= 0) { g.y = 0; g.vy = 0; g.air = false; } }
      g.d += speed(g.d);
      // Max's ghost: jumps cleanly, then stops at ghostEnd.
      if (!g.gone) {
        if (!g.gair) {
          for (var i = 0; i < g.obs.length; i++) {
            var o = g.obs[i], gap = o.x - (g.gd + 70 + 18);
            if (gap > 0 && gap < speed(g.gd) * 15) { g.gvy = -9.6; g.gair = true; break; }
            if (gap > 0) break;
          }
        }
        if (g.gair) { g.gvy += 0.5; g.gy += g.gvy; if (g.gy >= 0) { g.gy = 0; g.gvy = 0; g.gair = false; } }
        g.gd += speed(g.gd);
        if (g.gd >= ghostEnd) g.gone = true;
      }
      if (!g.beat && g.d > ghostEnd) { g.beat = true; if (opts.onState) opts.onState("beat", Math.round(g.d / 10)); }
      if (hits(g.d, g.y)) {
        state = "over";
        var m = Math.round(g.d / 10);
        if (m > best) { best = m; try { localStorage.setItem("bmg_best", best); } catch (e) {} }
        if (opts.onState) opts.onState("over", m, best);
      }
    }
    function draw() {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      var sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#141632"); sky.addColorStop(1, "#3b2c5e");
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      c.fillStyle = "#fff3c4";
      c.beginPath(); c.arc(W * 0.62, 42, 18, 0, 7); c.fill();
      for (var k = 0; k < 24; k++) {
        c.fillStyle = "rgba(255,255,255," + (0.25 + 0.25 * Math.sin(t * 2 + k)) + ")";
        c.fillRect((k * 97.3) % W, (k * 37.7) % (GROUND - 60), 2, 2);
      }
      var d = g.d;
      c.fillStyle = "#2c2650";
      c.beginPath(); c.moveTo(0, GROUND);
      for (var x = 0; x <= W + 40; x += 40) c.lineTo(x, GROUND - 26 - 14 * Math.sin((x + d * 0.3) * 0.01));
      c.lineTo(W, GROUND); c.fill();
      c.fillStyle = "#17142b"; c.fillRect(0, GROUND, W, H - GROUND);
      c.fillStyle = "#6a5ca8"; c.fillRect(0, GROUND, W, 2);
      c.save();
      c.translate(0, GROUND);
      c.scale(SCALE, SCALE);
      var vw = W / SCALE;
      for (var i = 0; i < g.obs.length; i++) {
        var o = g.obs[i], sx = o.x - d;
        if (sx > vw + 20) break;
        if (sx + o.w < -10) continue;
        Art.stone(c, sx, 0, o.w, o.h);
      }
      if (!g.gone) Art.ghost(c, 70 + g.gd - d, g.gy, 1, t);
      Art.runner(c, 70, g.y, 1, t, { air: g.air });
      c.restore();
      c.font = "800 " + Math.round(18 + SCALE * 4) + "px 'Baloo 2', sans-serif";
      c.fillStyle = "#fff";
      c.textAlign = "right";
      c.fillText(Math.round(d / 10) + " m", W - 16, 34);
      if (!g.gone && state === "playing") {
        c.textAlign = "left";
        c.font = "800 14px Nunito, sans-serif";
        c.fillStyle = "#9ff0ff";
        c.fillText((opts.ghostLabel || "Max's ghost") + ": " + Math.round(ghostEnd / 10) + " m", 16, 30);
      }
    }
    function loop(now) {
      var dt = Math.min(0.1, (now - last) / 1000 || 0);
      last = now;
      t += dt;
      if (state === "playing") {
        acc += dt;
        while (acc >= 1 / 60 && state === "playing") { step(); acc -= 1 / 60; }
      }
      draw();
      if (state === "playing" || !reduce) requestAnimationFrame(loop);
      else running = false;
    }
    var running = false;
    function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } }
    function tap(e) {
      if (e) e.preventDefault();
      if (state === "playing") { g.buffer = 6; return; }
      reset(); state = "playing"; acc = 0;
      if (opts.onState) opts.onState("playing", 0);
      kick();
    }
    canvas.addEventListener("pointerdown", tap);
    canvas.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") tap(e); });
    window.addEventListener("resize", function () { resize(); draw(); });
    resize(); reset(); draw(); kick();
    return { tap: tap, best: function () { return best; } };
  };

  window.Art = Art;
})();
