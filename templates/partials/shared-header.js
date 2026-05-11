(function () {
  "use strict";

  const root = document.getElementById("site-header-root");
  if (!root) return;

  const client = window.__SP_CLIENT || "Strategy Presentation";
  const domain = window.__SP_DOMAIN || "";
  const themeKey = "spTheme";

  function getTheme() {
    return localStorage.getItem(themeKey) || document.documentElement.getAttribute("data-theme") || "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(themeKey, theme);
    const label = document.getElementById("sp-header-theme-label");
    if (label) label.textContent = theme === "dark" ? "Light" : "Dark";
  }

  window.SPApplyTheme = applyTheme;
  window.SPToggleTheme = function () {
    applyTheme(getTheme() === "dark" ? "light" : "dark");
  };

  const style = document.createElement("style");
  style.textContent = `
    body { padding-top: 52px; }
    #sp-site-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 0 clamp(18px, 5vw, 72px);
      border-bottom: 1px solid rgba(201,164,76,.18);
      background: rgba(10,10,8,.92);
      backdrop-filter: blur(18px);
      font-family: var(--font-body, degular, system-ui, sans-serif);
    }
    [data-theme="light"] #sp-site-header {
      background: rgba(247,246,242,.92);
    }
    #sp-site-header a {
      color: inherit;
      text-decoration: none;
    }
    .sp-header-brand {
      display: flex;
      min-width: 0;
      align-items: baseline;
      gap: 10px;
    }
    .sp-header-client {
      overflow: hidden;
      color: var(--text);
      font-family: var(--font-display, Georgia, serif);
      font-size: 1rem;
      line-height: 1;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sp-header-domain {
      color: var(--muted);
      font-size: .78rem;
      white-space: nowrap;
    }
    .sp-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }
    .sp-header-link,
    .sp-header-theme {
      border: 1px solid rgba(201,164,76,.2);
      border-radius: 999px;
      background: transparent;
      color: var(--text);
      font: inherit;
      font-size: .76rem;
      line-height: 1;
      padding: 9px 12px;
      cursor: pointer;
    }
    .sp-header-theme {
      color: var(--gold, #C9A44C);
    }
  `;
  document.head.appendChild(style);

  root.innerHTML = `
    <header id="sp-site-header">
      <a class="sp-header-brand" href="#hero" aria-label="Back to top">
        <span class="sp-header-client">${client}</span>
        <span class="sp-header-domain">${domain}</span>
      </a>
      <nav class="sp-header-actions" aria-label="Strategy sections">
        <a class="sp-header-link" href="#grant">Grant</a>
        <a class="sp-header-link" href="#roadmap">Roadmap</a>
        <a class="sp-header-link" href="#investment">Investment</a>
        <button class="sp-header-theme" type="button" onclick="window.SPToggleTheme()">
          <span id="sp-header-theme-label">Light</span>
        </button>
      </nav>
    </header>
  `;

  applyTheme(getTheme());
})();
