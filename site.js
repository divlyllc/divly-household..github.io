/* Divly — minimal vanilla JS: theme switch + mobile nav toggle.
   Deferred-safe, no layout shift (theme applied before first paint). */
(function () {
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
    // Close mobile nav after choosing a link
    if (e.target.closest(".nav a") && header) header.classList.remove("nav-open");
  });
})();
