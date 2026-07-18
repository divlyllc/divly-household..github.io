/* Divly — minimal vanilla JS: theme switch + mobile nav toggle + launch capture.
   Deferred-safe, no layout shift (theme applied before first paint). */
(function () {
  /* TODO(launch): set NOTIFY_ENDPOINT to the email provider's POST URL
     (Formspree form URL, Buttondown, or Kit). Until it is set, the signup
     forms render fully but show the inline error state on submit. Every
     module posts { email, source } where source is one of:
     hero, pricing, footer, blog, bar. */
  var NOTIFY_ENDPOINT = "";
  var ANNOUNCE_KEY = "divly-announce-dismissed";
  var KEY = "divly-theme";
  function apply(t) { document.documentElement.setAttribute("data-theme", t); }
  // Always set an explicit data-theme so [data-theme="dark"] rules are the
  // single source of truth (the @media block in CSS is only a pre-JS flash guard).
  var initial = null;
  try { initial = localStorage.getItem(KEY); } catch (e) {}
  apply(initial || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  document.addEventListener("click", function (e) {
    // Theme switch
    var tt = e.target.closest("[data-theme-toggle]");
    if (tt) {
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur ? (cur === "dark" ? "light" : "dark")
        : (matchMedia("(prefers-color-scheme: dark)").matches ? "light" : "dark");
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e2) {}
      return;
    }
    // Mobile nav toggle
    var nt = e.target.closest("[data-nav-toggle]");
    var header = document.querySelector(".site-header");
    if (nt && header) {
      header.classList.toggle("nav-open");
      nt.setAttribute("aria-expanded", header.classList.contains("nav-open"));
      return;
    }
    // Dismiss announcement bar (remembered for the session)
    var ac = e.target.closest("[data-announce-close]");
    if (ac) {
      var bar = document.getElementById("announce-bar");
      if (bar) bar.setAttribute("hidden", "");
      try { sessionStorage.setItem(ANNOUNCE_KEY, "1"); } catch (e3) {}
      return;
    }
    // Close mobile nav after choosing a link
    if (e.target.closest(".nav a") && header) header.classList.remove("nav-open");
  });

  // Launch capture: inline submit with success/error states.
  document.addEventListener("submit", function (e) {
    var form = e.target.closest("[data-notify-form]");
    if (!form) return;
    e.preventDefault();
    var wrap = form.parentNode;
    var input = form.querySelector("input[type=email]");
    var okMsg = wrap.querySelector(".notify-success");
    var errMsg = wrap.querySelector(".notify-error");
    var btn = form.querySelector("button[type=submit]");
    if (okMsg) okMsg.setAttribute("hidden", "");
    if (errMsg) errMsg.setAttribute("hidden", "");
    var email = input && input.value ? input.value.trim() : "";
    function fail() { if (errMsg) errMsg.removeAttribute("hidden"); if (btn) btn.disabled = false; }
    if (!email) { fail(); return; }
    if (!NOTIFY_ENDPOINT) {
      console.warn("Divly notify: NOTIFY_ENDPOINT not configured; signup not sent.");
      fail();
      return;
    }
    if (btn) btn.disabled = true;
    fetch(NOTIFY_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, source: form.getAttribute("data-source") || "site" })
    }).then(function (r) {
      if (!r.ok) throw new Error("bad status");
      form.setAttribute("hidden", "");
      if (okMsg) okMsg.removeAttribute("hidden");
    }).catch(fail);
  });

  // Hide the announcement bar on load if dismissed earlier this session.
  document.addEventListener("DOMContentLoaded", function () {
    try {
      if (sessionStorage.getItem(ANNOUNCE_KEY)) {
        var bar = document.getElementById("announce-bar");
        if (bar) bar.setAttribute("hidden", "");
      }
    } catch (e) {}
  });
})();
