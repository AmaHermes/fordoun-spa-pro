// Fordoun Spa — booking page (hardcore version).
// Talks to the same-origin Worker API at /api/*.
// Uses fetch + vanilla DOM, no framework.

const STATE = {
  data: null,
  selected: new Map(),
  activeCategory: null,
  loggedIn: null,        // null = unknown, false = guest, {customer, bookings} = logged in
  emailKnown: null,      // email we've seen the visitor type that matches an existing customer
};

const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// ──────────────── Boot ────────────────

(async function init() {
  try {
    const res = await fetch('treatments.json', { cache: 'no-cache' });
    STATE.data = await res.json();
  } catch (e) {
    console.error('Failed to load menu', e);
    $('#catContent').innerHTML = '<p>Sorry, we couldn\'t load the menu. Please reload.</p>';
    return;
  }
  renderCategories();
  renderPolicies();
  renderEmailLink();
  setupListeners();
  prefillDate();
  await checkSession();
  handleWelcomeBanner();
})();

async function checkSession() {
  try {
    const res = await fetch('/api/me');
    const me = await res.json();
    if (me.logged_in) {
      STATE.loggedIn = me;
      renderLoggedInPanel();
      // Prefill form
      $('#yourName').value = me.customer.name || '';
      $('#yourEmail').value = me.customer.email || '';
      $('#yourPhone').value = me.customer.phone || '';
    } else {
      STATE.loggedIn = false;
    }
  } catch (e) {
    STATE.loggedIn = false;
  }
}

function handleWelcomeBanner() {
  const params = new URLSearchParams(location.search);
  if (params.get('welcome') === '1') {
    history.replaceState(null, '', location.pathname);
    // Brief confirmation toast — for now, scroll to the logged-in panel
    setTimeout(() => $('#loggedInPanel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
  }
}

function prefillDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  $('#prefDate').value = d.toISOString().split('T')[0];
  $('#prefDate').min = new Date().toISOString().split('T')[0];
}

// ──────────────── Categories ────────────────

function renderCategories() {
  const tabs = $('#catTabs');
  tabs.innerHTML = '';
  STATE.data.categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-tab' + (i === 0 ? ' active' : '');
    btn.textContent = cat.name;
    btn.dataset.cat = cat.id;
    btn.addEventListener('click', () => switchCategory(cat.id));
    tabs.appendChild(btn);
  });
  STATE.activeCategory = STATE.data.categories[0].id;
  renderCategoryContent(STATE.activeCategory);
  setupCatTabsScrollHint();
}

function setupCatTabsScrollHint() {
  const wrap = document.getElementById('catTabsWrap');
  const tabs = document.getElementById('catTabs');
  if (!wrap || !tabs) return;

  const update = () => {
    // True if there's nothing more to scroll right (within 4px tolerance)
    const atEnd = tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 4;
    const noOverflow = tabs.scrollWidth <= tabs.clientWidth + 1;
    wrap.classList.toggle('scrolled-end', atEnd || noOverflow);
  };

  tabs.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  // Initial paint after layout settles
  requestAnimationFrame(update);
}

function switchCategory(id) {
  STATE.activeCategory = id;
  $$('.cat-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === id));
  renderCategoryContent(id);
}

function renderCategoryContent(id) {
  const cat = STATE.data.categories.find(c => c.id === id);
  if (!cat) return;
  const content = $('#catContent');
  content.innerHTML = '';
  if (cat.blurb) {
    const blurb = document.createElement('p');
    blurb.className = 'cat-blurb';
    blurb.textContent = cat.blurb;
    content.appendChild(blurb);
  }
  const list = document.createElement('div');
  list.className = 'treatments';
  cat.treatments.forEach(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'treatment' + (STATE.selected.has(t.id) ? ' selected' : '');
    btn.dataset.tid = t.id;
    btn.innerHTML = `
      <div class="treatment-main">
        <h3 class="treatment-name">${escapeHtml(t.name)}</h3>
        ${t.desc ? `<p class="treatment-desc">${escapeHtml(t.desc)}</p>` : ''}
      </div>
      <div class="treatment-meta">
        <span class="treatment-price">R${t.price.toLocaleString('en-ZA')}</span>
        <span class="treatment-duration">${t.duration} min</span>
        <span class="treatment-tick" aria-hidden="true">✓</span>
      </div>`;
    btn.addEventListener('click', () => toggleTreatment(t));
    list.appendChild(btn);
  });
  content.appendChild(list);
}

function toggleTreatment(t) {
  if (STATE.selected.has(t.id)) STATE.selected.delete(t.id);
  else STATE.selected.set(t.id, t);
  renderCategoryContent(STATE.activeCategory);
  renderSummary();
}

// ──────────────── Summary ────────────────

function renderSummary() {
  const box = $('#summaryContent');
  const sendBtn = $('#sendBtn');
  const sendLbl = $('.send-btn-label');
  const cart = $('#floatCart');
  const note = $('#depositNote');

  if (STATE.selected.size === 0) {
    box.innerHTML = '';
    $('#summary').hidden = true;
    sendBtn.disabled = true;
    sendLbl.textContent = 'Choose a treatment to continue';
    cart.hidden = true;
    if (note) note.hidden = true;
    return;
  }
  $('#summary').hidden = false;
  if (note) note.hidden = false;

  let total = 0;
  let mins = 0;
  let rows = '';
  STATE.selected.forEach(t => {
    total += t.price;
    mins += t.duration;
    rows += `
      <div class="summary-row">
        <div>
          <div class="summary-row-name">${escapeHtml(t.name)}</div>
          <div class="summary-row-meta">${t.duration} min</div>
        </div>
        <div style="display:flex;align-items:center;">
          <span class="summary-row-price">R${t.price.toLocaleString('en-ZA')}</span>
          <button class="summary-remove" type="button" data-rid="${t.id}" aria-label="Remove">×</button>
        </div>
      </div>`;
  });
  const deposit = Math.max(10, Math.round((total * 0.30) / 10) * 10);
  box.innerHTML = rows + `
    <div class="summary-total">
      <div>
        <div>Estimated total</div>
        <div class="summary-total-note">${formatMinutes(mins)} of treatment</div>
      </div>
      <div>R${total.toLocaleString('en-ZA')}</div>
    </div>
    <div class="summary-deposit">
      <span>Deposit due today (30%)</span>
      <strong>R${deposit.toLocaleString('en-ZA')}</strong>
    </div>
    <p class="summary-deposit-note">Balance of R${(total - deposit).toLocaleString('en-ZA')} settles on arrival.</p>`;

  box.querySelectorAll('.summary-remove').forEach(b => {
    b.addEventListener('click', () => {
      STATE.selected.delete(b.dataset.rid);
      renderCategoryContent(STATE.activeCategory);
      renderSummary();
    });
  });

  sendBtn.disabled = false;
  sendLbl.textContent = `Pay R${deposit.toLocaleString('en-ZA')} deposit & book →`;
  cart.hidden = false;
  $('.float-cart-count').textContent = STATE.selected.size;
}

function formatMinutes(m) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

// ──────────────── Returning customer ────────────────

let emailCheckTimer = null;

function onEmailChange() {
  clearTimeout(emailCheckTimer);
  const email = $('#yourEmail').value.trim().toLowerCase();
  if (!email || !email.includes('@') || STATE.loggedIn) {
    $('#welcomeBack').hidden = true;
    STATE.emailKnown = null;
    return;
  }
  // Debounce 600ms before pinging the magic-link endpoint
  emailCheckTimer = setTimeout(async () => {
    // We don't have a "check email" endpoint (that would enable enumeration);
    // instead we show the welcome-back banner whenever the format is valid,
    // and let the magic-link endpoint silently no-op if the email isn't known.
    if (email === STATE.emailKnown) return;
    STATE.emailKnown = email;
    $('#welcomeBackText').textContent = `Have you booked with us before? We'll email you a sign-in link to pull up your details.`;
    $('#welcomeBack').hidden = false;
  }, 600);
}

async function requestMagicLink() {
  const email = $('#yourEmail').value.trim().toLowerCase();
  if (!email) return;
  const btn = $('#sendMagicLink');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    await fetch('/api/magic-link/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    btn.textContent = '✓ Check your email';
  } catch (e) {
    btn.textContent = 'Try again';
    btn.disabled = false;
  }
}

function renderLoggedInPanel() {
  if (!STATE.loggedIn) return;
  const { customer, bookings } = STATE.loggedIn;
  $('#welcomeBack').hidden = true;
  $('#loggedInPanel').hidden = false;
  $('#loggedInGreeting').textContent = `Welcome back, ${customer.name?.split(' ')[0] || 'friend'} 🌿`;
  const visits = customer.visits_count || 0;
  const spent = (customer.cents_spent / 100) | 0;
  $('#loggedInStats').textContent = visits > 0
    ? `${visits} visit${visits === 1 ? '' : 's'} with us · R${spent.toLocaleString('en-ZA')} treated yourself to.`
    : "We don't have a completed visit on file yet — let's change that.";
  const completed = bookings.find(b => b.status === 'completed');
  const lastVisit = $('#lastVisit');
  if (completed) {
    lastVisit.innerHTML = `
      <p class="last-visit-label">Last time you had:</p>
      <ul class="last-visit-list">
        ${completed.treatments.map(t => `<li>${escapeHtml(t.name)}</li>`).join('')}
      </ul>
      <button type="button" id="bookAgainBtn" class="link-btn">Book the same again →</button>`;
    $('#bookAgainBtn').addEventListener('click', () => {
      STATE.selected.clear();
      for (const t of completed.treatments) {
        // Resolve from current catalog by id
        for (const cat of STATE.data.categories) {
          const match = cat.treatments.find(x => x.id === t.id);
          if (match) STATE.selected.set(match.id, match);
        }
      }
      renderCategoryContent(STATE.activeCategory);
      renderSummary();
      $('#summary').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  } else {
    lastVisit.innerHTML = '';
  }
}

async function logout() {
  await fetch('/api/me/logout', { method: 'POST' });
  location.reload();
}

// ──────────────── Policies & misc ────────────────

function renderPolicies() {
  const ul = $('#policyList');
  ul.innerHTML = '';
  STATE.data.policies.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p;
    ul.appendChild(li);
  });
}

function renderEmailLink() {
  $('#emailLink').href = `mailto:${STATE.data.contact.email}?subject=${encodeURIComponent('Spa booking enquiry')}`;
}

// ──────────────── Submit booking ────────────────

function setupListeners() {
  $('#sendBtn').addEventListener('click', submitBooking);
  $('#floatCart').addEventListener('click', () => {
    $('#summary').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('#yourEmail').addEventListener('input', onEmailChange);
  $('#sendMagicLink').addEventListener('click', requestMagicLink);
  $('#logoutBtn').addEventListener('click', logout);
}

async function submitBooking() {
  if (STATE.selected.size === 0) return;
  const sendBtn = $('#sendBtn');
  const sendLbl = $('.send-btn-label');

  const payload = {
    email: $('#yourEmail').value.trim().toLowerCase(),
    phone: $('#yourPhone').value.trim(),
    name: $('#yourName').value.trim(),
    preferred_date: $('#prefDate').value,
    preferred_time: $('#prefTime').value,
    guests: Number($('#prefGuests').value) || 1,
    treatment_ids: Array.from(STATE.selected.keys()),
    notes: $('#yourNotes').value.trim(),
  };

  // Light client-side validation
  if (!payload.email || !payload.email.includes('@')) {
    alert('Please enter a valid email address.');
    $('#yourEmail').focus(); return;
  }
  if (!payload.name) {
    alert('Please enter your name.');
    $('#yourName').focus(); return;
  }
  if (!payload.phone) {
    alert('Please enter your phone number — the spa team will use it to confirm.');
    $('#yourPhone').focus(); return;
  }

  sendBtn.disabled = true;
  sendLbl.textContent = 'Setting up secure payment…';

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      alert((data.errors || [data.error || 'Something went wrong']).join('\n'));
      sendBtn.disabled = false;
      renderSummary();
      return;
    }
    // Redirect to Yoco hosted checkout
    window.location.href = data.checkout_url;
  } catch (e) {
    alert('Could not reach our booking server. Please try again in a moment.');
    sendBtn.disabled = false;
    renderSummary();
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
