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
    if (document.querySelector(".scroll-ball")) return;

    var ball = document.createElement("span");
    ball.className = "scroll-ball";
    ball.setAttribute("aria-hidden", "true");
    ball.innerHTML = BALL_SVG;
    document.body.appendChild(ball);

    var SIZE = 40;
    var TOP = 120;      // resting band, measured from the top of the viewport
    var BOTTOM = 90;    // ...and from the bottom

    var travel = 0;
    var pos = 0;        // current vertical offset
    var vel = 0;        // vertical velocity, in px per frame
    var rot = 0;        // accumulated rotation, degrees
    var running = false;

    var measure = function () {
      travel = Math.max(0, window.innerHeight - TOP - BOTTOM - SIZE);
    };

    var restingPlace = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      return p * travel;
    };

    var paint = function () {
      // Sway sideways with the velocity, the way a ball leans into a roll.
      var sway = Math.max(-16, Math.min(16, vel * SWAY));
      ball.style.transform =
        "translate3d(" + sway.toFixed(2) + "px," + (TOP + pos).toFixed(2) + "px,0) " +
        "rotate(" + rot.toFixed(2) + "deg)";
    };

    // One physics path, two tunings. A scroll-linked position is no more
    // motion than a scrollbar, so reduced-motion keeps the roll — it just
    // stiffens the spring so the ball arrives without bouncing.
    var STIFF = reduceMotion ? 0.3 : 0.075;
    var DAMP = reduceMotion ? 0.55 : 0.86;
    var SWAY = reduceMotion ? 0 : 0.85;

    var lastFrame = 0;

    var tick = function () {
      lastFrame = Date.now();
      var target = restingPlace();
      vel = (vel + (target - pos) * STIFF) * DAMP;
      pos += vel;
      rot += (vel / (Math.PI * SIZE)) * 360;
      paint();

      if (Math.abs(vel) < 0.05 && Math.abs(target - pos) < 0.4) {
        pos = target;
        vel = 0;
        paint();
        running = false;
        return;
      }
      requestAnimationFrame(tick);
    };

    // If frames are not arriving — a throttled tab, a browser that pauses
    // rAF, or no rAF at all — snap to the resting place on scroll instead.
    // The ball then tracks the page exactly; it just loses the overshoot.
    var snap = function () {
      var target = restingPlace();
      rot += ((target - pos) / (Math.PI * SIZE)) * 360;
      pos = target;
      vel = 0;
      paint();
    };

    var hasRaf = typeof window.requestAnimationFrame === "function";

    var wake = function () {
      if (!hasRaf) return snap();
      if (!running) {
        running = true;
        requestAnimationFrame(tick);
      }
      // Frames have stalled: keep the ball honest without them.
      if (Date.now() - lastFrame > 300) snap();
    };

    measure();
    pos = restingPlace();
    paint();

    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", function () {
      measure();
      wake();
    });
  })();

  /* ---- Footer year ------------------------------------------------------ */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
