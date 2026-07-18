/* Divly — minimal vanilla JS: theme switch + mobile nav toggle + launch capture.
   Deferred-safe, no layout shift (theme applied before first paint). */
(function () {
  /* Kit (formerly ConvertKit) form submission endpoint.
     Paste the FULL URL from your Kit form's HTML embed `action="..."`
     attribute here, e.g. "https://app.kit.com/forms/1234567/subscriptions".
     Until it is set, the signup forms render fully but show the inline
     error state on submit. Each module sends the subscriber email plus a
     "source" custom field (create a custom field named "source" in Kit to
     record it) valued one of: hero, pricing, footer, blog, bar. Double
     opt-in is controlled by the Kit form's own settings. */
  var KIT_FORM_ACTION = "https://app.kit.com/forms/9697162/subscriptions";
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
    // Dismiss announcement bar for the current view only (it returns on
    // the next page load / reload, so a hard reload always shows it again).
    var ac = e.target.closest("[data-announce-close]");
    if (ac) {
      var bar = document.getElementById("announce-bar");
      if (bar) bar.setAttribute("hidden", "");
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
    if (!KIT_FORM_ACTION) {
      console.warn("Divly notify: KIT_FORM_ACTION not set; signup not sent.");
      fail();
      return;
    }
    if (btn) btn.disabled = true;
    var body = new URLSearchParams();
    body.set("email_address", email);
    body.set("fields[source]", form.getAttribute("data-source") || "site");
    fetch(KIT_FORM_ACTION, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: body
    }).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, data: d }; },
                          function () { return { ok: r.ok, data: {} }; });
    }).then(function (res) {
      // Kit returns { status: "success" } (200) once the subscriber is
      // accepted; with double opt-in a confirmation email is then sent.
      if (!res.ok || (res.data.status && res.data.status !== "success")) {
        throw new Error("kit rejected");
      }
      form.setAttribute("hidden", "");
      if (okMsg) okMsg.removeAttribute("hidden");
    }).catch(fail);
  });
})();
