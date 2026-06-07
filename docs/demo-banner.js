// Demo-mode banner injector.
// Renders a collapsed pill bar that taps open into a drawer with details.
// Open/closed state persists in sessionStorage so it doesn't pop back open
// on every page navigation.

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const banner = document.createElement("div");
    banner.className = "demo-banner";
    banner.innerHTML = `
      <div class="demo-banner-strip" id="demoBannerStrip" role="button" tabindex="0" aria-expanded="false" aria-controls="demoBannerBody">
        <span class="demo-pill">Demo</span>
        <span class="strip-label">Clickable mockup — tap for info</span>
        <span class="chevron" aria-hidden="true">▼</span>
      </div>
      <div class="demo-banner-body" id="demoBannerBody">
        <span><b>No real payment, no real email.</b> Pick treatments and click around to see the full flow.</span>
        <div class="demo-actions">
          <button id="demoReset" type="button">Reset demo</button>
        </div>
      </div>
    `;
    document.body.prepend(banner);
    document.body.classList.add("has-demo-banner");

    const strip = banner.querySelector("#demoBannerStrip");
    const label = banner.querySelector(".strip-label");

    // Restore previous open/closed state (default: closed)
    if (sessionStorage.getItem("fordoun.demoBanner") === "open") {
      banner.classList.add("open");
      strip.setAttribute("aria-expanded", "true");
      label.textContent = "Clickable mockup";
    }

    const toggle = () => {
      const isOpen = banner.classList.toggle("open");
      strip.setAttribute("aria-expanded", isOpen ? "true" : "false");
      label.textContent = isOpen ? "Clickable mockup" : "Clickable mockup — tap for info";
      sessionStorage.setItem("fordoun.demoBanner", isOpen ? "open" : "closed");
    };

    strip.addEventListener("click", toggle);
    strip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });

    banner.querySelector("#demoReset").addEventListener("click", (e) => {
      e.stopPropagation();
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
