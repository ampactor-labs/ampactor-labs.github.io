// Pre-boot shim + visible error reporter. Inlined into every entry's <head>
// by the site-head plugin in vite.config.js, before the app module, so that
// (1) older mobile Safari gets the few modern APIs our deps assume, and
// (2) if the app still fails to boot, the real error is shown on-page
// instead of a blank screen — essential for debugging devices we can't
// open a console on. Classic script: no imports, no exports.
(function () {
  if (!Object.hasOwn) {
    Object.hasOwn = function (o, p) {
      return Object.prototype.hasOwnProperty.call(o, p);
    };
  }
  function at(n) {
    n = Math.trunc(n) || 0;
    if (n < 0) n += this.length;
    return n < 0 || n >= this.length ? undefined : this[n];
  }
  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, "at", {
      value: at,
      writable: true,
      configurable: true,
    });
  }
  if (!String.prototype.at) {
    Object.defineProperty(String.prototype, "at", {
      value: at,
      writable: true,
      configurable: true,
    });
  }
  function show(msg) {
    var root = document.getElementById("root");
    if (root && root.childNodes.length > 0) return; // app rendered — don't cover it
    var el = document.getElementById("boot-error");
    if (!el) {
      el = document.createElement("pre");
      el.id = "boot-error";
      el.style.cssText =
        "position:fixed;inset:0;z-index:99999;margin:0;padding:18px;background:#0f0e0d;color:#ff5a6a;font:12px/1.6 ui-monospace,monospace;white-space:pre-wrap;word-break:break-word;overflow:auto";
      (document.body || document.documentElement).appendChild(el);
    }
    el.textContent = "⚠ boot error — please screenshot and send:\n\n" + msg;
  }
  window.addEventListener(
    "error",
    function (e) {
      if (!e.message && e.target && e.target !== window) return; // ignore resource 404s
      show(
        (e.message || "error") +
          "\n" +
          ((e.error && e.error.stack) || e.filename || ""),
      );
    },
    true,
  );
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    show("unhandledrejection: " + ((r && (r.stack || r.message)) || r));
  });
})();
