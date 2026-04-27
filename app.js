/* ============================================================
   Helm — waitlist form wiring + small UX touches.
   Inserts into Supabase table `helm_waitlist` (see migration
   0005_helm_waitlist.sql). Falls back to a friendly demo mode
   when config.js still has placeholders so local preview works.
   ============================================================ */

(function () {
  "use strict";

  // Footer year
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();

  // ---------- Supabase client ----------
  var cfg = window.HELM_CONFIG || {};
  var supa = null;
  var configured =
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    cfg.SUPABASE_URL.indexOf("YOUR-PROJECT") === -1 &&
    cfg.SUPABASE_ANON_KEY.indexOf("REPLACE") === -1;

  if (configured && window.supabase && window.supabase.createClient) {
    supa = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  // ---------- UTM + referrer capture ----------
  function captureUtm() {
    try {
      var p = new URLSearchParams(window.location.search);
      var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"];
      var out = {};
      var any = false;
      keys.forEach(function (k) {
        var v = p.get(k);
        if (v) { out[k] = v; any = true; }
      });
      if (document.referrer) { out.referrer = document.referrer; any = true; }
      return any ? out : null;
    } catch (e) {
      return null;
    }
  }

  var form = document.getElementById("waitlist-form");
  var btn  = document.getElementById("submit-btn");
  var statusEl = document.getElementById("form-status");
  if (!form) return;

  function setStatus(kind, msg) {
    statusEl.className = "form-status" + (kind ? " is-" + kind : "");
    statusEl.textContent = msg || "";
  }
  function setLoading(on) {
    if (!btn) return;
    btn.disabled = !!on;
    btn.classList.toggle("is-loading", !!on);
  }
  function toInt(v) {
    if (v === null || v === undefined || v === "") return null;
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus(null, "");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var fd = new FormData(form);
    var payload = {
      first_name: (fd.get("first_name") || "").toString().trim(),
      last_name:  (fd.get("last_name")  || "").toString().trim(),
      email:      (fd.get("email")      || "").toString().trim().toLowerCase(),
      phone:      (fd.get("phone")      || "").toString().trim() || null,
      company:    (fd.get("company")    || "").toString().trim(),
      locations:  toInt(fd.get("locations")),
      role:       (fd.get("role")       || "").toString() || null,
      pain:       (fd.get("pain")       || "").toString().trim() || null,
      source:     "helm.mgmhospitality.co",
      utm:        captureUtm(),
    };

    if (!supa) {
      console.warn(
        "[helm] Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in config.js."
      );
      console.info("[helm] waitlist payload that would be sent:", payload);
      setLoading(true);
      setTimeout(function () {
        setLoading(false);
        setStatus(
          "success",
          "Thanks — you're on the list. We'll email you when we open the next cohort."
        );
        form.reset();
      }, 600);
      return;
    }

    setLoading(true);
    supa
      .from("helm_waitlist")
      .insert(payload)
      .then(function (res) {
        setLoading(false);
        if (res.error) {
          console.error("[helm] insert error:", res.error);
          setStatus(
            "error",
            "Something went wrong on our end. Please email helm@mgmhospitality.co and we'll sort it out."
          );
          return;
        }
        setStatus(
          "success",
          "Thanks — you're on the list. We'll email you when we open the next cohort."
        );
        form.reset();
      })
      .catch(function (err) {
        setLoading(false);
        console.error("[helm] unexpected error:", err);
        setStatus(
          "error",
          "Something went wrong. Please email helm@mgmhospitality.co and we'll help you from there."
        );
      });
  });
})();
