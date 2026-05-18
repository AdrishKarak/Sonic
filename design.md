# VoiceFlow TTS SaaS — Design System & Landing Page Spec

> **Stack:** Next.js · Tailwind CSS
> **Route:** `/landing` — public-facing marketing page
> **Post-CTA route:** `"Start for free"` → `router.push('/')` (home/app)
> **Theme:** Glassmorphic Sky — soft white + sky blue canvas, matte black components
> **Status:** Ready for implementation

---

## 1. Color System

Define colors both as CSS custom properties (for glassmorphism `rgba` values) and in `tailwind.config.ts` (for utility classes).

### tailwind.config.ts

```ts
theme: {
  extend: {
    colors: {
      sky: {
        canvas:  '#EDF6FF',   // page base
        mid:     '#DAEEFF',   // surface variation
        fill:    '#BAE0FF',   // accent fills
        400:     '#38BDF8',   // highlight, progress, underline
        500:     '#0EA5E9',   // waveform bars, hover
      },
      ink: {
        DEFAULT: '#0A0A0A',   // primary text, buttons, icons
        deep:    '#1A1A1A',   // topbar, deep surfaces
        muted:   '#4A6580',   // subtitles, nav links, descriptions
      },
      voice: {
        pill:    '#E0F2FE',   // voice pill bg
        border:  '#7DD3FC',   // voice pill border
        text:    '#0369A1',   // voice pill text
      },
      positive: '#16A34A',    // stats, check icons, online dot
    },
    backdropBlur: {
      nav: '24px',
      card: '12px',
    },
  },
}
```

### CSS Custom Properties (globals.css)

Still needed for glass `rgba` values Tailwind can't express natively:

```css
:root {
  --glass:         rgba(255, 255, 255, 0.70);
  --glass-border:  rgba(180, 220, 255, 0.60);
  --glass-nav:     rgba(255, 255, 255, 0.55);
  --glass-nav-scrolled: rgba(255, 255, 255, 0.78);
}
```

### Color Usage Rules

| Surface | Tailwind bg class | Text |
|---|---|---|
| Page canvas | `bg-sky-canvas` | `text-ink` |
| Glass cards | `bg-[var(--glass)]` + custom border | `text-ink` / `text-ink-muted` |
| Dark cards / featured | `bg-ink` | `text-white` |
| Primary button | `bg-ink` | `text-white` |
| Outline button | `bg-white/70` | `text-ink` |
| Audio player | `bg-ink` | `text-white` ← only safe white-on-dark |
| Voice pills | `bg-voice-pill border-voice-border` | `text-voice-text` |
| Positive stats | — | `text-positive` |

> **Rule:** `text-white` is ONLY permitted on solid `bg-ink` / `bg-ink-deep` surfaces. Never on sky canvas or glass.

---

## 2. Typography

In Next.js, load fonts via `next/font/google` in `app/layout.tsx` — do **not** use `@import` in CSS. Apply font CSS variables to `:root` so Tailwind arbitrary values and plain CSS can both use them.

```ts
// app/layout.tsx
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from 'next/font/google'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
})

// Apply all three variables to <html>:
// className={`${bricolage.variable} ${dmSans.variable} ${jetbrains.variable}`}
```

```js
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      display: ['var(--font-display)', 'sans-serif'],
      body:    ['var(--font-body)',    'sans-serif'],
      mono:    ['var(--font-mono)',    'monospace'],
    },
  },
}
```

| Role | Tailwind class | Size | Weight | Letter-spacing |
|---|---|---|---|---|
| Hero title | `font-display text-[clamp(42px,6vw,72px)]` | clamp(42–72px) | 700 | `-0.05em` |
| Section title | `font-display text-[clamp(28px,4vw,44px)]` | clamp(28–44px) | 700 | `-0.03em` |
| Bento card title | `font-display text-lg` | 18px | 600 | `-0.02em` |
| Stat numbers | `font-display text-2xl` | 22px | 700 | `-0.03em` |
| Pricing amount | `font-display text-5xl` | 40px | 700 | `-0.05em` |
| Body / descriptions | `font-body text-sm` to `text-lg` | 14–18px | 300–400 | 0 |
| Nav links | `font-body text-sm` | 14px | 400 | 0 |
| Labels / badges | `font-body text-xs` | 11–13px | 500 | `0.1em` |
| Code / mono | `font-mono text-xs` | 11–12px | 400–500 | 0 |

---

## 3. Layout Structure

### Page Sections (top → bottom)

```
┌─────────────────────────────────────────┐
│  Floating Glass Pill Nav (not full-width)│
├─────────────────────────────────────────┤
│  Hero (full viewport)                   │
│  · Center-aligned text                  │
│  · Floating orb BG                      │
│  · Animated waveform                    │
│  · Dashboard screenshot (reveals from   │
│    bottom, directly below hero text)    │
├─────────────────────────────────────────┤
│  Marquee Brand Strip                    │
├─────────────────────────────────────────┤
│  TTS Page Screenshot Section            │
│  (replaces coded dashboard mockup)      │
├─────────────────────────────────────────┤
│  Features Bento Grid                    │
│  (includes flip cards)                  │
├─────────────────────────────────────────┤
│  Pricing Cards (3-col)                  │
├─────────────────────────────────────────┤
│  Footer                                 │
└─────────────────────────────────────────┘
```

### Spacing Scale

| Token | Value | Usage |
|---|---|---|
| Section padding | `80–100px` vertical, `48px` horizontal | Between major sections |
| Card padding | `28px` | Bento and price cards |
| Card gap | `16px` | Grid gaps |
| Component internal | `8–16px` | Inside cards |

---

## 4. Navigation

The navbar does **not** span the full page width. It floats as a centered, rounded-pill glass capsule with margins on both sides, sitting above the page content.

### Layout & Positioning

```css
nav {
  position: sticky;
  top: 16px;                        /* floats 16px from top edge */
  z-index: 100;
  width: calc(100% - 80px);         /* 40px breathing room each side */
  max-width: 1000px;
  margin: 0 auto;                   /* centered horizontally */

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;

  /* Pure glass pill */
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.80);
  border-radius: 999px;             /* full pill shape */
  box-shadow: 0 4px 24px rgba(56, 189, 248, 0.10),
              0 1px 4px rgba(10, 10, 10, 0.06);
}
```

> **Visual intent:** The navbar should look like it's floating in mid-air above the sky canvas — nearly transparent, with the page visible behind it. Do NOT add a border-bottom or a flat bottom edge. The pill border wraps all the way around.

### Behaviour on Scroll

On scroll, slightly increase opacity to stay readable:

```js
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 40) {
    nav.style.background = 'rgba(255, 255, 255, 0.78)';
  } else {
    nav.style.background = 'rgba(255, 255, 255, 0.55)';
  }
});
```

### Wrapper Required

Since `sticky` works relative to the nearest scrolling ancestor, wrap the nav in a full-width container:

```html
<div class="nav-wrapper">
  <nav> ... </nav>
</div>

<style>
.nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  padding: 16px 40px 0;
  pointer-events: none;   /* lets clicks pass through the gap areas */
}

nav {
  pointer-events: all;    /* re-enable clicks on the pill itself */
  width: 100%;
  max-width: 1000px;
  /* ...rest of nav styles above */
}
</style>
```

### Contents

**Logo:** `font-display font-bold text-xl text-ink`. Includes a pulsing black dot (`animate-pulse` or custom Tailwind animation).

**Links:** `font-body text-sm text-ink-muted hover:text-ink transition-colors`. Use `<Link href="#features">` etc. — all anchor links within `/landing`.

**CTA Button — "Get started free":**
- Tailwind: `bg-ink text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:-translate-y-px hover:shadow-lg transition-all`
- On click: `router.push('/')` via `useRouter()` from `next/navigation`

```tsx
'use client'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  return (
    <div className="nav-wrapper sticky top-0 z-50 flex justify-center px-10 pt-4 pointer-events-none">
      <nav className="pointer-events-auto w-full max-w-[1000px] flex items-center
                      justify-between px-6 py-3 rounded-full
                      border border-white/80 backdrop-blur-[24px]
                      shadow-[0_4px_24px_rgba(56,189,248,0.10),0_1px_4px_rgba(10,10,10,0.06)]"
           style={{ background: 'var(--glass-nav)' }}>
        {/* Logo, links, CTA */}
        <button onClick={() => router.push('/')}
                className="bg-ink text-white rounded-lg px-5 py-2.5 text-sm font-medium
                           hover:-translate-y-px hover:shadow-lg transition-all">
          Get started free
        </button>
      </nav>
    </div>
  )
}
```

---

## 5. Hero Section

### Layout

```tsx
// Tailwind classes
<section className="relative min-h-[92vh] flex flex-col items-center
                    justify-center text-center px-12 pt-20 pb-16 overflow-hidden">
```

### Background — Illustrated Animated Scene

Inspired by the references you shared (MoodsnMeds monk/Japanese garden hero, Tailkits landscape heroes, and the `@ShruPosts` "Image I generated vs Hero I designed" examples): the hero background is a **living illustrated animated scene** — sky, clouds, meadow, calm water, waves — not a photograph. It looks like a ghibli-style or soft anime painting that breathes, giving the landing page a distinctive personality while staying firmly in the sky-blue theme.

**You will provide the animated background asset.** The implementation handles all formats.

#### Visual Reference — What the BG Should Look Like

From the screenshots you shared, the best-performing illustrated hero backgrounds share these traits:

| Trait | Description | Why it works |
|---|---|---|
| **Low horizon** | Landscape/meadow/water stays in the bottom 35–40% of frame | Leaves clear open sky for headlines — text stays sharp |
| **Sky dominance** | Top 60%+ is open sky — soft blue gradient, gentle clouds | Text sits in this zone — no competing detail |
| **Illustrated / painterly** | Soft brush strokes, anime-style clouds, not photorealistic | Warm, friendly, distinctive — not a stock photo |
| **Subtle motion** | Clouds drift slowly, light shimmer on water, petals float | Life without distraction |
| **Warm palette** | Blues `#BAE0FF→#38BDF8`, soft greens, warm whites, gentle pinks | Matches the sky-blue theme |
| **Low contrast at top** | Sky area is lighter near horizon, fades to soft mid-blue above | Dark `text-ink` reads perfectly without text-shadow |

> **Key principle (from the Tailkits article):** "Nature-inspired hero images with low horizons and generous sky so headlines stay crisp and scannable." Your illustrated bg must follow this — the scene lives at the bottom, the sky owns the top.

#### Mood References (from your images)

- **MoodsnMeds style:** Illustrated monk / Japanese garden — rich illustrated scene, pastel sky, horizon at ~45%
- **Tailkits hike hero:** Open illustrated landscape — sky dominates 65% of frame, low rolling hills
- **@ShruPosts examples:** Sky-heavy illustrated scenes (bench under tree, countryside farmhouse) with text placed in the upper sky zone

Your bg should feel like one of these — soft, illustrated, slightly dreamy — but with a **sky/cloud/wave/meadow** theme that fits TTS / voice / audio.

#### Asset Files

```
public/assets/
├── hero-bg.webm        ← preferred (smallest file, best loop quality)
├── hero-bg.mp4         ← Safari fallback
├── hero-bg-poster.jpg  ← first-frame static image (prevents flash on load)
└── hero-bg.json        ← alternative: Lottie animation file
```

#### Illustrated Scene Elements — TTS / Voice / Audio Theme

The scene should feel like an audio journey — calming, expansive, with subtle sound-related motifs worked naturally into the landscape:

| Element | Description | Placement |
|---|---|---|
| **Sky** | Soft sky-blue gradient — `#EDF6FF` at horizon warming to `#BAE0FF` → `#38BDF8` higher up | Top 60% of frame |
| **Clouds** | Fluffy illustrated clouds in whites and pale blues, drifting gently left→right | Upper third, scattered |
| **Sound waves / ripples** | Subtle concentric ripples on water surface, or soft sound-wave arcs blending into the scene | Near horizon / water |
| **Calm water / lake** | Mirror-still illustrated water reflecting the sky — where "voice" travels | Bottom 25% |
| **Meadow / shore** | Soft illustrated grass, wildflowers (whites, pale pinks), gentle rolling hills | Bottom 30–40% |
| **Floating elements** | Very optional — a few floating musical notes, soft glowing orbs, or sakura petals | Mid-air, subtle |
| **Lighting** | Soft golden hour or midday — warm, dreamy, NOT harsh. Light source from upper-left | Global |
| **Palette** | Sky blues `#BAE0FF→#38BDF8`, soft greens, warm whites, pale pinks, light gold | Throughout |

> **No dark or moody tones.** This is a light, airy, optimistic illustrated world — matches the product's sky-blue canvas theme exactly.

#### Implementation — Looping Video (preferred)

```tsx
// components/landing/HeroBg.tsx
export default function HeroBg() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Illustrated animated scene */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/assets/hero-bg-poster.jpg"
        className="w-full h-full object-cover object-bottom"
        // object-bottom keeps the horizon + meadow anchored at the bottom
        // sky fills the top where headlines sit
      >
        <source src="/assets/hero-bg.webm" type="video/webm" />
        <source src="/assets/hero-bg.mp4"  type="video/mp4" />
      </video>

      {/* Very light white veil — just enough to keep text sharp */}
      {/* Adjust opacity: 0.10–0.30 depending on how bright your illustration is */}
      <div className="absolute inset-0 bg-white/15" />

      {/* Subtle bottom-fade so content sections below blend in */}
      <div className="absolute bottom-0 left-0 right-0 h-48
                      bg-gradient-to-t from-sky-canvas to-transparent" />
    </div>
  )
}
```

#### Implementation — Lottie (if you use a .json animation)

```tsx
// npm install lottie-react
'use client'
import Lottie from 'lottie-react'
import heroBgData from '@/public/assets/hero-bg.json'

export default function HeroBg() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div className="w-full h-full scale-[1.05]"> {/* slight scale avoids edge gaps */}
        <Lottie
          animationData={heroBgData}
          loop
          className="w-full h-full object-cover object-bottom"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="absolute inset-0 bg-white/15" />
      <div className="absolute bottom-0 left-0 right-0 h-48
                      bg-gradient-to-t from-sky-canvas to-transparent" />
    </div>
  )
}
```

#### Z-layer Stack (inside hero `<section>`)

```
z-0  → HeroBg (video / Lottie illustrated scene)
z-1  → floating orbs (optional — can remove if illustration already has depth)
z-2  → all hero text content, badge, CTA, screenshot
```

#### Floating Orbs — Optional with Illustrated BG

Since the illustrated scene already has depth and colour, the orbs are **optional**. If the bg feels flat, add them at very low opacity:

```css
.orb { opacity: 0.15; }   /* subtle layer — illustration does the heavy lifting */
```

If the bg already has rich clouds and sky movement, **remove the orbs entirely** — they'll compete.

#### White Overlay Tuning

| Bg brightness | Recommended overlay |
|---|---|
| Very bright / pastel | `bg-white/10` |
| Medium (like MoodsnMeds monk bg) | `bg-white/20` |
| Darker illustrated sky | `bg-white/35` |

Test at each size — the hero title must always read clearly at `text-ink` (`#0A0A0A`) without any text-shadow.

### Hero Badge

```
Glass pill · inline-flex · border-radius: 999px
background: rgba(255,255,255,0.75)
border: 1px solid --glass-border
padding: 6px 16px · font-size: 12px · color: --text-muted
Contains: green dot + text
animation: fadeSlideDown 0.7s ease both
```

### Hero Title — Blur-to-Clear Reveal Animation

**Effect:** On page load, each word/line starts blurred (`filter: blur(12px)`) and invisible (`opacity: 0`), then one-by-one becomes sharp and visible with a stagger delay. This creates a "materialising from the sky" feel.

```css
/* Split hero title into individual word <span> elements via JS */
.hero-word {
  display: inline-block;
  opacity: 0;
  filter: blur(12px);
  transform: translateY(16px);
  animation: wordReveal 0.75s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes wordReveal {
  to {
    opacity: 1;
    filter: blur(0px);
    transform: translateY(0);
  }
}

/* Stagger each word via JS-assigned animation-delay */
/* word[0] → delay: 0.05s */
/* word[1] → delay: 0.15s */
/* word[2] → delay: 0.25s */
/* ... +0.10s per word */
```

**React/Next.js implementation — `useEffect` in a Client Component:**

```tsx
'use client'
import { useEffect, useRef } from 'react'

export default function HeroTitle() {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    // Walk text nodes only, wrap each word in a span
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent!.split(/(\s+)/)
        const frag = document.createDocumentFragment()
        words.forEach((w, i) => {
          if (/\S/.test(w)) {
            const span = document.createElement('span')
            span.className = 'hero-word inline-block'
            span.style.animationDelay = `${i * 0.08 + 0.05}s`
            span.textContent = w
            frag.appendChild(span)
          } else {
            frag.appendChild(document.createTextNode(w))
          }
        })
        node.parentNode!.replaceChild(frag, node)
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(walk)
      }
    }
    Array.from(el.childNodes).forEach(walk)
  }, [])

  return (
    <h1 ref={titleRef} className="font-display font-bold text-ink text-center
                                  text-[clamp(42px,6vw,72px)] leading-[1.05]
                                  tracking-[-0.05em] max-w-[820px] mb-6">
      Turn any text into{' '}
      <span className="highlight relative inline-block">natural speech</span>
      {' '}in seconds
    </h1>
  )
}
```

### Highlight Underline (inside title)

```css
/* globals.css */
.highlight::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 4px;
  height: 6px;
  background: #38BDF8;           /* sky-400 */
  border-radius: 3px;
  z-index: -1;
  transform: scaleX(0);
  transform-origin: left;
  animation: underlineReveal 0.7s 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes underlineReveal {
  to { transform: scaleX(1); }
}
```

The underline fires after all words have appeared (~1.2s delay).

### Hero Subtitle & CTA

```tsx
'use client'
import { useRouter } from 'next/navigation'

// Subtitle
<p className="font-body font-light text-ink-muted text-lg max-w-[500px]
              leading-relaxed mb-10 animate-[fadeSlideUp_0.8s_0.6s_ease_both]">
  Studio-quality text-to-speech for creators, developers, and teams.
  No audio engineer required.
</p>

// CTA row
<div className="flex gap-3.5 justify-center animate-[fadeSlideUp_0.8s_0.75s_ease_both]">

  {/* Primary — routes to home */}
  <button
    onClick={() => router.push('/')}
    className="bg-ink text-white rounded-xl px-7 py-3.5 text-[15px] font-medium
               hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,10,10,0.25)]
               transition-all">
    Start for free →
  </button>

  {/* Outline — plays demo / scrolls to TTS section */}
  <button
    onClick={() => document.getElementById('tts-section')?.scrollIntoView({ behavior: 'smooth' })}
    className="bg-white/70 text-ink border border-ink/15 rounded-xl px-7 py-3.5
               text-[15px] font-medium backdrop-blur-sm
               hover:bg-white/90 hover:-translate-y-0.5 transition-all">
    ▶ Hear a demo
  </button>

</div>
```

### Hero Dashboard Screenshot Reveal

Immediately below the CTA buttons — still inside the hero section — the **dashboard screenshot** rises up slowly from below. This is the first visual the user sees of the product, before any scroll.

**File:** Place your provided dashboard screenshot at `public/assets/dashboard.png`

#### JSX — Next.js Image

```tsx
import Image from 'next/image'

{/* Inside hero, after CTA row */}
<div className="relative w-full max-w-[960px] mx-auto mt-14">
  {/* Sky glow behind frame */}
  <div className="absolute inset-5 -bottom-5 rounded-2xl pointer-events-none
                  bg-[radial-gradient(ellipse,rgba(56,189,248,0.20)_0%,transparent_70%)]" />

  {/* Screenshot frame */}
  <div className="hero-screenshot-frame relative z-10 rounded-2xl overflow-hidden
                  border border-[rgba(180,220,255,0.60)]
                  shadow-[0_40px_100px_rgba(56,189,248,0.14),0_8px_32px_rgba(10,10,10,0.08)]">
    <Image
      src="/assets/dashboard.png"
      alt="VoiceFlow Dashboard"
      width={960}
      height={600}
      priority
      className="w-full h-auto block"
    />
  </div>
</div>
```

#### CSS — Slow Rise-Up Reveal (globals.css)

```css
.hero-screenshot-frame {
  opacity: 0;
  transform: translateY(60px) scale(0.97);
  filter: blur(4px);
  animation: screenshotReveal 1.2s cubic-bezier(0.4, 0, 0.2, 1) 1.0s forwards;
}

@keyframes screenshotReveal {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0px);
  }
}
```

> **Timing:** Starts at `1.0s` delay — after all hero words and CTA have appeared — so the screenshot feels like a natural "and here's what it looks like" reveal, not competing with the text.

#### Optional Parallax on Scroll

```js
window.addEventListener('scroll', () => {
  const frame = document.querySelector('.hero-screenshot-frame');
  // Gently drift upward as user scrolls (depth illusion)
  frame.style.transform = `translateY(${window.scrollY * 0.12}px)`;
});
```

---

### Hero Waveform

Generated dynamically via JS — 38 bars with randomised heights, delays, and durations:

```css
.bar {
  width: 3px;
  background: var(--black);       /* dark on light canvas */
  border-radius: 2px;
  animation: wave 1.2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: scaleY(0.3); }
  50%       { transform: scaleY(1); }
}
```

```js
for (let i = 0; i < 38; i++) {
  bar.style.height           = (Math.random() * 32 + 8) + 'px';
  bar.style.animationDelay   = (Math.random() * 1.2) + 's';
  bar.style.animationDuration= (0.8 + Math.random() * 0.8) + 's';
  bar.style.opacity          = 0.45 + Math.random() * 0.5;
}
```

---

## 6. Marquee Brand Strip

```
overflow: hidden
border-top + border-bottom: 1px solid --glass-border
background: rgba(255,255,255,0.40)
padding: 16px 0
```

```css
.marquee-track {
  display: flex;
  gap: 48px;
  width: max-content;
  animation: marquee 22s linear infinite;
}

@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

Content: Brand names in Bricolage Grotesque 500, 14px, `--text-muted`, duplicated for seamless loop. Separated by a faint `✦` glyph.

---

## 7. TTS Page Screenshot Section

This section sits after the Marquee strip. It replaces any coded mockup — **a real screenshot of the TTS studio page** is displayed here inside a browser-style frame. The purpose is to show the product's core interface in context.

### Section Header

```
section-label: DM Sans 500, 12px, letter-spacing: 2px, uppercase, --text-muted
               text: "PRODUCT"
section-title: Bricolage Grotesque 700, clamp(28–44px), --text-primary, text-align: center
               text: "Everything you need to go from text to audio"
```

Both animate in via `.reveal` scroll class.

### TTS Screenshot Frame

**File:** Place your provided TTS page screenshot at `public/assets/tts-page.png`

```tsx
import Image from 'next/image'

<section id="tts-section" className="flex flex-col items-center gap-5 py-24 px-12">

  <span className="reveal font-body font-medium text-xs tracking-[0.15em] uppercase text-ink-muted">
    Product
  </span>

  <h2 className="reveal font-display font-bold text-ink text-center
                 text-[clamp(28px,4vw,44px)] tracking-[-0.03em] max-w-[600px]"
      style={{ transitionDelay: '0.1s' }}>
    Everything you need to go from text to audio
  </h2>

  {/* Browser frame */}
  <div className="reveal tts-frame w-full max-w-[900px] rounded-[20px] overflow-hidden
                  border border-[rgba(180,220,255,0.60)] mt-6
                  shadow-[0_32px_80px_rgba(56,189,248,0.12),0_8px_32px_rgba(10,10,10,0.06)]"
       style={{ transitionDelay: '0.2s' }}>

    {/* Browser chrome topbar */}
    <div className="bg-ink-deep px-5 py-3 flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
      <div className="flex-1 mx-4 bg-white/10 rounded-md px-3 py-1
                      font-mono text-[11px] text-white/45">
        app.voiceflow.ai/studio
      </div>
    </div>

    {/* TTS page screenshot */}
    <Image
      src="/assets/tts-page.png"
      alt="VoiceFlow TTS Studio"
      width={900}
      height={560}
      className="w-full h-auto block"
    />
  </div>

</section>
```

```css
/* globals.css — 3D tilt on TTS frame */
.tts-frame {
  transform: perspective(1200px) rotateX(4deg) scale(0.97);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.tts-frame:hover {
  transform: perspective(1200px) rotateX(0deg) scale(1);
}
```

> **Note:** Screenshot dimensions (`width`/`height` on `<Image>`) are used for aspect ratio only — the image fills its container at `w-full`. Set them to match your actual screenshot dimensions.

---

## 8. Features — Bento Grid

### Grid Layout

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
```

**Card sizes:**
- `.bento-card` → 1 column
- `.bento-card.wide` → `grid-column: span 2`

### Arrangement

```
Row 1: [ Wide card (2-col) ] [ Dark card (1-col) ]
Row 2: [ Card ]  [ Card ]  [ Wide dark card (2-col) ]
```

### Standard Card Styles

```css
.bento-card {
  background: rgba(255, 255, 255, 0.70);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 28px;
  backdrop-filter: blur(12px);
}
```

**Dark variant:**

```css
.bento-card.dark {
  background: var(--black);
  border-color: rgba(255, 255, 255, 0.08);
  /* Title → #ffffff, Desc → rgba(255,255,255,0.55) */
}
```

**Icon block:** 40×40px, `--black` bg, `border-radius: 10px`, white icon inside.

---

## 9. Flip Cards (3D Animation)

**Which cards flip:** Apply `.flip-card` class to any bento card to enable this. Recommended on the "Developer API" and "Real-time Streaming" cards.

### HTML Structure

```html
<div class="flip-card">
  <div class="flip-inner">

    <!-- FRONT -->
    <div class="flip-front bento-card">
      <div class="bento-icon"><i class="ti ti-api"></i></div>
      <div class="bento-title">Developer API</div>
      <div class="bento-desc">RESTful API with SDKs for Node, Python, and more.</div>
    </div>

    <!-- BACK -->
    <div class="flip-back bento-card dark">
      <div class="bento-title">Quick Start</div>
      <pre class="code-snippet">
POST /v1/synthesize
{
  "text": "Hello world",
  "voice": "nova-en-us",
  "speed": 1.0
}
      </pre>
      <div class="back-badge">← Try it free</div>
    </div>

  </div>
</div>
```

### CSS

```css
.flip-card {
  perspective: 1000px;
  cursor: pointer;
}

.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 220px;
  transform-style: preserve-3d;
  transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
}

.flip-card:hover .flip-inner {
  transform: rotateY(180deg);
}

.flip-front,
.flip-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 16px;
}

.flip-back {
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  padding: 28px;
}

/* Code snippet on back face */
.code-snippet {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 12px 14px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.80);
  line-height: 1.7;
  white-space: pre;
  overflow: hidden;
}

.back-badge {
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
  letter-spacing: 0.5px;
}
```

### What to Show on Back Faces

| Card (front) | Card (back) |
|---|---|
| Developer API | Code snippet — curl / JSON example |
| Real-time Streaming | Live latency counter animation + "< 200ms" stat |
| Ultra-realistic voices | Voice selector UI with 3 sample voice names |

---

## 10. Mouse-Tracking 3D Tilt (Non-flip cards)

All non-flip bento cards get a live 3D tilt that follows the mouse:

```js
document.querySelectorAll('.bento-card:not(.flip-card)').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform =
      `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px) scale(1.012)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});
```

---

## 11. Scroll-Driven Reveal Animations

### CSS

```css
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition:
    opacity   0.7s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger helpers */
.reveal-delay-1 { transition-delay: 0.10s; }
.reveal-delay-2 { transition-delay: 0.20s; }
.reveal-delay-3 { transition-delay: 0.30s; }
.reveal-delay-4 { transition-delay: 0.40s; }
```

### JS (IntersectionObserver)

```js
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

### What Gets `.reveal`

- Section labels
- Section titles (+ `.reveal-delay-1`)
- Dashboard frame (+ `.reveal-delay-2`)
- Each bento card (staggered delays)
- Each pricing card (staggered delays)

---

## 12. Billing / Pricing Section — Powered by Polar

Billing is handled by **Polar** ([polar.sh](https://polar.sh)) on a **usage-based model** — users pay for what they consume (characters converted, audio minutes generated, API calls). The pricing section on the landing page reflects this: no rigid plan tiers, just transparent usage pricing with a free starting allowance.

### Visual Design Philosophy

| ❌ Avoid (typical SaaS pricing) | ✅ Use (usage-based Polar model) |
|---|---|
| 3 plan cards (Starter / Pro / Team) | 1 usage meter card + 3 per-unit rate tiles |
| Feature comparison checkmarks | Transparent $ per unit with clear descriptions |
| "Most popular" badges | Animated bar showing free tier remaining |
| Fixed monthly prices | "Pay only what you use — billed by Polar" |
| "Cancel anytime" fine print | Polar logo badge as trust signal |

- Section feels like a **utility dashboard** — honest, transparent, frictionless
- The **animated usage bar** is the hero element: visually shows free tier + overage boundary
- **Polar** is named explicitly as the billing engine — adds trust for developers
- No plan confusion — one model, clear rates, start free

### Polar Trust Badge

Display the Polar logo/link prominently in the section footer:

```tsx
{/* Polar trust line — bottom of billing section */}
<div className="flex items-center gap-2 text-xs text-ink-muted mt-2">
  <span>Billing & metering powered by</span>
  <a href="https://polar.sh"
     target="_blank"
     rel="noopener noreferrer"
     className="flex items-center gap-1 font-semibold text-ink
                hover:text-sky-500 transition-colors">
    <img src="/assets/polar-logo.svg" alt="Polar" className="h-4 w-auto" />
    Polar ↗
  </a>
</div>
```

> Download the Polar logo SVG from [polar.sh/brand](https://polar.sh) and place at `public/assets/polar-logo.svg`

### Section Layout

```
Background: linear-gradient(180deg, transparent, rgba(186,224,255,0.25))
padding: 80px 48px
text-align: center
```

```
┌──────────────────────────────────────────────┐
│  Section label: "PRICING"                    │
│  Title: "Pay only for what you use"          │
│  Subtitle: "Start free. Scale as you grow."  │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │  Usage Meter Card (glass, wide)      │    │
│  │  · Free tier bar: 10,000 chars/mo   │    │
│  │  · Animated fill bar                │    │
│  │  · "Then $X per 1M characters"      │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐          │
│  │ Chars  │  │ Voices │  │  API   │          │
│  │ rate   │  │ rate   │  │ calls  │          │
│  └────────┘  └────────┘  └────────┘          │
│                                              │
│  [  Start for free — no card required  ]     │
│  "Billing powered by Polar ↗"               │
└──────────────────────────────────────────────┘
```

### JSX

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

const usageRates = [
  {
    icon: '✦',
    label: 'Characters',
    rate: '$4',
    per: 'per 1M characters',
    desc: 'After your free 50K / month',
  },
  {
    icon: '🎙',
    label: 'Premium Voices',
    rate: '$6',
    per: 'per 1M characters',
    desc: 'Neural ultra-realistic voices',
  },
  {
    icon: '⚡',
    label: 'API Calls',
    rate: 'Free',
    per: 'always',
    desc: 'No per-call charges, ever',
  },
]

export default function Pricing() {
  const router = useRouter()

  return (
    <section className="flex flex-col items-center gap-5 py-20 px-12
                        bg-gradient-to-b from-transparent to-[rgba(186,224,255,0.25)]">

      {/* Header */}
      <span className="reveal font-body font-medium text-xs tracking-[0.15em]
                       uppercase text-ink-muted">
        Pricing
      </span>
      <h2 className="reveal font-display font-bold text-ink text-center
                     text-[clamp(28px,4vw,44px)] tracking-[-0.03em] max-w-[560px]"
          style={{ transitionDelay: '0.1s' }}>
        Pay only for what you use
      </h2>
      <p className="reveal font-body font-light text-ink-muted text-lg max-w-[440px] text-center"
         style={{ transitionDelay: '0.15s' }}>
        Start free. No credit card needed. Scale as your usage grows — billed monthly through Polar.
      </p>

      {/* Free tier meter card */}
      <div className="reveal w-full max-w-[680px] rounded-2xl p-8 mt-4
                      bg-[var(--glass)] border border-[var(--glass-border)]
                      backdrop-blur-[12px]"
           style={{ transitionDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-semibold text-ink text-lg">
            Free tier — every month
          </span>
          <span className="font-mono text-xs text-ink-muted bg-white/60
                           border border-[var(--glass-border)] rounded-full px-3 py-1">
            resets monthly
          </span>
        </div>

        {/* Animated usage bar */}
        <div className="w-full h-3 rounded-full bg-sky-fill/30 overflow-hidden mb-2">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500
                          usage-bar-fill" />
          {/* CSS animates this from 0% → 38% to show "partial usage" demo */}
        </div>
        <div className="flex justify-between text-xs text-ink-muted font-body">
          <span>0 characters used</span>
          <span className="font-medium text-ink">50,000 free / month</span>
        </div>

        <div className="mt-5 pt-5 border-t border-[var(--glass-border)]
                        flex flex-wrap gap-4 items-center justify-between">
          <div>
            <div className="font-display font-bold text-ink text-3xl tracking-[-0.05em]">
              $0
            </div>
            <div className="text-xs text-ink-muted mt-0.5">
              to start — pay as you go after
            </div>
          </div>
          <div className="text-sm text-ink-muted font-body max-w-[280px] text-right">
            Overage billed at standard rates below.
            Invoiced automatically via Polar.
          </div>
        </div>
      </div>

      {/* Per-unit rate cards */}
      <div className="reveal flex flex-wrap gap-4 justify-center w-full max-w-[680px]"
           style={{ transitionDelay: '0.3s' }}>
        {usageRates.map((item) => (
          <div key={item.label}
               className="flex-1 min-w-[180px] rounded-xl p-6
                          bg-[var(--glass)] border border-[var(--glass-border)]
                          backdrop-blur-[12px] hover:-translate-y-1 transition-transform">
            <div className="text-xl mb-3">{item.icon}</div>
            <div className="font-body text-xs text-ink-muted uppercase tracking-widest mb-1">
              {item.label}
            </div>
            <div className="font-display font-bold text-ink text-3xl tracking-[-0.05em]">
              {item.rate}
            </div>
            <div className="font-body text-xs text-ink-muted mt-0.5">{item.per}</div>
            <div className="mt-3 pt-3 border-t border-[var(--glass-border)]
                            text-xs text-ink-muted font-body">
              {item.desc}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="reveal flex flex-col items-center gap-3 mt-4"
           style={{ transitionDelay: '0.4s' }}>
        <button
          onClick={() => router.push('/')}
          className="bg-ink text-white rounded-xl px-8 py-3.5 text-[15px] font-medium
                     hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,10,10,0.25)]
                     transition-all">
          Start for free — no card required
        </button>
        <a href="https://polar.sh" target="_blank" rel="noopener noreferrer"
           className="text-xs text-ink-muted hover:text-ink transition-colors
                      flex items-center gap-1.5">
          <span>Billing powered by</span>
          <span className="font-semibold text-ink">Polar ↗</span>
        </a>
      </div>

    </section>
  )
}
```

### Usage Bar Animation (globals.css)

```css
.usage-bar-fill {
  width: 0%;
  animation: usageFill 1.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
}

@keyframes usageFill {
  to { width: 38%; }   /* demo fill — shows "you've used some, you have plenty left" */
}
```

### Polar Integration Notes

| Concern | How handled |
|---|---|
| Checkout | Polar checkout link / embedded widget on the `/` app route |
| Usage metering | Report usage events to Polar API from your backend after each TTS generation |
| Invoicing | Polar bills users automatically at end of month |
| Free tier | Configure in Polar dashboard as a usage credit / included units |
| Webhooks | Polar → your backend: `subscription.active`, `invoice.paid` |
| Landing page role | Marketing only — no actual Polar SDK needed here. All billing logic lives in `/` app |

> **Do NOT embed Polar's checkout widget on `/landing`** — the landing page is purely informational. The "Start for free" button routes to `/` where the user creates an account and Polar takes over.

---

## 13. Footer

```
padding: 32px 48px
border-top: 1px solid --glass-border
background: rgba(255,255,255,0.35)
display: flex, space-between
font-size: 13px, color: --text-muted
```

Contains: logo (left), copyright (center), links — Privacy / Terms / Docs (right).

---

## 14. Animation Master Reference

| Animation | Element | Keyframe | Duration | Delay | Trigger |
|---|---|---|---|---|---|
| `fadeSlideDown` | Hero badge | opacity 0→1, translateY -12→0 | 0.7s | 0s | Page load |
| `wordReveal` | Hero title words | opacity 0→1, blur 12→0, translateY 16→0 | 0.75s | +0.08s per word | Page load |
| `underlineReveal` | Highlight underline | scaleX 0→1 | 0.7s | 1.2s | Page load |
| `fadeSlideUp` | Subtitle, CTA | opacity 0→1, translateY 20→0 | 0.8s | 0.6s / 0.75s | Page load |
| `screenshotReveal` | Hero dashboard screenshot | opacity 0→1, translateY 60→0, blur 4→0, scale 0.97→1 | 1.2s | 1.0s | Page load |
| `wave` | Waveform bars | scaleY 0.3↔1 | 0.8–1.6s random | random | Infinite loop |
| `pulse` | Logo dot | scale 1↔1.4 | 2s | — | Infinite loop |
| `float-orb` | BG orbs (optional) | translateY 0↔-30px, scale 1↔1.06 | 10–16s | random | Infinite loop |
| `marquee` | Brand strip | translateX 0→-50% | 22s | — | Infinite loop |
| `nav opacity` | Glass pill nav | rgba opacity 0.55→0.78 | instant | — | Scroll > 40px |
| `parallax drift` | Hero screenshot | translateY += scrollY × 0.12 | — | — | Scroll (rAF) |
| `reveal` | All sections | opacity 0→1, translateY 32→0 | 0.7s | 0–0.4s stagger | Scroll (IO) |
| `usageFill` | Polar billing meter bar | width 0%→38% | 1.8s | 0.5s | Scroll (IO) |
| `rotateY(180deg)` | Flip cards | full Y-axis flip | 0.65s | — | Hover |
| `3D tilt` | Bento cards | perspective rotateX/Y | — | — | Mousemove |
| `rotateX(0deg)` | TTS frame | tilt to flat | 0.6s | — | Hover |

---

## 15. Glassmorphism Utility Classes

```css
/* Reusable glass surface */
.glass {
  background: rgba(255, 255, 255, 0.70);
  border: 1px solid rgba(180, 220, 255, 0.60);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Nav pill — purest glass, nearly transparent */
.glass-nav-pill {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.80);
  border-radius: 999px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 4px 24px rgba(56, 189, 248, 0.10),
              0 1px 4px rgba(10, 10, 10, 0.06);
}

/* Pill / badge */
.glass-pill {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(180, 220, 255, 0.60);
  border-radius: 999px;
  backdrop-filter: blur(10px);
}
```

---

## 16. Screenshot Placement Guide

All screenshots use `next/image` `<Image>`. Place files in `public/assets/` — Next.js serves this directory at the root path automatically.

### Screenshot 1 — Dashboard (inside Hero section)

| Property | Value |
|---|---|
| File path | `public/assets/dashboard.png` |
| `src` in JSX | `"/assets/dashboard.png"` |
| Wrapping element | `.hero-screenshot-frame` div |
| Animation | `screenshotReveal` CSS — fires at `1.0s` delay |
| `priority` prop | ✅ Yes — above the fold |
| Frame style | Rounded corners, sky glow shadow, no browser chrome |

### Screenshot 2 — TTS Studio Page (§7 section)

| Property | Value |
|---|---|
| File path | `public/assets/tts-page.png` |
| `src` in JSX | `"/assets/tts-page.png"` |
| Wrapping element | `.tts-frame` div inside browser chrome topbar |
| Animation | `.reveal` scroll class (IntersectionObserver) |
| `priority` prop | ❌ No — below the fold |
| Frame style | Browser chrome topbar + `rotateX(4deg)` 3D tilt |

### Hero Illustrated Animated Background

| Property | Value |
|---|---|
| Preferred file | `public/assets/hero-bg.webm` |
| Fallback file | `public/assets/hero-bg.mp4` |
| Lottie alt | `public/assets/hero-bg.json` |
| Static fallback frame | `public/assets/hero-bg-fallback.jpg` |
| Usage | `<video autoPlay loop muted playsInline>` inside `absolute inset-0` container |
| `object-position` | `object-bottom` — anchors horizon at bottom, sky fills top for headlines |
| Overlay | `bg-white/15` — tune 10–35% based on illustration brightness |
| Bottom fade | `bg-gradient-to-t from-sky-canvas` — blends into page sections below |
| Orbs | Optional — reduce to `opacity: 0.15` or remove if illustration is rich enough |

---

## 17. Project File & Folder Structure

```
/
├── app/
│   ├── layout.tsx              ← Root layout — font variables on <html>
│   ├── page.tsx                ← Home route "/" (post-login app)
│   └── landing/
│       └── page.tsx            ← Landing page route "/landing"
│
├── components/
│   └── landing/
│       ├── Navbar.tsx          ← Floating glass pill nav ('use client' for router)
│       ├── Hero.tsx            ← Hero section ('use client')
│       ├── HeroBg.tsx          ← Illustrated animated bg — video or Lottie ('use client')
│       ├── HeroTitle.tsx       ← Word-by-word blur reveal title ('use client')
│       ├── Waveform.tsx        ← Animated waveform bars ('use client')
│       ├── Marquee.tsx         ← Infinite scroll brand strip
│       ├── TtsSection.tsx      ← TTS screenshot section (IntersectionObserver)
│       ├── BentoGrid.tsx       ← Features grid
│       ├── FlipCard.tsx        ← 3D flip card component
│       ├── BentoCard.tsx       ← Standard tilt card ('use client' for mousemove)
│       ├── Pricing.tsx         ← Polar usage-based billing section ('use client')
│       └── Footer.tsx          ← Footer
│
├── public/
│   └── assets/
│       ├── hero-bg.webm        ← ✅ You will provide — illustrated animated scene
│       ├── hero-bg.mp4         ← ✅ You will provide — Safari fallback
│       ├── hero-bg-poster.jpg  ← Export first frame from video (prevents flash)
│       ├── dashboard.png       ← ✅ You will provide — dashboard screenshot (hero)
│       ├── tts-page.png        ← ✅ You will provide — TTS studio screenshot (§7)
│       └── polar-logo.svg      ← Download from polar.sh/brand (billing trust badge)
│
├── styles/
│   └── globals.css             ← CSS variables, keyframe animations, .reveal, .orb,
│                                  .hero-word, .hero-screenshot-frame, .tts-frame,
│                                  .flip-card, glass utilities
│
└── tailwind.config.ts          ← Custom colors, font families, animation extensions
```

### Key Next.js Notes

- All interactive components (`useEffect`, `useRouter`, event handlers) need `'use client'` at the top
- Static sections (Marquee text, Pricing card content, Footer) can stay as Server Components
- `<Image>` from `next/image` for all screenshots and the sky background — never raw `<img>` for above-fold images
- Scroll reveal uses `IntersectionObserver` inside a `useEffect` in a shared `useReveal` hook
- Font variables set on `<html>` in root `layout.tsx` — available everywhere via `var(--font-display)` and `font-display` Tailwind class

### Routing

| Route | File | Purpose |
|---|---|---|
| `/landing` | `app/landing/page.tsx` | Public marketing page |
| `/` | `app/page.tsx` | Home — app dashboard after sign-in |

**All CTA buttons** (`"Start for free"`, `"Get started free"`) call `router.push('/')` from `useRouter()` in `next/navigation`.

---

## 18. Implementation Checklist

**Project Setup**
- [ ] `npx create-next-app@latest` with App Router + Tailwind
- [ ] Configure `tailwind.config.ts` — custom colors (`sky`, `ink`, `voice`, `positive`), font families, animation keyframes
- [ ] Set up `app/layout.tsx` with `next/font/google` — Bricolage Grotesque, DM Sans, JetBrains Mono; apply all three `variable` classes to `<html>`
- [ ] Add `globals.css` — CSS vars for glass rgba values, `@keyframes` for all animations, `.reveal`, `.orb`, `.hero-word`, `.hero-screenshot-frame`, `.tts-frame`, `.flip-card`
- [ ] Create `app/landing/page.tsx` as the landing route
- [ ] Create `app/page.tsx` as the home/app route (`/`)
- [ ] Add Tabler Icons: `npm install @tabler/icons-react`

**Assets — place in `public/assets/`**
- [ ] `hero-bg.webm` — your illustrated animated scene (sky/clouds/meadow/waves) ← you will provide
- [ ] `hero-bg.mp4` — Safari fallback version ← you will provide
- [ ] `hero-bg-poster.jpg` — static first frame (prevents flash on load) ← export from video
- [ ] `dashboard.png` — your dashboard screenshot (hero section) ← you will provide
- [ ] `tts-page.png` — your TTS studio screenshot (§7 section) ← you will provide
- [ ] `polar-logo.svg` — download from polar.sh/brand ← billing trust badge

**Navigation (`components/landing/Navbar.tsx`)**
- [ ] `'use client'` — needs `useRouter` and scroll listener
- [ ] Wrapper div: `sticky top-0 z-50 flex justify-center px-10 pt-4 pointer-events-none`
- [ ] Nav pill: `pointer-events-auto rounded-full border border-white/80 backdrop-blur-[24px]`
- [ ] Scroll listener → increase `background` opacity past 40px
- [ ] All CTA buttons → `router.push('/')`

**Hero (`components/landing/Hero.tsx` + `HeroTitle.tsx`)**
- [ ] `'use client'` on both
- [ ] `HeroBg.tsx` — illustrated animated bg via `<video autoPlay loop muted playsInline>` with webm + mp4 sources
- [ ] `object-bottom` on video — keeps horizon anchored low, sky fills top for headlines
- [ ] `bg-white/15` overlay — tune opacity to match illustration brightness
- [ ] `bg-gradient-to-t from-sky-canvas` bottom fade — blends into rest of page
- [ ] Optional: floating orbs at `opacity: 0.15` if illustration needs extra depth
- [ ] If using Lottie: `npm install lottie-react`, wrap in `HeroBg.tsx`
- [ ] Hero badge — glass pill with green dot
- [ ] `HeroTitle.tsx` — `useEffect` word-by-word `.hero-word` span injection + stagger delays
- [ ] Highlight span with `::after` underline `scaleX` reveal at 1.2s
- [ ] Subtitle `fadeSlideUp` at 0.6s delay
- [ ] CTA row `fadeSlideUp` at 0.75s — primary button `router.push('/')`
- [ ] `<Waveform />` component — 38 bars, randomised heights/delays via `useEffect`
- [ ] Dashboard screenshot: `<Image>` wrapped in `.hero-screenshot-frame` with `screenshotReveal` CSS animation at 1.0s delay
- [ ] Optional parallax: `useEffect` scroll listener on screenshot frame

**Marquee (`components/landing/Marquee.tsx`)**
- [ ] Duplicate brand list, infinite CSS `marquee` animation

**TTS Section (`components/landing/TtsSection.tsx`)**
- [ ] `id="tts-section"` for outline CTA scroll target
- [ ] `.reveal` class — `useReveal` hook with `IntersectionObserver`
- [ ] Browser chrome topbar (dark bar, traffic light dots, monospace URL)
- [ ] `<Image>` for TTS screenshot, `width/height` matching actual screenshot dimensions
- [ ] `.tts-frame` CSS — `rotateX(4deg)` → `rotateX(0deg)` on hover

**Bento Grid (`components/landing/BentoGrid.tsx` + `BentoCard.tsx` + `FlipCard.tsx`)**
- [ ] `'use client'` on `BentoCard.tsx` (mousemove tilt)
- [ ] `grid-cols-3` layout, `.col-span-2` for wide cards
- [ ] Standard cards with mouse-tracking 3D tilt (`onMouseMove`, `onMouseLeave`)
- [ ] `FlipCard.tsx` — `perspective-[1000px]` wrapper, `[transform-style:preserve-3d]` inner, `hover:[transform:rotateY(180deg)]`
- [ ] Flip back faces: code snippet (API card), latency counter (Streaming card)
- [ ] `.reveal` with staggered `transitionDelay` on each card

**Billing Section — Polar (`components/landing/Pricing.tsx`)**
- [ ] `'use client'` — needs `useRouter`
- [ ] Section label + title + subtitle with `.reveal`
- [ ] Free tier meter card — glass surface, usage bar with `usageFill` CSS animation
- [ ] Usage bar fires `usageFill` when card scrolls into view (IntersectionObserver trigger)
- [ ] 3 per-unit rate cards (Characters, Premium Voices, API Calls) — hover lift
- [ ] "Start for free" CTA → `router.push('/')`
- [ ] "Billing powered by Polar ↗" link → `https://polar.sh` (opens new tab)
- [ ] Add `usageFill` keyframe to `globals.css`
- [ ] **No Polar SDK on `/landing`** — all Polar integration lives in the `/` app route

**Footer (`components/landing/Footer.tsx`)**
- [ ] Logo + copyright + Privacy / Terms / Docs links

**Scroll Reveal (shared hook)**
- [ ] `hooks/useReveal.ts` — `useEffect` + `IntersectionObserver`, adds `visible` class, `threshold: 0.12`
- [ ] Add to `globals.css`: `.reveal { opacity:0; transform:translateY(32px); transition:... } .reveal.visible { opacity:1; transform:none }`

**QA**
- [ ] No `text-white` on sky/glass surfaces — only on `bg-ink` elements
- [ ] Add `prefers-reduced-motion` media query to disable/simplify animations
- [ ] `next/image` warning-free: all `<Image>` have `width` + `height` or `fill`
- [ ] `backdrop-filter` fallback: add `@supports not (backdrop-filter: blur(1px))` fallback bg for nav + cards
- [ ] Mobile responsive: bento grid → `grid-cols-1` on small, `grid-cols-2` on md
- [ ] Lighthouse: `priority` on hero `<Image>` tags (sky bg + dashboard screenshot)

---

*Last updated: Next.js + Tailwind CSS spec — VoiceFlow TTS SaaS, route `/landing` → `/` — Glassmorphic Sky theme, illustrated animated hero bg, Polar usage-based billing*