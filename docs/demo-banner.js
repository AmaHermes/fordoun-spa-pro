// Demo-mode banner injector.
// Runs ASAP, before page-specific JS. Mocks must be loaded first.

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const banner = document.createElement("div");
    banner.className = "demo-banner";
    banner.innerHTML = `
      <span class="demo-pill">Demo</span>
      <span><b>Clickable mockup</b> — no real payment, no real email. Pick treatments and click around to see the full flow.</span>
      <button id="demoReset" type="button">Reset demo</button>
    `;
    document.body.prepend(banner);
    document.body.classList.add("has-demo-banner");
    banner.querySelector("#demoReset").addEventListener("click", () => {
      if (confirm("Wipe all demo data and reload?")) {
        window.FordounDemo && window.FordounDemo.reset();
      }
    });

    // Listen for magic-link ready event from the mock
    window.addEventListener("demo:magic-link-ready", (e) => {
      const toast = document.createElement("div");
      toast.className = "demo-magic-toast";
      toast.innerHTML = `
        ✉️ A sign-in link would normally be emailed.
        <a href="api/magic-link/redeem?token=${e.detail.token}">Open it now →</a>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 12000);
    });
  });
})();
