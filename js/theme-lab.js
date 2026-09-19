/* =============================================================
   theme-lab.js — outil de design (DEV ONLY, s'active avec ?lab)
   Pilote les tokens :root de main.css en live, sauvegarde en
   localStorage, exporte un bloc :root prêt à coller dans main.css.
   ============================================================= */
(function () {
  "use strict";
  /* Garde : sans ?lab dans l'URL, le script ne fait rien */
  if (!/(^|[?&])lab(=|&|$)/.test(location.search)) return;

  const boot = () => {

  const LS_KEY = "theme-lab:v1";
  const $ = (tag, attrs, parent) => {
    const el = document.createElement(tag); Object.assign(el, attrs);
    if (parent) parent.appendChild(el); return el;
  };

  /* ---------- État ---------- */
  const DEFAULTS = {
    bg1: "#a3b0c0", bg2: "#8090a6", bg3: "#5e6e86",
    ink: "#2a3444", ink2: .76, ink3: .52,
    accent: "#2456c8", accentHover: "#3a6fe0", accentSoft: .14,
    spec: "#2b5fc4", specInk: "#1d3f8f", important: "#c23838",
    glassTint: "#ffffff", glassDeep: .46, glassStrong: .34, glass: .24,
    veilTint: "#465468", veil: .38,
    hairTint: "#ffffff", hairA: .38, hairLightA: .62, sheenTop: .34,
    shadowTint: "#2a374a", shadowK: 1,
    blur: 22, blurVeil: 16, sat: 180,
    radiusPanel: 18, radiusCtl: 12,
  };
  let S = { ...DEFAULTS };
  try { Object.assign(S, JSON.parse(localStorage.getItem(LS_KEY) || "{}")); } catch (e) {}

  /* ---------- Presets ---------- */
  const PRESETS = {
    "Slate clair (v4)": { ...DEFAULTS },
    "Graphite (v3)": {
      ...DEFAULTS,
      bg1: "#0d1220", bg2: "#0b0e14", bg3: "#070a0f",
      ink: "#e8edf5", ink2: .65, ink3: .45,
      accent: "#4d8dff", accentHover: "#6ba3ff", accentSoft: .16,
      spec: "#7fb3ff", specInk: "#cfe0f7", important: "#ff6b6b",
      glassTint: "#0f141c", glassDeep: .86, glassStrong: .78, glass: .52,
      veilTint: "#05080e", veil: .55,
      hairTint: "#ffffff", hairA: .10, hairLightA: .18, sheenTop: .06,
      shadowTint: "#000000", shadowK: 1.6,
    },
    "Acier (mid)": {
      ...DEFAULTS,
      bg1: "#93a2b4", bg2: "#6e7d92", bg3: "#4c5b71",
      ink: "#1f2a3a",
      accent: "#2f63d0", accentHover: "#4a7ff0",
      glassDeep: .38, glassStrong: .28, glass: .18,
      veilTint: "#3c4a5e", veil: .40,
      hairA: .45, hairLightA: .70, sheenTop: .28,
      shadowTint: "#22303f", shadowK: 1.1, blur: 26,
    },
  };

  /* ---------- Helpers ---------- */
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const hex2rgb = h => {
    h = h.replace("#", "");
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgba = (hex, a) => {
    const [r, g, b] = hex2rgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${(+a).toFixed(3)})`;
  };
  const setVar = (k, v) => document.documentElement.style.setProperty(k, v);

  /* ---------- Application des tokens ---------- */
  function apply() {
    setVar("--bg-1", S.bg1); setVar("--bg-2", S.bg2); setVar("--bg-3", S.bg3);
    setVar("--ink", S.ink); setVar("--ink-1", S.ink);
    setVar("--ink-2", rgba(S.ink, S.ink2));
    setVar("--ink-3", rgba(S.ink, S.ink3));
    setVar("--accent", S.accent); setVar("--accent-hover", S.accentHover);
    setVar("--accent-soft", rgba(S.accent, S.accentSoft));
    setVar("--spec", S.spec); setVar("--spec-ink", S.specInk); setVar("--important", S.important);
    /* verre hiérarchisé : sidebar dense → chips légères (comme main.css) */
    setVar("--glass-deep", rgba(S.glassTint, S.glassDeep));
    setVar("--glass-strong", rgba(S.glassTint, S.glassStrong));
    setVar("--glass", rgba(S.glassTint, S.glass));
    setVar("--glass-veil", rgba(S.veilTint, S.veil));
    setVar("--hairline", rgba(S.hairTint, S.hairA));
    setVar("--hairline-light", rgba(S.hairTint, S.hairLightA));
    setVar("--sheen", `linear-gradient(180deg, rgba(255,255,255,${S.sheenTop.toFixed(3)}), rgba(255,255,255,.06) 34%, rgba(255,255,255,0) 60%)`);
    /* --blur d'origine = saturate + blur composés */
    setVar("--blur", `saturate(${S.sat}%) blur(${S.blur}px)`);
    setVar("--blur-veil", `saturate(${Math.round(S.sat * .9)}%) blur(${S.blurVeil}px)`);
    const k = S.shadowK;
    setVar("--shadow-panel",
      `0 2px 6px ${rgba(S.shadowTint, .16 * k)}, 0 12px 32px ${rgba(S.shadowTint, .20 * k)}, 0 32px 80px ${rgba(S.shadowTint, .24 * k)}`);
    setVar("--shadow-thumb", `0 1px 3px ${rgba(S.shadowTint, .22 * k)}, 0 0 0 1px ${rgba(S.hairTint, .35)}`);
    setVar("--radius-panel", S.radiusPanel + "px");
    setVar("--radius-ctl", S.radiusCtl + "px");
    /* treeScrim est codé en dur dans main.css → on le pilote aussi */
    const scrimA = clamp(S.veil + .04, 0, 1);
    setVar("--scrim", rgba(S.veilTint, scrimA));
    const scrim = document.getElementById("treeScrim");
    if (scrim) scrim.style.background = rgba(S.veilTint, scrimA);
    save();
  }
  const save = () => { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {} };

  /* ---------- Export :root prêt à coller dans main.css ---------- */
  function exportCSS() {
    const k = S.shadowK, scrimA = clamp(S.veil + .04, 0, 1);
    return `:root {
  --bg-1: ${S.bg1}; --bg-2: ${S.bg2}; --bg-3: ${S.bg3};

  --ink: ${S.ink}; --ink-1: ${S.ink};
  --ink-2: ${rgba(S.ink, S.ink2)}; --ink-3: ${rgba(S.ink, S.ink3)};

  --accent: ${S.accent}; --accent-hover: ${S.accentHover};
  --accent-soft: ${rgba(S.accent, S.accentSoft)};

  --glass-deep: ${rgba(S.glassTint, S.glassDeep)};
  --glass-strong: ${rgba(S.glassTint, S.glassStrong)};
  --glass: ${rgba(S.glassTint, S.glass)};
  --glass-veil: ${rgba(S.veilTint, S.veil)};
  --scrim: ${rgba(S.veilTint, scrimA)};
  --sheen: linear-gradient(180deg, rgba(255,255,255,${S.sheenTop.toFixed(3)}), rgba(255,255,255,.06) 34%, rgba(255,255,255,0) 60%);
  --hairline: ${rgba(S.hairTint, S.hairA)};
  --hairline-light: ${rgba(S.hairTint, S.hairLightA)};

  --radius-panel: ${S.radiusPanel}px; --radius-ctl: ${S.radiusCtl}px; --radius-pill: 999px;

  --shadow-panel: 0 2px 6px ${rgba(S.shadowTint, .16 * k)}, 0 12px 32px ${rgba(S.shadowTint, .20 * k)}, 0 32px 80px ${rgba(S.shadowTint, .24 * k)};
  --shadow-thumb: 0 1px 3px ${rgba(S.shadowTint, .22 * k)}, 0 0 0 1px ${rgba(S.hairTint, .35)};

  --blur: saturate(${S.sat}%) blur(${S.blur}px);
  --blur-veil: saturate(${Math.round(S.sat * .9)}%) blur(${S.blurVeil}px);

  --spec: ${S.spec}; --spec-ink: ${S.specInk}; --important: ${S.important};
}`;
  }

  /* ---------- UI ---------- */
  const panel = $("div", { id: "themeLab" });
  panel.innerHTML = `
    <div class="tl-head">
      <b>Theme Lab</b>
      <span class="tl-actions">
        <button data-tl="copy" title="Copier le bloc :root">Copier :root</button>
        <button data-tl="reset" title="Valeurs par défaut">Reset</button>
        <button data-tl="hide" title="Replier">–</button>
      </span>
    </div>
    <div class="tl-presets">
      ${Object.keys(PRESETS).map(n => `<button data-preset="${n}">${n}</button>`).join("")}
    </div>
    <div class="tl-body"></div>
    <textarea class="tl-out" rows="6" spellcheck="false" readonly></textarea>`;
  document.body.appendChild(panel);

  const css = document.createElement("style");
  css.textContent = `
    #themeLab { position: fixed; top: 180px; right: 14px; z-index: 9999;
      width: 300px; max-height: calc(100vh - 200px); display: flex; flex-direction: column;
      background: rgba(20,26,36,.92); color: #e8edf5; font: 12px/1.4 -apple-system, "Segoe UI", sans-serif;
      border: 1px solid rgba(255,255,255,.16); border-radius: 14px;
      box-shadow: 0 18px 50px rgba(0,0,0,.45);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
    #themeLab .tl-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,.12); }
    #themeLab .tl-actions { margin-left: auto; display: flex; gap: 6px; }
    #themeLab button { font-family: inherit; font-size: 11px; font-weight: 600; padding: 5px 8px;
      border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,.18);
      background: rgba(255,255,255,.10); color: inherit; }
    #themeLab button:hover { background: rgba(255,255,255,.22); }
    #themeLab .tl-presets { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px;
      border-bottom: 1px solid rgba(255,255,255,.12); }
    #themeLab .tl-body { overflow: auto; padding: 6px 12px 12px; }
    #themeLab .tl-group { font-size: 10px; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; opacity: .65; margin: 10px 0 4px; }
    #themeLab .tl-row { display: grid; grid-template-columns: 1fr 74px 40px;
      align-items: center; gap: 8px; padding: 3px 0; }
    #themeLab .tl-row input[type="color"] { width: 100%; height: 24px; padding: 0;
      border: 1px solid rgba(255,255,255,.2); border-radius: 6px; background: none; }
    #themeLab .tl-row input[type="range"] { width: 100%; accent-color: #7fb3ff; }
    #themeLab .tl-row output { font-size: 11px; opacity: .75; text-align: right;
      font-variant-numeric: tabular-nums; }
    #themeLab .tl-out { display: none; margin: 8px 12px 12px; width: calc(100% - 24px);
      font: 11px/1.4 ui-monospace, monospace; background: rgba(0,0,0,.35); color: #cfe0f7;
      border: 1px solid rgba(255,255,255,.15); border-radius: 8px; }
    #themeLab.is-collapsed .tl-body, #themeLab.is-collapsed .tl-presets,
    #themeLab.is-collapsed .tl-out { display: none; }`;
  document.head.appendChild(css);

  const body = panel.querySelector(".tl-body");
  const rows = {};
  const addGroup = t => $("div", { className: "tl-group", textContent: t }, body);
  function addColor(key, label) {
    const row = $("label", { className: "tl-row" }, body);
    $("span", { textContent: label }, row);
    const inp = $("input", { type: "color", value: S[key] }, row);
    inp.addEventListener("input", () => { S[key] = inp.value; apply(); });
    rows[key] = inp;
  }
  function addRange(key, label, min, max, step) {
    const row = $("label", { className: "tl-row" }, body);
    const inp = $("input", { type: "range", min, max, step, value: S[key] }, row);
    const out = $("output", {}, row);
    const upd = () => { out.textContent = S[key]; };
    inp.addEventListener("input", () => { S[key] = +inp.value; upd(); apply(); });
    row.prepend($("span", { textContent: label }));
    upd(); rows[key] = inp;
  }

  addGroup("Fonds & encre");
  addColor("bg1", "Fond haut"); addColor("bg2", "Fond milieu"); addColor("bg3", "Fond bas");
  addColor("ink", "Encre");
  addRange("ink2", "Encre 2 α", 0, 1, .01); addRange("ink3", "Encre 3 α", 0, 1, .01);
  addGroup("Verre");
  addColor("glassTint", "Teinte verre");
  addRange("glassDeep", "Sidebar", 0, 1, .01);
  addRange("glassStrong", "Panneaux", 0, 1, .01);
  addRange("glass", "Chips", 0, 1, .01);
  addRange("sheenTop", "Sheen haut", 0, .6, .01);
  addColor("hairTint", "Liseré");
  addRange("hairA", "Liseré α", 0, 1, .01); addRange("hairLightA", "Liseré + α", 0, 1, .01);
  addColor("shadowTint", "Ombre"); addRange("shadowK", "Ombre ×", 0, 2, .05);
  addGroup("Voile & flou");
  addColor("veilTint", "Teinte voile"); addRange("veil", "Voile α", 0, 1, .01);
  addRange("blur", "Blur px", 0, 60, 1); addRange("blurVeil", "Blur voile px", 0, 60, 1);
  addRange("sat", "Saturation %", 0, 300, 5);
  addRange("radiusPanel", "Rayon panneaux", 0, 32, 1); addRange("radiusCtl", "Rayon chips", 0, 24, 1);
  addGroup("Accents & FTA");
  addRange("accentSoft", "Accent doux α", 0, 1, .01);
  addColor("accent", "Accent"); addColor("accentHover", "Accent hover");
  addColor("spec", "FTA bord"); addColor("specInk", "FTA texte"); addColor("important", "Important");

  function syncInputs() {
    for (const k in rows) {
      const el = rows[k];
      if (el.type === "color") el.value = S[k];
      else { el.value = S[k]; el.dispatchEvent(new Event("input")); }
    }
  }

  panel.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.preset) { Object.assign(S, PRESETS[b.dataset.preset]); syncInputs(); apply(); return; }
    const act = b.dataset.tl;
    if (act === "copy") {
      const out = panel.querySelector(".tl-out");
      out.value = exportCSS(); out.style.display = "block";
      try { await navigator.clipboard.writeText(out.value);
        b.textContent = "Copié ✓"; setTimeout(() => (b.textContent = "Copier :root"), 1200); }
      catch (err) { out.select(); }   /* file:// : sélection manuelle */
    } else if (act === "reset") { S = { ...DEFAULTS }; syncInputs(); apply(); }
    else if (act === "hide") {
      panel.classList.toggle("is-collapsed");
      b.textContent = panel.classList.contains("is-collapsed") ? "+" : "–";
    }
  });

  apply();   /* restaure la session précédente dès le chargement */

  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
