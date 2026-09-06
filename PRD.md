# PRD — BIM EOW Daily Report App
### Product Requirements Document & Phased Roadmap

**Written for:** Khoi (product owner, non-coder)
**Last updated:** 2026-09-06
**Plain-language rule:** everything here is explained simply, using a
restaurant analogy. 🍜

---

## 1. What is this app? (one sentence)

A website where the BIM Wind Farm inspection team fills in their **daily
turbine inspection report** — work done, safety checks, problems found,
photos — and the team leader can see everything in one place and print it.

**Restaurant analogy:** it's a kitchen order system. Inspectors are the
cooks writing down every dish (turbine) they worked on. The daily report is
the order ticket. The final report is the full menu of everything served.

---

## 2. Core features (what the app can ALREADY do)

Good news: the food stand is **already built and cooking**. Here is what
exists today:

| # | Feature | Restaurant version |
|---|---------|--------------------|
| 1 | **Login with email + password** (no self-signup — accounts are created by the owner) | Only staff with a key can enter the kitchen |
| 2 | **List of daily reports** — one per day, create / open / delete | The stack of order tickets, one per day |
| 3 | **Report editor** — big form with sections: turbines worked on, lock schedule, safety questions, progress %, issues, tomorrow's plan, signatures | The order ticket the cooks fill in |
| 4 | **Findings with photos** — problems found on turbines, with severity 1–5 and photo evidence (photos are shrunk automatically so they upload fast) | Taking a picture of a burnt dish and noting how bad it is |
| 5 | **Autosave** — every change saves itself after ~1 second; no Save button to forget | The ticket writes itself down — nothing gets lost |
| 6 | **Multi-user live editing** — several people can edit the same report at once; a finding being edited by one person is locked for others | Two cooks can work the same ticket without bumping elbows |
| 7 | **Copy-as-text export** — one click gives a bilingual (VN/EN) text version to paste into chat/email | Reading the ticket out loud to the customer |
| 8 | **Print view** — a clean, printable page per report | A nicely printed receipt |
| 9 | **Final report** — combines many days into one summary with a findings matrix per turbine | The end-of-month accounting book |
| 10 | **Real database + private photo storage** (Supabase) with row-level security — only logged-in users can read/write | A locked pantry, not a cardboard box on the street |

**Technology (for reference only):** Next.js 16 + React 19 website,
Supabase for database/photos/login, deployable to Vercel. Build and lint
both pass with zero errors (checked 2026-09-06).

---

## 3. The phased roadmap

### 🥡 Phase 1 — TODAY's quick win: OPEN THE FOOD STAND
*The food is cooked. We just need to open the window and serve.*

The app is built but (as far as this repo shows) not yet live for the team.
The quick win is **putting it on the internet** so real inspectors can use
it today.

Steps (I do the code parts; you do the account parts):
1. **You:** create a free account at supabase.com (the pantry + door lock).
2. **Me/You together:** run the ready-made `supabase/schema.sql` file there
   (builds the shelves), create the private `evidence-photos` bucket, and
   create one email+password account per team member.
3. **You:** create a free account at vercel.com (the storefront) and import
   this GitHub repo. Paste in the two Supabase keys.
4. **Test ladder for this phase:**
   - ✅ Page loads with no errors (already verified: the app builds clean)
   - ☐ Log in works with a real account
   - ☐ Create a report, type something, refresh — it's still there (autosave)
   - ☐ Upload a photo, see it appear
   - ☐ Log out → app blocks you from seeing anything (security)

**Done when:** one real inspector fills in one real report on their phone.

---

### 🍜 Phase 2 — Small restaurant: MAKE DAILY LIFE EASIER
*Same food, faster service.*

Small features that save the team minutes every single day:

1. **"Copy yesterday" button** — new report starts pre-filled with
   yesterday's turbines/plan (the cooks don't rewrite the menu each morning).
2. **Search & filter the report list** — find "the day we had the gearbox
   finding" fast.
3. **Password reset by email** — so you don't have to fix forgotten
   passwords by hand.
4. **Better phone experience polish** — inspectors work on turbines with
   gloves; buttons should be big and forgiving.

**Test ladder:** page loads → each new button works → data really saves to
the database → a logged-out user still can't touch anything.

---

### 🍽️ Phase 3 — Full menu: REPORTING POWER
*Now we serve managers, not just cooks.*

1. **PDF export** — one click, a real PDF file of the daily or final
   report (today it's "print", which works, but PDF is easier to email).
2. **Excel export** — findings list as a spreadsheet for the office team.
3. **Simple dashboard** — progress chart across days, findings by severity,
   which turbines are done (the manager's window into the kitchen).
4. **Email the daily report automatically** at a set time each evening.

**Test ladder:** same as before, plus: open the PDF/Excel on a phone and a
laptop and check nothing is cut off.

---

### 🏢 Phase 4 — Restaurant with front & back of house: ROLES & TRUST
*Waiters, cooks, and a manager — each with their own keys.*

1. **Roles:** Admin (can delete reports, manage users) vs. Inspector (can
   write reports) vs. Viewer (client/GE can only read). Today, everyone who
   can log in can do everything.
2. **Audit trail** — who changed what and when (the manager's logbook).
3. **Lock finished reports** — once signed, a report becomes read-only.
4. **Offline mode (PWA)** — turbines have bad signal; let inspectors keep
   typing offline and sync when back in range.

**Test ladder:** the security step gets serious here — a Viewer account
must be *proven* unable to edit or delete (we try to break in on purpose).

---

## 4. Testing rules (every phase, in this order)

1. **Page loads with no errors** — turn on the stove, no smoke.
2. **Buttons & forms work** — every knob does what its label says.
3. **Real APIs work** — the ticket really reaches the kitchen (data truly
   saved in Supabase, photos truly in storage).
4. **Security check** — locked doors stay locked: logged-out users blocked,
   photos not publicly reachable, and (from Phase 4) roles enforced.

We never move to the next phase while the current one has a red ❌.

---

## 5. What could go wrong (risks, in plain words)

- **Free-tier limits:** Supabase/Vercel free plans are fine for a team of
  dozens; if photo storage grows past ~1 GB we may need the cheap paid tier.
- **One shared power level:** until Phase 4, every account can delete any
  report. We accept this for now because the team is small and trusted.
- **Bad signal at the turbines:** until Phase 4's offline mode, inspectors
  need at least a weak connection to save.

---

## 6. What I need from YOU right now

To finish Phase 1 today, do these two things (10 minutes total):

1. Go to **supabase.com** → sign up (free) → "New project". Send me (or
   paste into the chat) the **Project URL** and **anon public key** from
   Settings → API. *(These are like the restaurant's address and front-door
   key for customers — safe to share with me; there is a separate master
   key we will NOT use.)*
2. Go to **vercel.com** → sign up (free) with your GitHub account.

Then tell me "done" and I'll walk you through the last clicks.
