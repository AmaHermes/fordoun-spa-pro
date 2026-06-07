// Mock backend for the static-only demo.
//
// Intercepts fetch() calls to /api/* and serves them from in-memory
// + localStorage state. The real hardcore version's frontend code is
// untouched — we just answer its API calls here.
//
// State persistence: localStorage under key "fordoun.demo".
// Reset: localStorage.removeItem("fordoun.demo") or click "Reset demo".

(function () {
  const LS_KEY = "fordoun.demo";
  const DEPOSIT_PERCENT = 30;
  const ADMIN_PASSWORD = "letmein";

  // ──────────────── Persistence ────────────────

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return freshState();
  }
  function saveState() {
    localStorage.setItem(LS_KEY, JSON.stringify(STATE));
  }
  function freshState() {
    const now = Math.floor(Date.now() / 1000);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10);

    // Seed with a few bookings so the admin doesn't look empty.
    return {
      nextCustomerId: 4,
      nextBookingId: 5,
      session: null, // {kind, customerId, expires}
      customers: {
        1: { id: 1, email: "jane.smith@example.com", phone: "0825551234", name: "Jane Smith",
             visits_count: 2, cents_spent: 397000, created_at: now - 86400 * 60, last_seen_at: now - 86400 },
        2: { id: 2, email: "thandi.m@example.com", phone: "0832221111", name: "Thandi Mokoena",
             visits_count: 0, cents_spent: 0, created_at: now - 3600, last_seen_at: now - 3600 },
        3: { id: 3, email: "robert.duplessis@example.com", phone: "0843337777", name: "Robert du Plessis",
             visits_count: 5, cents_spent: 1235000, created_at: now - 86400 * 200, last_seen_at: now - 86400 * 3 },
      },
      bookings: {
        1: { id: 1, customer_id: 1, status: "confirmed",
             preferred_date: todayStr, preferred_time: "Midday (11:00 – 14:00)",
             guests: 2, total_cents: 297000, deposit_cents: 89000,
             deposit_paid_at: now - 86400, confirmed_slot_at: now - 86400 * 1 + 3600,
             notes_from_guest: "Anniversary visit — please put us in the couples suite if possible.",
             treatments_json: JSON.stringify([
               { id: "ndlovu-90", name: "Ndlovu Signature Full Body — 90 min", duration: 90, price_cents: 120000 },
               { id: "hot-stone-90", name: "Hot Stone — 90 min", duration: 90, price_cents: 125000 },
             ]),
             created_at: now - 86400 * 4, updated_at: now - 86400 },
        2: { id: 2, customer_id: 2, status: "paid_deposit",
             preferred_date: tomorrow, preferred_time: "Afternoon (14:00 – 17:00)",
             guests: 1, total_cents: 173000, deposit_cents: 52000,
             deposit_paid_at: now - 7200, confirmed_slot_at: null,
             notes_from_guest: "First time, a bit nervous! Please go gentle.",
             treatments_json: JSON.stringify([
               { id: "wellness-day", name: "Wellness Day Package", duration: 90, price_cents: 172000 },
             ]),
             created_at: now - 7200, updated_at: now - 7200 },
        3: { id: 3, customer_id: 3, status: "confirmed",
             preferred_date: dayAfter, preferred_time: "Morning (08:00 – 11:00)",
             guests: 1, total_cents: 135000, deposit_cents: 40000,
             deposit_paid_at: now - 86400 * 2, confirmed_slot_at: now - 86400 * 2 + 3600,
             notes_from_guest: "",
             treatments_json: JSON.stringify([
               { id: "deep-90", name: "Deep Tissue — 90 min", duration: 90, price_cents: 135000 },
             ]),
             created_at: now - 86400 * 5, updated_at: now - 86400 * 2 },
        4: { id: 4, customer_id: 1, status: "completed",
             preferred_date: "2026-05-22", preferred_time: "Midday (11:00 – 14:00)",
             guests: 1, total_cents: 100000, deposit_cents: 30000,
             deposit_paid_at: now - 86400 * 16, confirmed_slot_at: now - 86400 * 16 + 1800,
             completed_at: now - 86400 * 14,
             notes_from_guest: "",
             treatments_json: JSON.stringify([
               { id: "swedish-60", name: "Swedish — 60 min", duration: 60, price_cents: 100000 },
             ]),
             created_at: now - 86400 * 20, updated_at: now - 86400 * 14 },
      },
      pendingBooking: null, // booking waiting on the fake-checkout page
    };
  }

  let STATE = loadState();

  // ──────────────── Mock API ────────────────

  const ROUTES = [];

  function route(method, pathPattern, handler) {
    ROUTES.push({ method, pathPattern, handler });
  }

  function matchRoute(method, path) {
    for (const r of ROUTES) {
      if (r.method !== method) continue;
      if (typeof r.pathPattern === "string") {
        if (r.pathPattern === path) return { handler: r.handler, params: {} };
      } else {
        const m = path.match(r.pathPattern);
        if (m) return { handler: r.handler, params: m.groups || {} };
      }
    }
    return null;
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ─── treatment lookup (shared) ───
  let TREATMENTS_BY_ID = null;
  async function loadTreatments() {
    if (TREATMENTS_BY_ID) return TREATMENTS_BY_ID;
    const res = await window._realFetch("treatments.json");
    const data = await res.json();
    const byId = {};
    for (const cat of data.categories) {
      for (const t of cat.treatments) {
        byId[t.id] = { ...t, category: cat.id, price_cents: t.price * 100 };
      }
    }
    TREATMENTS_BY_ID = byId;
    return byId;
  }

  // ─── routes ───

  route("POST", "/api/bookings", async (req) => {
    await delay(600); // pretend network
    const body = await req.json();
    const cat = await loadTreatments();
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return jsonResponse({ errors: ["Email required"] }, 400);

    const treatments = [];
    let totalCents = 0;
    for (const id of body.treatment_ids || []) {
      const t = cat[id];
      if (!t) continue;
      treatments.push({ id, name: t.name, duration: t.duration, price_cents: t.price_cents });
      totalCents += t.price_cents;
    }
    if (!treatments.length) return jsonResponse({ errors: ["No treatments selected"] }, 400);

    const depositCents = Math.max(1000, Math.round((totalCents * DEPOSIT_PERCENT) / 100 / 1000) * 1000);

    // Upsert customer
    let customer = Object.values(STATE.customers).find(c => c.email === email);
    const now = Math.floor(Date.now() / 1000);
    if (!customer) {
      const id = STATE.nextCustomerId++;
      customer = {
        id, email, phone: body.phone || "", name: body.name || "",
        visits_count: 0, cents_spent: 0, created_at: now, last_seen_at: now,
      };
      STATE.customers[id] = customer;
    } else {
      if (body.name) customer.name = body.name;
      if (body.phone) customer.phone = body.phone;
      customer.last_seen_at = now;
    }

    const bookingId = STATE.nextBookingId++;
    const booking = {
      id: bookingId, customer_id: customer.id, status: "pending_payment",
      preferred_date: body.preferred_date,
      preferred_time: body.preferred_time,
      guests: body.guests || 1,
      treatments_json: JSON.stringify(treatments),
      total_cents: totalCents,
      deposit_cents: depositCents,
      deposit_paid_at: null,
      confirmed_slot_at: null,
      notes_from_guest: body.notes || "",
      created_at: now, updated_at: now,
    };
    STATE.bookings[bookingId] = booking;
    STATE.pendingBooking = bookingId;
    saveState();

    return jsonResponse({
      booking_id: bookingId,
      total_cents: totalCents,
      deposit_cents: depositCents,
      checkout_url: `pay.html?booking=${bookingId}`,
    });
  });

  route("GET", /^\/api\/bookings\/(?<id>\d+)$/, async (req, params) => {
    await delay(100);
    const b = STATE.bookings[Number(params.id)];
    if (!b) return jsonResponse({ error: "Not found" }, 404);
    return jsonResponse({
      id: b.id,
      status: b.status,
      total_cents: b.total_cents,
      deposit_cents: b.deposit_cents,
      preferred_date: b.preferred_date,
      preferred_time: b.preferred_time,
      treatments: JSON.parse(b.treatments_json),
    });
  });

  route("POST", "/api/dev/simulate-payment", async (req) => {
    // Used by confirmation page after fake-checkout
    const body = await req.json();
    const b = STATE.bookings[Number(body.booking_id)];
    if (!b) return jsonResponse({ error: "Not found" }, 404);
    if (b.status === "pending_payment") {
      const now = Math.floor(Date.now() / 1000);
      b.status = "paid_deposit";
      b.deposit_paid_at = now;
      b.updated_at = now;
      saveState();
    }
    return jsonResponse({ status: b.status });
  });

  route("POST", "/api/magic-link/request", async (req) => {
    await delay(400);
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const customer = Object.values(STATE.customers).find(c => c.email === email);
    // In real life this would email. Here we stash a token and the
    // banner reveals an "Open my link" button via a custom event.
    if (customer) {
      const token = "demo_" + Math.random().toString(36).slice(2, 10);
      STATE._magicToken = { token, customer_id: customer.id, expires_at: Math.floor(Date.now()/1000) + 1800 };
      saveState();
      // Dispatch a UI hint
      window.dispatchEvent(new CustomEvent("demo:magic-link-ready", { detail: { token } }));
    }
    // Always return ok (anti-enumeration, same as real backend)
    return jsonResponse({ ok: true });
  });

  route("GET", "/api/magic-link/redeem", async (req) => {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const m = STATE._magicToken;
    if (!m || m.token !== token) {
      return new Response("Invalid or expired link", { status: 400 });
    }
    STATE._magicToken = null;
    STATE.session = { kind: "customer", customerId: m.customer_id, expires: Date.now() + 30 * 86400_000 };
    saveState();
    return new Response("", { status: 302, headers: { Location: "?welcome=1" } });
  });

  route("GET", "/api/me", async () => {
    await delay(80);
    if (!STATE.session || STATE.session.kind !== "customer" || STATE.session.expires < Date.now()) {
      return jsonResponse({ logged_in: false });
    }
    const customer = STATE.customers[STATE.session.customerId];
    const bookings = Object.values(STATE.bookings)
      .filter(b => b.customer_id === customer.id)
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 20)
      .map(b => ({
        id: b.id, status: b.status,
        preferred_date: b.preferred_date, preferred_time: b.preferred_time,
        treatments_json: b.treatments_json,
        treatments: JSON.parse(b.treatments_json),
        total_cents: b.total_cents,
      }));
    return jsonResponse({ logged_in: true, customer, bookings });
  });

  route("POST", "/api/me/logout", async () => {
    if (STATE.session && STATE.session.kind === "customer") STATE.session = null;
    saveState();
    return jsonResponse({ ok: true });
  });

  route("POST", "/api/admin/login", async (req) => {
    await delay(400);
    const body = await req.json();
    if (body.password !== ADMIN_PASSWORD) {
      return jsonResponse({ error: "Wrong password" }, 401);
    }
    STATE.session = { kind: "admin", customerId: null, expires: Date.now() + 7 * 86400_000 };
    saveState();
    return jsonResponse({ ok: true });
  });

  route("POST", "/api/admin/logout", async () => {
    if (STATE.session && STATE.session.kind === "admin") STATE.session = null;
    saveState();
    return jsonResponse({ ok: true });
  });

  route("GET", "/api/admin/today", async () => {
    if (!STATE.session || STATE.session.kind !== "admin") return jsonResponse({ error: "Unauthorized" }, 401);
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
    const bookings = Object.values(STATE.bookings)
      .filter(b => (b.preferred_date === today || b.preferred_date === tomorrow)
                  && (b.status === "paid_deposit" || b.status === "confirmed"))
      .map(decorate);
    const pending = Object.values(STATE.bookings)
      .filter(b => b.status === "paid_deposit" && !b.confirmed_slot_at)
      .sort((a, b) => b.created_at - a.created_at)
      .map(decorate);
    return jsonResponse({ today, tomorrow, bookings, pending });
  });

  route("GET", /^\/api\/admin\/bookings/, async (req) => {
    if (!STATE.session || STATE.session.kind !== "admin") return jsonResponse({ error: "Unauthorized" }, 401);
    const all = Object.values(STATE.bookings)
      .sort((a, b) => b.created_at - a.created_at)
      .map(decorate);
    return jsonResponse({ bookings: all });
  });

  route("GET", /^\/api\/admin\/customers\/(?<id>\d+)$/, async (req, params) => {
    if (!STATE.session || STATE.session.kind !== "admin") return jsonResponse({ error: "Unauthorized" }, 401);
    const id = Number(params.id);
    const customer = STATE.customers[id];
    if (!customer) return jsonResponse({ error: "Not found" }, 404);
    const bookings = Object.values(STATE.bookings)
      .filter(b => b.customer_id === id)
      .sort((a, b) => b.created_at - a.created_at)
      .map(decorate);
    return jsonResponse({ customer, bookings });
  });

  route("POST", /^\/api\/admin\/bookings\/(?<id>\d+)\/transition$/, async (req, params) => {
    if (!STATE.session || STATE.session.kind !== "admin") return jsonResponse({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const b = STATE.bookings[Number(params.id)];
    if (!b) return jsonResponse({ error: "Not found" }, 404);
    const now = Math.floor(Date.now() / 1000);
    if (body.to === "confirmed") {
      b.status = "confirmed";
      b.confirmed_slot_at = now;
    } else if (body.to === "completed") {
      b.status = "completed";
      b.completed_at = now;
      const c = STATE.customers[b.customer_id];
      c.visits_count++;
      c.cents_spent += b.total_cents;
    } else if (body.to === "no_show") {
      b.status = "no_show";
    } else if (body.to === "cancelled") {
      b.status = "cancelled";
    }
    b.updated_at = now;
    saveState();
    return jsonResponse({ ok: true });
  });

  route("POST", /^\/api\/admin\/bookings\/(?<id>\d+)\/note$/, async (req, params) => {
    if (!STATE.session || STATE.session.kind !== "admin") return jsonResponse({ error: "Unauthorized" }, 401);
    const body = await req.json();
    const b = STATE.bookings[Number(params.id)];
    if (!b) return jsonResponse({ error: "Not found" }, 404);
    b.notes_from_spa = String(body.note || "").slice(0, 2000);
    b.updated_at = Math.floor(Date.now() / 1000);
    saveState();
    return jsonResponse({ ok: true });
  });

  function decorate(b) {
    const c = STATE.customers[b.customer_id];
    return {
      ...b,
      email: c.email,
      customer_name: c.name,
      customer_phone: c.phone,
      visits_count: c.visits_count,
      treatments: JSON.parse(b.treatments_json),
    };
  }

  // ──────────────── Install fetch interceptor ────────────────

  window._realFetch = window.fetch.bind(window);
  window.fetch = async function (input, init = {}) {
    const url = typeof input === "string" ? input : input.url;
    const u = new URL(url, location.origin);
    // Only intercept same-origin /api/* calls
    if (u.origin === location.origin && u.pathname.startsWith("/api/")) {
      const method = (init.method || "GET").toUpperCase();
      const matched = matchRoute(method, u.pathname);
      if (!matched) {
        console.warn("[demo-mock] Unmatched route", method, u.pathname);
        return jsonResponse({ error: "Not found" }, 404);
      }
      // Build a Request-like object so handlers can call .json()
      const req = {
        url: u.toString(),
        method,
        json: async () => init.body ? JSON.parse(init.body) : {},
      };
      return await matched.handler(req, matched.params);
    }
    return window._realFetch(input, init);
  };

  // Expose for the reset button + the magic link "Open" button
  window.FordounDemo = {
    reset() {
      localStorage.removeItem(LS_KEY);
      STATE = freshState();
      saveState();
      location.reload();
    },
    getMagicLink() {
      return STATE._magicToken;
    },
    state: () => STATE,
  };
})();
