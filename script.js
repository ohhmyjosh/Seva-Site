/* ==========================================================================
   SEVA APP — site behaviour
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Header: solid state once the page has moved ---------------------- */

  var head = document.querySelector(".site-head");

  if (head) {
    var syncHead = function () {
      head.classList.toggle("is-stuck", window.scrollY > 12);
    };
    syncHead();
    window.addEventListener("scroll", syncHead, { passive: true });
  }

  /* ---- Mobile navigation ------------------------------------------------ */

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");

  if (toggle && nav) {
    var setNav = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", function () {
      setNav(!nav.classList.contains("is-open"));
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNav(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setNav(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && nav.classList.contains("is-open")) setNav(false);
    });
  }

  /* ---- Reveal on scroll, staggered within each group -------------------- */

  var reveals = document.querySelectorAll(".reveal");

  if (!reveals.length) {
    // nothing to do
  } else if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    // Siblings that reveal together get a short cascade rather than a single pop.
    var seen = new Set();
    reveals.forEach(function (el) {
      var parent = el.parentElement;
      if (parent && !seen.has(parent)) {
        seen.add(parent);
        var group = Array.prototype.filter.call(parent.children, function (child) {
          return child.classList.contains("reveal");
        });
        group.forEach(function (child, i) {
          child.style.setProperty("--d", Math.min(i, 6) * 70 + "ms");
        });
      }
      revealObserver.observe(el);
    });
  }

  /* ---- Product story: steps drive the sticky device --------------------- */

  // Scoped to the story: the hero holds a static device with its own screen
  // that must never be switched off.
  var story = document.querySelector(".story");
  var steps = story ? story.querySelectorAll(".step") : [];
  var screens = story ? story.querySelectorAll(".screen") : [];

  if (steps.length && screens.length) {
    var activate = function (id) {
      steps.forEach(function (step) {
        step.classList.toggle("is-active", step.dataset.step === id);
      });
      screens.forEach(function (screen) {
        screen.classList.toggle("is-active", screen.dataset.screen === id);
      });
    };

    if ("IntersectionObserver" in window) {
      // A narrow band across the viewport decides which step owns the device.
      // On desktop the device sits beside the steps, so the band belongs in the
      // middle. On mobile the device is stuck to the top of the viewport, so the
      // band has to sit below it or the "current" step would be the one hidden
      // behind the phone.
      var stacked = window.matchMedia("(max-width: 900px)");
      var storyObserver = null;

      var onIntersect = function (entries) {
        var best = null;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        });
        if (best) activate(best.target.dataset.step);
      };

      var buildObserver = function () {
        if (storyObserver) storyObserver.disconnect();
        storyObserver = new IntersectionObserver(onIntersect, {
          threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
          rootMargin: stacked.matches ? "-64% 0px -26% 0px" : "-45% 0px -45% 0px",
        });
        steps.forEach(function (step) {
          storyObserver.observe(step);
        });
      };

      buildObserver();

      if (stacked.addEventListener) {
        stacked.addEventListener("change", buildObserver);
      } else if (stacked.addListener) {
        stacked.addListener(buildObserver);
      }
    }

    activate("1");
  }

  /* ---- Ticker: clone the track so the loop has no seam ------------------ */

  document.querySelectorAll(".ticker").forEach(function (ticker) {
    var track = ticker.querySelector(".ticker__track");
    if (!track || reduceMotion) return;
    var clone = track.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    ticker.appendChild(clone);
  });

  /* ---- Contact form ----------------------------------------------------- */

  var form = document.querySelector(".form");

  if (form) {
    var status = form.querySelector(".form__status");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var email = (data.get("email") || "").toString().trim();
      var org = (data.get("organization") || "").toString().trim();
      var phone = (data.get("phone") || "").toString().trim();
      var message = (data.get("message") || "").toString().trim();

      var lines = [
        "Name: " + name,
        "Email: " + email,
        "Phone: " + (phone || "-"),
        "Organization: " + (org || "-"),
        "",
        message,
      ];

      // No backend yet — hand the enquiry to the visitor's mail client and
      // confirm inline rather than throwing an alert.
      var href =
        "mailto:anugrahjosiahgupta@gmail.com" +
        "?subject=" +
        encodeURIComponent("Partnership enquiry from " + (name || "the Seva site")) +
        "&body=" +
        encodeURIComponent(lines.join("\n"));

      // Confirm first: handing off to a mail client can take focus away from the
      // page, and the visitor needs to see what happened either way.
      if (status) {
        status.textContent =
          "Thank you, " +
          (name || "there") +
          ". Your email app should open with this enquiry ready to send. " +
          "If nothing opens, write to anugrahjosiahgupta@gmail.com directly.";
        status.classList.add("is-shown");
      }

      window.setTimeout(function () {
        window.location.href = href;
      }, 120);

      form.reset();
    });
  }

  /* ---- Scroll ball ------------------------------------------------------
     A football rolling down a rail at the right edge, doubling as the read
     progress indicator. Two details make it feel real rather than decorative:
     it eases toward the scroll position instead of snapping to it, and it
     rotates by actual arc length (distance / circumference), so the roll
     matches the travel. */

  var BALL_SVG =
    '<svg viewBox="0 0 100 100" aria-hidden="true">' +
    '<defs><clipPath id="sevaBallClip"><circle cx="50" cy="50" r="47"/></clipPath></defs>' +
    '<circle cx="50" cy="50" r="47" fill="#f4f6fa"/>' +
    '<g clip-path="url(#sevaBallClip)" fill="#0a0b0d">' +
    '<polygon points="50.0,29.0 70.0,43.5 62.3,67.0 37.7,67.0 30.0,43.5"/>' +
    '<polygon points="95.9,19.1 74.7,26.0 61.6,7.9 74.7,-10.1 95.9,-3.2"/>' +
    '<polygon points="93.6,84.1 80.5,66.1 93.6,48.0 114.8,54.9 114.8,77.2"/>' +
    '<polygon points="31.0,102.0 44.1,83.9 65.4,90.8 65.4,113.2 44.1,120.1"/>' +
    '<polygon points="-5.3,48.0 15.9,54.9 15.9,77.2 -5.3,84.1 -18.5,66.1"/>' +
    '<polygon points="34.8,-3.2 34.8,19.1 13.6,26.0 0.4,7.9 13.6,-10.1"/>' +
    '</g>' +
    '<g clip-path="url(#sevaBallClip)" stroke="#0a0b0d" stroke-width="3.2" stroke-linecap="round">' +
    '<path d="M50.0 29.0L50.0 16.0"/><path d="M70.0 43.5L82.3 39.5"/>' +
    '<path d="M62.3 67.0L70.0 77.5"/><path d="M37.7 67.0L30.0 77.5"/>' +
    '<path d="M30.0 43.5L17.7 39.5"/>' +
    '</g>' +
    '<circle cx="50" cy="50" r="46" fill="none" stroke="#0a0b0d" stroke-width="2.4" opacity="0.35"/>' +
    "</svg>";

  (function () {
    if (document.querySelector(".play-ball")) return;

    var ball = document.createElement("span");
    ball.className = "play-ball";
    ball.setAttribute("aria-hidden", "true");
    ball.innerHTML = BALL_SVG;
    document.body.appendChild(ball);

    var GRAVITY = 0.62;      // px per frame per frame
    var BOUNCE = 0.74;       // energy kept on a wall or floor hit
    var AIR = 0.995;         // drag while in flight
    var ROLL = 0.982;        // drag while touching the floor
    var KICK_RANGE = 44;     // how close the pointer has to get
    var KICK_POWER = 1.7;
    var KICK_SPEED = 0.09;   // extra force from how fast the pointer moves
    var MIN_SPEED = 3;       // ignore slow drifts entirely
    var MAX_V = 20;          // velocity ceiling, so it never rockets away
    var SLEEP = 0.28;

    var d = 30, r = 15;      // diameter and radius, re-read from the element
    var x = 0, y = 0, vx = 0, vy = 0, rot = 0;
    var running = false, idle = 0;
    var px = -999, py = -999, pvx = 0, pvy = 0;
    var bounds = { l: 0, r: 0, t: 0, b: 0 };

    var measure = function () {
      d = ball.offsetWidth || 30;
      r = d / 2;
      var head = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--head-h")
      );
      // --head-h is in rem; fall back to a sensible pixel value.
      var headPx = head ? head * 16 : 72;

      // A window that is restoring, hidden or still laying out can report a
      // zero viewport. Measuring then would put the ball at a negative
      // coordinate — off screen, with nothing to bring it back.
      var vw = window.innerWidth || document.documentElement.clientWidth || 0;
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (vw < 240 || vh < 240) return false;

      bounds.l = r + 8;
      bounds.r = vw - r - 8;
      bounds.t = headPx + r + 8;
      bounds.b = vh - r - 8;
      return true;
    };

    var reposition = function () {
      x = Math.max(bounds.l, Math.min(bounds.r, x));
      y = Math.max(bounds.t, Math.min(bounds.b, y));
      paint();
    };

    var paint = function () {
      ball.style.transform =
        "translate3d(" + (x - r).toFixed(1) + "px," + (y - r).toFixed(1) + "px,0) " +
        "rotate(" + rot.toFixed(1) + "deg)";
    };

    var step = function () {
      vy += GRAVITY;
      x += vx;
      y += vy;

      var onGround = false;

      if (x < bounds.l) { x = bounds.l; vx = -vx * BOUNCE; }
      if (x > bounds.r) { x = bounds.r; vx = -vx * BOUNCE; }
      if (y < bounds.t) { y = bounds.t; vy = -vy * BOUNCE; }
      if (y > bounds.b) {
        y = bounds.b;
        vy = -vy * BOUNCE;
        onGround = true;
        // Stop micro-bouncing once there is barely any energy left.
        if (Math.abs(vy) < 1.2) vy = 0;
      }

      var drag = onGround ? ROLL : AIR;
      vx *= drag;
      if (!onGround) vy *= AIR;

      // Rotation follows horizontal travel, so the roll matches the ground.
      rot += (vx / (Math.PI * d)) * 360;
      paint();

      var still = Math.abs(vx) < SLEEP && Math.abs(vy) < SLEEP && y >= bounds.b - 0.6;
      idle = still ? idle + 1 : 0;
      return idle < 30;
    };

    var loop = function () {
      if (step()) {
        requestAnimationFrame(loop);
      } else {
        running = false;
      }
    };

    var wake = function () {
      idle = 0;
      if (running) return;
      running = true;
      requestAnimationFrame(loop);
    };

    // Kick: you have to actually move the pointer into it. A slow drift past
    // does nothing, so the ball is not permanently twitching at the edge of
    // the cursor.
    var kick = function (mx, my, boost, speed) {
      var dx = x - mx;
      var dy = y - my;
      var dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      var reach = r + KICK_RANGE;
      if (dist > reach) return;

      var near = 1 - dist / reach;
      var force = near * KICK_POWER * (boost || 1);
      if (speed) force += Math.min(26, speed) * KICK_SPEED * near;

      vx += (dx / dist) * force;
      vy += (dy / dist) * force - 0.6;   // a little lift, so it pops
      vx = Math.max(-MAX_V, Math.min(MAX_V, vx));
      vy = Math.max(-MAX_V, Math.min(MAX_V, vy));
      wake();
    };

    window.addEventListener("mousemove", function (e) {
      pvx = e.clientX - px;
      pvy = e.clientY - py;
      px = e.clientX;
      py = e.clientY;
      var speed = Math.sqrt(pvx * pvx + pvy * pvy);
      // Below the threshold the pointer is just passing through.
      if (speed < MIN_SPEED) return;
      kick(px, py, 1, speed);
    }, { passive: true });

    // A click is the deliberate one, so it still hits properly.
    window.addEventListener("click", function (e) {
      kick(e.clientX, e.clientY, 4.5, 0);
    }, { passive: true });

    // Scrolling jostles it, the way a ball on a moving surface would move.
    var lastScroll = window.scrollY;
    window.addEventListener("scroll", function () {
      var delta = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      vy -= Math.max(-5, Math.min(5, delta * 0.12));
      vx += Math.max(-1.6, Math.min(1.6, delta * 0.028));
      wake();
    }, { passive: true });

    var refit = function () {
      if (!measure()) return;
      reposition();
      wake();
    };

    window.addEventListener("resize", refit);
    window.addEventListener("orientationchange", refit);
    window.addEventListener("load", refit);
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) refit();
    });

    var launch = function () {
      if (!measure()) {
        // Viewport not usable yet — try again on the next frame.
        return requestAnimationFrame(launch);
      }
      // Drop it in from the upper right so it announces itself on arrival.
      x = bounds.r - 40;
      y = bounds.t + 20;
      vx = -2.2;
      vy = 0;
      paint();
      wake();
    };

    launch();
  })();

  /* ---- Footer year ------------------------------------------------------ */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
