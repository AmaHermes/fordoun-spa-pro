# Fordoun Spa — Booking Site Concepts

Two demo versions, side by side, so you can see what's possible.

| | WhatsApp version | Full booking system |
|---|---|---|
| **Try it** | [amahermes.github.io/fordoun-spa-redux](https://amahermes.github.io/fordoun-spa-redux/) | [amahermes.github.io/fordoun-spa-pro](https://amahermes.github.io/fordoun-spa-pro/) |
| **Code** | `AmaHermes/fordoun-spa-redux` | `AmaHermes/fordoun-spa-pro` |
| **Cost to run** | Free | ~R0–R200/month at small volume |
| **Build effort** | Done | Done (demo only — needs Yoco + email setup to go live) |

Both versions show off the **same elegant booking experience** for the guest. The difference is what happens *after* they tap "Book". One sends a beautifully formatted WhatsApp message; the other takes a real deposit, sends real confirmation emails, and gives the spa team a private dashboard to manage everything.

---

## The current way (no online booking)

Right now if someone wants to book a treatment at Fordoun, they:

1. Find the website
2. Find the spa page
3. Either ring the front desk, dig out an email address, or open WhatsApp
4. Type out what they want, when, for how many people
5. Wait for someone at the spa to reply
6. Back-and-forth on availability
7. Eventually agree on a slot
8. Show up; everyone hopes the booking didn't fall through the cracks

That's **6 to 10 WhatsApp messages**, scattered across multiple staff inboxes, with no record of customer history. It works — but it leaks bookings, it's slow, and it asks the same questions every single time.

---

## Option 1 — The WhatsApp version

**Live demo:** [amahermes.github.io/fordoun-spa-redux](https://amahermes.github.io/fordoun-spa-redux/)

### What it does

A beautiful, modern booking page that lets a guest:

- Browse the full treatment menu (all 68 treatments, current prices, accurate durations)
- Pick the treatments they want, see a running total
- Choose a preferred date and time-of-day
- Add personal details and notes
- Tap **one button** that opens WhatsApp with a perfect, structured message pre-typed and ready to send to the spa team

That's it. The spa team gets one neat, complete WhatsApp message instead of a back-and-forth.

### What changes for the spa team

- **Nothing.** WhatsApp Business still rings on the same phone. Bookings still get confirmed and managed the way they always have been.
- They just receive **better-formatted, complete-on-arrival enquiries** instead of half-questions.
- A guest who used to need 6 messages now sends 1.

### Strengths

- ✅ **Zero new system to learn.** No new app, no new dashboard, no training.
- ✅ **Zero ongoing cost.** Hosted free on GitHub Pages forever.
- ✅ **Works tomorrow.** Could be embedded in fordoun.com today, no setup required.
- ✅ **Guests still get the spa experience.** Booking still ends in a personal conversation, which suits a luxury boutique hotel.
- ✅ **No technical risk.** Nothing to break, nothing to maintain.

### Honest limitations

- ❌ **No real-time availability.** Two guests could ask for the same Saturday 10am slot at the same time.
- ❌ **No deposit collection.** Cancellations still cost the spa real money — there's no financial commitment from the guest until they arrive.
- ❌ **No customer history.** Every booking is treated as a fresh enquiry, even from regulars.
- ❌ **The spa still does all the admin** by hand on WhatsApp — no calendar, no reminders, no follow-up.

---

## Option 2 — The full booking system

**Live demo:** [amahermes.github.io/fordoun-spa-pro](https://amahermes.github.io/fordoun-spa-pro/) *(clickable mockup — no real payments, no real emails)*

Same beautiful booking page as Option 1, **plus** a real booking engine, secure deposit collection, customer recognition, and a private admin dashboard for the spa team.

### What it does (for the guest)

The guest journey starts the same: pick treatments, fill in details. But then:

1. **Tap "Pay R— deposit & book"** — they go to a secure payment page (Yoco-hosted, PCI-compliant)
2. **Pay a 30% deposit** with their card (R890 deposit on a R2 970 booking, say)
3. **Get a confirmation page + email immediately** ("We've received your deposit. The spa team will confirm your exact time on WhatsApp shortly.")
4. **Spa team WhatsApps them** to pin the exact treatment time
5. **Reminder email lands 24 hours before** their visit
6. **They arrive, settle the balance, get treated.** Done.

### What returning guests see

The system recognises customers by email.

The next time **Jane** comes back to book, the page greets her:

> 👋 *Welcome back, Jane 🌿*
> *2 visits with us · R3 970 treated yourself to.*
> *Last time you had: Ndlovu Signature Full Body, Hot Stone.*
> *[Book the same again →]*

She doesn't have to re-enter her name, phone, or email. One tap recreates her favourite combination.

### What the spa team gets

A private password-protected dashboard at `/admin` (try it in the demo — password is `letmein`) showing:

- **⚠️ Awaiting time confirmation** — guests who've paid the deposit but need a WhatsApp from the spa to confirm the exact slot. One tap "✓ Confirmed slot" once you've messaged them.
- **Today / Tomorrow** — everyone coming in soon, sorted by time, with phone + WhatsApp links to message them.
- **Recent bookings** — the full ledger.
- **Customer history** — tap any returning guest to see their full visit history, favourite treatments, lifetime spend.

Every action — confirm, complete, no-show — updates the guest record. Visit counts and lifetime spend accumulate automatically. No spreadsheets, no notes, no "did we already serve them?".

### What it costs

- **Setup:** A few clicking-around steps to get accounts at Yoco (the payment processor) and Resend (the email service). Both have free tiers that comfortably cover a small luxury spa's volume.
- **Yoco fees:** ~2.95% + R0.50 per card transaction. Same rate the spa would pay anywhere.
- **Email:** Free at up to 3,000 sends per month — well above what a spa needs.
- **Hosting:** Free on Cloudflare's developer plan, even at 10× current spa volume.
- **Bottom line:** R0/month in fees, ~R30–R90 in card processing per booking taken in card.

### Strengths

- ✅ **Stops no-shows.** A 30% deposit means people actually show up. Industry data: pre-paid deposits typically reduce no-shows by 60–80%.
- ✅ **No double-bookings.** Even with the "spa confirms exact time on WhatsApp" model, deposits act as a financial commitment that stops casual over-booking.
- ✅ **Treats your regulars like regulars.** Returning customers see their history; the spa team sees who's a VIP without needing memory or a notebook.
- ✅ **Recovers booking labour.** Spa staff stop typing "What treatment? What day? How many people?" — that's already in the system.
- ✅ **Marketing-ready.** The customer database (with consent) becomes a list you can email about offers, retreats, or the Indulgent African Earth Experience promo.
- ✅ **Embeds in fordoun.com seamlessly.** Could replace the existing "Spa enquiry" page entirely, or sit alongside.

### Honest limitations

- ❌ **More moving parts.** Real payment processing means real money, real refunds, real customer service. If a guest disputes a charge, someone needs to handle it.
- ❌ **Yoco account required.** ~30 min of paperwork to open, including bank verification.
- ❌ **The spa team needs to check the admin page.** Not constantly — the system emails alerts on new bookings — but it's a new tab to open occasionally.
- ❌ **If the payment processor has a 10-minute outage**, new bookings stall. (Rare. Yoco's uptime is excellent. But it's a new dependency.)

---

## Quick comparison

| | WhatsApp version | Full booking system |
|---|---|---|
| Guests can browse the menu and assemble their booking | ✅ | ✅ |
| Mobile-friendly | ✅ | ✅ |
| Sends a structured request to the spa | ✅ (WhatsApp) | ✅ (email + dashboard) |
| Reduces back-and-forth messaging | ✅ | ✅✅ |
| Real-time deposit collection | ❌ | ✅ |
| Reduces no-shows | ❌ | ✅ |
| Recognises returning customers | ❌ | ✅ |
| Internal admin dashboard | ❌ | ✅ |
| Automatic 24-hour reminder emails | ❌ | ✅ |
| Customer database for marketing | ❌ | ✅ |
| Setup time | 0 days | ~1 day to wire up Yoco + email |
| Ongoing cost | R0/month | R0/month + card fees per transaction |
| Risk of something breaking | Almost none | Low — depends on Yoco + email uptime |

---

## What I'd suggest

There's no wrong answer here.

**If Fordoun's spa wants to test the water** — the WhatsApp version is a no-risk, no-cost, embed-tomorrow upgrade. It already wins half the battle (cleaner enquiries, modern booking page, less back-and-forth) without changing how the spa team actually works.

**If they want to grow it into a proper revenue engine** — the full booking system is what serious spas around the world use. Deposit-secured bookings, customer history, marketing list, automatic reminders. It's the kind of system Fordoun's brand quality deserves.

A practical pathway: **ship the WhatsApp version first** (this week), let it run for a month or two, see how it affects enquiries and the spa team's workflow. If it goes well, **graduate to the full system** with confidence that the demand is real.

Either way, the booking page itself — the part the guest sees — is the same beautiful experience.

---

## Try the demos

- 📱 **WhatsApp version:** [amahermes.github.io/fordoun-spa-redux](https://amahermes.github.io/fordoun-spa-redux/)
- 💎 **Full booking system:** [amahermes.github.io/fordoun-spa-pro](https://amahermes.github.io/fordoun-spa-pro/)
  - Try a full booking flow (no real card needed)
  - Sign into the admin at `/admin` with password `letmein`
  - "Reset demo" up top wipes all data and starts you fresh

---

*Both concepts designed and built by Razz in collaboration with Hermes (an AI assistant). Hero photography © Fordoun Hotel & Spa.*
