# Design System

*Source: oldmd/DESIGN.md (adopted June 22, 2026 — Design System V2 from Prototypes). Also: STATUS.md §26 (Design System V2 implementation session).*

---

## 1. Visual Identity

| Decision | Value |
|---|---|
| Primary brand color | `#0C447C` |
| Brand2 | `#1565C0` |
| Brand3 | `#2671C4` |
| Deep Navy | `#06294F` |
| Spark / Accent | `#36A3FF` |
| Ink (deepest text) | `#0A1628` |
| Page background | `#E9EEF5` + light radial gradients |
| Surface (cards) | `rgba(255,255,255,0.74)` glass |
| Error color | `#FCEBEB` bg / `#A32D2D` text / `#DC2626` icon |
| Success color | `#DCFCE7` bg / `#15803D` text |
| Warning color | `#FEF3C7` bg / `#D97706` text |
| Default mode | Light — dark mode is now fully implemented (STATUS.md §33) |
| UI language | Arabic / English (user selects) |
| Numbers | Always English — `value.toLocaleString('en-US')` never `formatNumber()` |

---

## 2. CSS Variables — globals.css

```css
:root {
  /* Brand */
  --deep:    #06294F;
  --brand:   #0C447C;
  --brand2:  #1565C0;
  --brand3:  #2671C4;
  --spark:   #36A3FF;
  --ink:     #0A1628;

  /* Background */
  --bg:      #E9EEF5;
  --bg2:     #F5F8FC;
  --bg3:     #EEF3F9;
  --surface: #FFFFFF;

  /* Glass */
  --glass:      rgba(255,255,255,0.74);
  --glass-line: rgba(255,255,255,0.95);

  /* Text */
  --text:  #0A1628;
  --text2: #54657C;
  --text3: #8C9CB2;
  --text4: #B4C0CF;

  /* Border */
  --border:      #E4EAF2;
  --border-soft: #EEF2F7;

  /* Shadows */
  --sh-xs:    0 1px 2px rgba(10,22,40,.05);
  --sh-sm:    0 1px 3px rgba(10,22,40,.06), 0 1px 2px rgba(10,22,40,.04);
  --sh-md:    0 4px 6px rgba(10,22,40,.03), 0 8px 24px rgba(10,22,40,.07);
  --sh-lg:    0 8px 16px rgba(10,22,40,.05), 0 20px 48px rgba(10,22,40,.12);
  --sh-brand: 0 6px 18px rgba(12,68,124,.3), 0 2px 6px rgba(12,68,124,.22);
  --sh-hero:  0 12px 36px rgba(12,68,124,.25), 0 4px 12px rgba(12,68,124,.18);

  /* Radius */
  --r:  20px;   /* cards, hero, modals */
  --rs: 14px;   /* smaller cards */
  --rx: 11px;   /* inputs, chips, badges */

  /* Topbar */
  --th: 66px;
  /* Sidebar */
  --sw: 264px;
}
```

---

## 3. Tailwind Config — tailwind.config.ts

```ts
colors: {
  brand: {
    deep:   '#06294F',
    DEFAULT:'#0C447C',
    2:      '#1565C0',
    3:      '#2671C4',
    spark:  '#36A3FF',
  },
  ink: '#0A1628',
  surface: 'rgba(255,255,255,0.74)',
},
boxShadow: {
  sm:    '0 1px 3px rgba(10,22,40,.06), 0 1px 2px rgba(10,22,40,.04)',
  md:    '0 4px 6px rgba(10,22,40,.03), 0 8px 24px rgba(10,22,40,.07)',
  lg:    '0 8px 16px rgba(10,22,40,.05), 0 20px 48px rgba(10,22,40,.12)',
  brand: '0 6px 18px rgba(12,68,124,.3), 0 2px 6px rgba(12,68,124,.22)',
  hero:  '0 12px 36px rgba(12,68,124,.25), 0 4px 12px rgba(12,68,124,.18)',
},
borderRadius: {
  card: '20px',
  sm:   '14px',
  xs:   '11px',
},
fontFamily: {
  ar: ['IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
  en: ['Inter', 'system-ui', 'sans-serif'],
  sar: ['SaudiRiyal', 'sans-serif'],
},
```

---

## 4. Topbar

| Decision | Value |
|---|---|
| Background | `linear-gradient(115deg, #082F5C 0%, #0C447C 42%, #1761B8 100%)` |
| Height | `66px` — CSS variable `--th` |
| Shadow | `0 6px 28px rgba(8,47,92,.42), 0 1px 0 rgba(255,255,255,.1) inset` |
| Inner highlight | pseudo-element `::after` — `linear-gradient(180deg, rgba(255,255,255,.07), transparent 42%)` |
| Position | `fixed` at top of page always |
| Logo | Glass pill: `rgba(255,255,255,.28/.12)` + border `rgba(255,255,255,.3)` |
| Nav links | `rgba(255,255,255,.85)` — hover: white + underline bar expands from center |
| Ghost button in Nav | `rgba(255,255,255,.1)` border `rgba(255,255,255,.25)` backdrop-blur |
| Primary button in Nav | Pure white `#fff` + `color: #0C447C` |
| Topbar content | logo + company name (dropdown) + branch name + search + notifications + avatar |

---

## 5. Sidebar

| Decision | Value |
|---|---|
| Width | `264px` — CSS variable `--sw` |
| Background | `linear-gradient(180deg, rgba(255,255,255,.88), rgba(255,255,255,.72))` |
| Backdrop filter | `blur(22px) saturate(180%)` |
| Border | `1px solid rgba(255,255,255,.95)` |
| Shadow | `-4px 0 28px rgba(10,22,40,.04)` |
| Active item | `linear-gradient(135deg, #0C447C, #1761B8)` + white text + `box-shadow: var(--sh-brand)` |
| Hover item | `rgba(12,68,124,.065)` bg + brand text |
| Active icon | white — hover icon: brand |
| Icons | Lucide React — `strokeWidth={2}` — `18-20px` |
| Section labels | `10px`, `font-weight: 700`, `letter-spacing: .13em`, `color: var(--text4)` |
| Badges | gradient: blue/green/orange by type |
| Position | `fixed` right (RTL) / left (LTR) |
| Subscription card | navy gradient at bottom of sidebar |
| Mobile collapse | hidden, opens as overlay on mobile |

**Note on sidebar bug fix (STATUS.md §44):** The mobile hamburger was broken because `lg:hidden` was overridden by an inline `display` style. Fix: move display control to className only.

### Full Sidebar Sections (Owner Role)

Dashboard

Sales → POS / Invoices / Returns / Promotions & Discounts / Coupons / Gift Cards / Loyalty

Inventory → Products / Stock / Stock Count / Suppliers / Purchase Orders

Operations* → Tables / Reservations / Queue / Kitchen Display

Customers → Customer List / Purchase History / Loyalty Points

Finance → Expenses / VAT Tax / ZATCA / Financial Reports

HR → Employees / Attendance / Shifts / Commissions

Reports → Sales / Inventory / Employees / Customers / Tax / Export

Administration → Branches / Users & Permissions / Settings

*Operations: conditional — restaurants and cafes only (business_type / activity)

**POS Rule:** POS must be available for ALL 37 activities without exception. The sidebar business_type filtering introduced in §28 does NOT apply to POS.

---

## 6. Hero Band (Dashboard) — Required Element

The signature band at the top of every dashboard.

| Decision | Value |
|---|---|
| Background | `linear-gradient(125deg, #0C447C 0%, #155799 50%, #2671C4 100%)` |
| Height | `~150px` min-height |
| Border radius | `22px` |
| Shadow | `var(--sh-hero)` |
| Area chart | behind content, `opacity: .4`, gradient `rgba(191,219,254,.35→0)` |
| Grid overlay | `rgba(255,255,255,.03)` 42px×42px with mask gradient |
| Mesh overlay | light radial gradients (indigo + cyan) |
| Primary number | `40px`, `font-weight: 700`, `color: #fff` |
| Delta badge | `rgba(74,222,128,.18)` bg + `#86EFAC` text |
| Side cards | `rgba(255,255,255,.1)` glass + `backdrop-filter: blur(12px)` |
| Live dot | `#4ADE80` pulse animation |

---

## 7. Stat Cards

| Decision | Value |
|---|---|
| Background | Glass: `rgba(255,255,255,.74)` + `backdrop-filter: blur(20px) saturate(160%)` |
| Border | `1px solid rgba(255,255,255,.95)` |
| Border radius | `20px` |
| Shadow | `var(--sh-md)` → hover: `var(--sh-lg)` |
| Top stripe | `3px` solid gradient colored by card type |
| Stripe colors | blue: `#0C447C→#3B82F6` / green: `#059669→#34D399` / purple: `#6D28D9→#A78BFA` / amber: `#B45309→#FBBF24` |
| Icon | `42×42px`, `border-radius: 13px`, gradient matching stripe |
| Primary number | `28px`, `font-weight: 700`, `tabular-nums` |
| Delta badge | up: `#DCFCE7`/`#15803D` — down: `#FEE2E2`/`#B91C1C` |
| Sparkline | `34px` height, Recharts LineChart at bottom of card |
| Hover | `translateY(-4px)` + `0.3s cubic-bezier(.4,0,.2,1)` |

---

## 8. Chart Cards

| Decision | Value |
|---|---|
| Background | Same glass as Stat Cards |
| Header | `36×36` icon + title + sub-label + side tag |
| Chart library | Recharts |
| Bar chart height | `200px` |
| Doughnut height | `160px` + absolute center number/label |
| Bar style | `radius: 8`, gradient fill, compared with dashed line |
| Tooltip | RTL, `bg: rgba(10,22,40,.95)`, `borderRadius: 12` |

---

## 9. DateRangePicker and SingleDatePicker

See [`frontend-architecture.md`](./frontend-architecture.md#shared-ui-components) for full component specifications.

Rules:
- Never use raw `<input type="date">` — always use `SingleDatePicker` or `DateRangePicker`.
- Rendered via `createPortal` — escapes overflow and stacking context issues.
- Positioned via `useFloatingPosition` hook — viewport-clamped, flip-above-trigger if insufficient room below, z-index 9999.

---

## 10. Animations

| Element | Value |
|---|---|
| Page reveal | `fadeUp`: `translateY(14px)→0`, `0.55s cubic-bezier(.4,0,.2,1)` |
| Stagger | `.04s` delay between elements (d1→d6) |
| Hover cards | `translateY(-4px)`, `0.3s` |
| Hover buttons | `translateY(-1px)`, `0.2s` |
| CTA glow pulse | `box-shadow` pulse `2.6s infinite` |
| Scroll reveal | `IntersectionObserver` threshold `0.1`, `translateY(22px)→0` |
| Step wizard | `translateX(18px)→0`, `0.4s cubic-bezier(.4,0,.2,1)` |
| `prefers-reduced-motion` | `animation: none; transition: none` — mandatory |

```tsx
// Framer Motion
initial={{ opacity: 0, y: 14 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1], delay: index * 0.04 }}

// Or Tailwind class
className="animate-fade-up"
```

---

## 11. Typography

| Element | Size | Weight | Notes |
|---|---|---|---|
| Hero number | `40px` | `700` | letter-spacing: -1.5px |
| Section H2 | `40px` | `700` | letter-spacing: -1.2px |
| Page title | `24px` | `700` | letter-spacing: -.6px |
| Card number | `28px` | `700` | tabular-nums |
| Card label | `12px` | `500` | color: text2 |
| Sidebar nav | `13px` | `500` | active: `600` |
| Badge/tag | `10-12px` | `700` | |
| Body | `14-15px` | `400-500` | |
| Font AR | `IBM Plex Sans Arabic` | | weights: 300,400,500,600,700 |
| Font EN | `Inter` | | weights: 400,500,600,700,800 |

---

## 12. Inputs and Forms

| Decision | Value |
|---|---|
| Border | `1.5px solid var(--border)` |
| Border radius | `11-12px` |
| Background | `var(--bg2)` → focus: `#fff` |
| Focus ring | `0 0 0 3.5px rgba(12,68,124,.11)` + `border-color: var(--brand)` |
| Hover border | `var(--text3)` |
| Icon inside input | right (RTL) / left (LTR) — `18px` — `color: var(--text4)` |
| Padding with icon | `13px 44px 13px 14px` (RTL) |

---

## 13. Buttons

| Type | Style |
|---|---|
| Primary | `linear-gradient(135deg, #0C447C, #1565C0)` + `color:#fff` + `box-shadow: var(--sh-brand)` |
| Ghost | `border: 1.5px solid var(--border)` + `color: var(--brand)` + transparent bg |
| Ghost on Navy | `rgba(255,255,255,.1)` bg + `border: rgba(255,255,255,.25)` + `color:#fff` |
| Danger | `#DC2626` bg |
| Border radius | `10-13px` by size |
| Hover Primary | `translateY(-1px)` + `box-shadow: var(--sh-lg)` |
| Hover Ghost | `border-color: var(--brand)` + `bg: var(--bg2)` |
| Disabled | `opacity: .5` + `cursor: not-allowed` |

---

## 14. Modals and Dialogs

| Decision | Value |
|---|---|
| Overlay | `rgba(10,22,40,.5)` + `backdrop-filter: blur(8px)` |
| Card | `#fff` + `border-radius: 24px` + `max-width: 440px` |
| Animation | `translateY(26px) scale(.96)→none`, `0.3s cubic-bezier(.4,0,.2,1)` |
| Close button | top of card — `34×34px` rounded |
| Submit button | Full-width + gradient brand + inner highlight pseudo |

All modals rendered via `createPortal(..., document.body)`. See [`frontend-architecture.md`](./frontend-architecture.md#portal-rendering).

---

## 15. Icons

| Decision | Value |
|---|---|
| Library | `lucide-react` — no emoji, no PNG |
| `strokeWidth` | `2` for nav — `2.1-2.2` for hero/feature icons |
| `fill` | `none` always (except logo which has `fill:#fff`) |
| Size | Nav: `18-20px` / Cards: `20-25px` / Feature: `25px` |
| `stroke-linecap` | `round` |
| `stroke-linejoin` | `round` |

---

## 16. Dark Mode

Full dark mode was implemented in STATUS.md §33 (June 24-25, 2026). 29 files converted.

Dark mode pattern:
- Tailwind `dark:` variant classes on all components.
- Toggled by user preference; persisted via the `settings` namespace.
- SuperAdmin pages use dark navy theme by default regardless of toggle.
- All new components must include `dark:` variant classes.

The `background` CSS shorthand bug was fixed during dark mode implementation: always use explicit `background-color` and `background-image` — never `background` shorthand as it resets all sub-properties.

---

## 17. Number Display Rule — Mandatory

```tsx
// Correct — always
{value.toLocaleString('en-US')}
{`${value.toFixed(1)}%`}
{value.toLocaleString('en-US', { minimumFractionDigits: 2 })}

// Wrong — converts to Arabic numerals
{formatNumber(value)}
{new Intl.NumberFormat('ar-SA').format(value)}
```

In Tailwind: `className="tabular-nums"`

Applies to: all stat cards, tables, charts, invoices, reports — everywhere a number appears.

---

## 18. Onboarding Wizard

| Decision | Value |
|---|---|
| Steps | 4 |
| Progress | dots + animated fill bar |
| Card max-width | `660px` default, `780px` for activity step |
| Glass card | same glass system |
| Footer | glass, `backdrop-filter: blur(12px)` |

### The 37 Business Activities

| Sector | Activities (count) |
|---|---|
| Restaurants & Food | restaurants, cafes, fast food, bakeries & sweets, juices & ice cream, food carts (6) |
| Retail | grocery, supermarkets, perfumes & oud, stationery, gifts & toys (5) |
| Fashion | men's clothing, women's clothing, shoes & bags, accessories, tailoring (5) |
| Health & Care | pharmacies, medical supplies, clinics, eyewear, supplements (5) |
| Beauty & Salons | men's barbershops, women's salons, spa & massage, cosmetics (4) |
| Services | car wash, laundry, mobile repair, auto workshops, home services (5) |
| Electronics | mobiles & accessories, electronics, gaming (3) |
| Home & Furniture | furniture, home tools, flowers & gifts, pet supplies (4) |

**Stored in:** `tenants.activity` column (migration `015_tenants_activity.sql`).

**POS Rule (absolute):** POS must be in ALL 37 activities without exception. The sidebar business_type filtering does NOT apply to POS. This is a user-explicit rule (STATUS.md §28 override, §45).

---

## 19. Official User Journey

```
Landing Page
↓ "Get Started" button
Registration modal (company name + email + password)
↓ Create account
Onboarding Wizard (4 steps):
  Step 1: Company information (name + owner + phone)
  Step 2: Activity selection (8 sectors accordion → 37 activities)
  Step 3: Settings (branch + city + currency + VAT)
  Step 4: Confirmation + entry
↓
Dashboard
```

---

## 20. Dashboard Data Fetching TTL

| Data | TTL |
|---|---|
| Main stat cards | 30 seconds |
| Open shifts | 15 seconds |
| Pending requests | 10 seconds |
| Reports & charts | 5 minutes |
| Activity log | 60 seconds |
| Weekly data | 5 minutes |
| Monthly data | 15 minutes |
| Yearly data | 1 hour |

---

## 21. Saudi Riyal Symbol

**Symbol:** `﷼` (U+FDFC)

**Files:**
- `C:\Fp\web\public\fonts\saudi_riyal_regular.woff2` — font file
- `C:\Fp\web\public\fonts\SaudiRiyal.css` — `@font-face` definition

**Usage in globals.css:**
```css
@import '/fonts/SaudiRiyal.css';
```

**Usage in Tailwind config:**
```ts
fontFamily: {
  sar: ['SaudiRiyal', 'sans-serif'],
}
```

**Usage in TSX:**
```tsx
<span className="font-sar">﷼</span>
// or inline:
<span style={{ fontFamily: 'SaudiRiyal' }}>﷼</span>
```

---

## 22. Technical Implementation Notes

- Glassmorphism requires `-webkit-backdrop-filter` for Safari support.
- `lucide-react` with `strokeWidth={2}` or `strokeWidth={2.2}`.
- Recharts with same config from prototypes.
- Numbers: always `value.toLocaleString('en-US')`.
- Glass cards in Tailwind: `bg-white/74 backdrop-blur-xl saturate-150`.
- The middleware file is named `proxy.ts` not `middleware.ts`.
- i18n: deep merge in `request.ts` for nested keys.
- Never use `&&` chaining in Windows CMD.
- Responsive tables switch to card view on mobile (some at `sm:`, some at `md:` — standardizing is a tracked item).
