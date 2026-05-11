(function () {
  "use strict";

  if (window.location.href === "about:srcdoc") return;

  const gateKey = typeof GATE_KEY !== "undefined" ? GATE_KEY : "sp_gate_v1";
  const password = typeof PASSWORD !== "undefined" ? PASSWORD : "";
  const signedDate = typeof SIGNED_DATE !== "undefined" ? SIGNED_DATE : "";
  const clientName = typeof CLIENT_NAME !== "undefined" ? CLIENT_NAME : "this strategy";

  if (!password || localStorage.getItem(gateKey) === "granted") return;

  const style = document.createElement("style");
  style.textContent = `
    #sp-gate-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #0a0a08;
      color: rgba(255,255,255,.82);
      font-family: degular, "degular-text", system-ui, sans-serif;
    }
    #sp-gate-card {
      width: min(520px, 100%);
      border: 1px solid rgba(201,164,76,.24);
      border-radius: 16px;
      background: #111210;
      padding: 38px;
      box-shadow: 0 24px 80px rgba(0,0,0,.72);
    }
    #sp-gate-card h1 {
      margin: 0 0 10px;
      color: #fff;
      font-family: "minerva-modern", Georgia, serif;
      font-size: 1.6rem;
      font-weight: 500;
      line-height: 1.15;
      text-align: center;
    }
    #sp-gate-card p {
      margin: 0 0 18px;
      color: rgba(255,255,255,.58);
      font-size: .92rem;
      line-height: 1.55;
      text-align: center;
    }
    #sp-gate-card input[type="password"] {
      width: 100%;
      margin: 8px 0 12px;
      padding: 13px 14px;
      border: 1px solid rgba(201,164,76,.26);
      border-radius: 10px;
      background: #0a0a08;
      color: #fff;
      font: inherit;
      outline: none;
    }
    #sp-gate-card label {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      margin: 12px 0 18px;
      color: rgba(255,255,255,.7);
      font-size: .86rem;
      line-height: 1.4;
    }
    #sp-gate-card button {
      width: 100%;
      padding: 13px 18px;
      border: 0;
      border-radius: 10px;
      background: #C9A44C;
      color: #0a0a08;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    #sp-gate-error {
      display: none;
      color: #f87171;
      font-size: .85rem;
      margin: 10px 0 0;
      text-align: center;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "sp-gate-overlay";
  overlay.innerHTML = `
    <form id="sp-gate-card">
      <h1>Confidential Strategy</h1>
      <p>Prepared for ${clientName}. Enter the access password and confirm the confidentiality notice to continue.</p>
      <input id="sp-gate-password" type="password" placeholder="Access password" autocomplete="current-password" />
      <label>
        <input id="sp-gate-confirm" type="checkbox" />
        <span>I understand this strategy is confidential and intended only for ${clientName}. NDA acknowledged ${signedDate}.</span>
      </label>
      <button type="submit">Enter Presentation</button>
      <div id="sp-gate-error">Incorrect password or missing confirmation.</div>
    </form>
  `;
  document.body.appendChild(overlay);

  const form = document.getElementById("sp-gate-card");
  const input = document.getElementById("sp-gate-password");
  const checkbox = document.getElementById("sp-gate-confirm");
  const error = document.getElementById("sp-gate-error");

  input?.focus();
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (input?.value === password && checkbox?.checked) {
      localStorage.setItem(gateKey, "granted");
      overlay.remove();
      return;
    }
    if (error) error.style.display = "block";
  });
})();
