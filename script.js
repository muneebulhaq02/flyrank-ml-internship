(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Scroll progress rail
  --------------------------------------------------------------------- */
  var progressFill = document.querySelector(".progress-fill");
  function updateProgress() {
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var height = doc.scrollHeight - doc.clientHeight;
    var pct = height > 0 ? (scrollTop / height) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + "%";
  }

  /* ---------------------------------------------------------------------
     Sticky navbar shadow on scroll
  --------------------------------------------------------------------- */
  var siteNav = document.querySelector(".site-nav");
  function updateNavShadow() {
    if (!siteNav) return;
    if (window.scrollY > 8) {
      siteNav.classList.add("is-scrolled");
    } else {
      siteNav.classList.remove("is-scrolled");
    }
  }

  /* ---------------------------------------------------------------------
     Back to top button
  --------------------------------------------------------------------- */
  var toTop = document.querySelector(".to-top");
  function updateToTop() {
    if (!toTop) return;
    if (window.scrollY > window.innerHeight * 0.8) {
      toTop.classList.add("is-visible");
    } else {
      toTop.classList.remove("is-visible");
    }
  }
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  var ticking = false;
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateProgress();
          updateToTop();
          updateNavShadow();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  updateProgress();
  updateToTop();
  updateNavShadow();

  /* ---------------------------------------------------------------------
     Active nav-link highlighting via IntersectionObserver
  --------------------------------------------------------------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-links a"));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href");
      if (!id || id.charAt(0) !== "#") return null;
      return document.querySelector(id);
    })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute("href") === "#" + id;
      link.classList.toggle("active", match);
      if (match) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-45% 0px -50% 0px",
        threshold: 0,
      }
    );
    sections.forEach(function (sec) {
      navObserver.observe(sec);
    });
  }

  /* keep sticky-nav offset correct for in-page anchor jumps (no-smooth fallback) */
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      var id = link.getAttribute("href");
      if (id && id.charAt(0) === "#") {
        window.setTimeout(function () {
          setActive(id.slice(1));
        }, 400);
      }
    });
  });

  /* ---------------------------------------------------------------------
     Reveal-on-scroll animation
  --------------------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 60 + "ms";
      revealObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
     Lightbox for figures
  --------------------------------------------------------------------- */
  var lightbox = document.querySelector(".lightbox");
  var lightboxImg = lightbox ? lightbox.querySelector("img") : null;
  var lightboxCap = lightbox ? lightbox.querySelector(".lightbox-cap") : null;
  var lightboxClose = lightbox ? lightbox.querySelector(".lightbox-close") : null;
  var lastFocused = null;

  function openLightbox(src, alt, caption) {
    if (!lightbox || !lightboxImg) return;
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    if (lightboxCap) lightboxCap.textContent = caption || "";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lightboxImg) lightboxImg.src = "";
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  document.querySelectorAll(".fig-media").forEach(function (media) {
    var img = media.querySelector("img");
    if (!img) return;
    media.setAttribute("role", "button");
    media.setAttribute("tabindex", "0");
    media.setAttribute("aria-label", "Open figure " + (img.alt || "") + " in full size");

    var figEl = media.closest("figure");
    var capText = figEl ? figEl.querySelector(".fig-caption-text") : null;

    function trigger() {
      openLightbox(img.currentSrc || img.src, img.alt, capText ? capText.textContent : img.alt);
    }
    media.addEventListener("click", trigger);
    media.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        trigger();
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });

  /* ---------------------------------------------------------------------
     Hero dashboard: mouse parallax / tilt effect
  --------------------------------------------------------------------- */
  var heroVisual = document.getElementById("heroVisual");
  var dashTilt = document.getElementById("dashTilt");
  if (heroVisual && dashTilt && !prefersReducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var tiltRAF = null;
    heroVisual.addEventListener("mousemove", function (e) {
      var rect = heroVisual.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      var maxTilt = 7;
      if (tiltRAF) cancelAnimationFrame(tiltRAF);
      tiltRAF = requestAnimationFrame(function () {
        dashTilt.style.setProperty("--tilt-x", (px * maxTilt * 2).toFixed(2) + "deg");
        dashTilt.style.setProperty("--tilt-y", (-py * maxTilt).toFixed(2) + "deg");
      });
    });
    heroVisual.addEventListener("mouseleave", function () {
      if (tiltRAF) cancelAnimationFrame(tiltRAF);
      dashTilt.style.setProperty("--tilt-x", "0deg");
      dashTilt.style.setProperty("--tilt-y", "0deg");
    });
  }

  /* ---------------------------------------------------------------------
     Count-up animation for numeric metrics
     Usage: <span class="countup" data-target="0.6905" data-decimals="4"
                   data-prefix="" data-suffix="">0.6905</span>
     The element's static text is already the correct final value (so it
     degrades gracefully with no JS / reduced motion). When it scrolls
     into view, JS counts it up from 0 for a short, tasteful beat.
  --------------------------------------------------------------------- */
  var countEls = Array.prototype.slice.call(document.querySelectorAll(".countup"));
  if (countEls.length && !prefersReducedMotion && "IntersectionObserver" in window) {
    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function formatNum(value, decimals, useGrouping) {
      var opts = { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
      if (useGrouping) opts.useGrouping = true;
      else opts.useGrouping = false;
      return value.toLocaleString("en-US", opts);
    }

    function runCountUp(el) {
      var target = parseFloat(el.getAttribute("data-target"));
      if (isNaN(target)) return;
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      var grouped = el.hasAttribute("data-grouped");
      var duration = 900;
      var startTime = null;

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = easeOutCubic(progress);
        var current = target * eased;
        el.textContent = prefix + formatNum(current, decimals, grouped) + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = prefix + formatNum(target, decimals, grouped) + suffix;
        }
      }
      requestAnimationFrame(step);
    }

    var countObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCountUp(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    countEls.forEach(function (el) {
      countObserver.observe(el);
    });
  }

  /* ---------------------------------------------------------------------
     Current year in footer
  --------------------------------------------------------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();