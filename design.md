VoiceFlow TTS SaaS — Design System & Landing Page Spec
Stack: Next.js · Tailwind CSS Route: /landing — public-facing marketing page Post-CTA route: "Start for free" → router.push('/') (home/app) Theme: Glassmorphic Sky — soft white + sky blue canvas, matte black components Status: Ready for implementation


________________


1. Color System
Define colors both as CSS custom properties (for glassmorphism rgba values) and in tailwind.config.ts (for utility classes).
tailwind.config.ts
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
CSS Custom Properties (globals.css)
Still needed for glass rgba values Tailwind can't express natively:


:root {


  --glass:         rgba(255, 255, 255, 0.70);


  --glass-border:  rgba(180, 220, 255, 0.60);


  --glass-nav:     rgba(255, 255, 255, 0.55);


  --glass-nav-scrolled: rgba(255, 255, 255, 0.78);


}
Color Usage Rules
Surface
	Tailwind bg class
	Text
	Page canvas
	bg-sky-canvas
	text-ink
	Glass cards
	bg-[var(--glass)] + custom border
	text-ink / text-ink-muted
	Dark cards / featured
	bg-ink
	text-white
	Primary button
	bg-ink
	text-white
	Outline button
	bg-white/70
	text-ink
	Audio player
	bg-ink
	text-white ← only safe white-on-dark
	Voice pills
	bg-voice-pill border-voice-border
	text-voice-text
	Positive stats
	—
	text-positive
	

Rule: text-white is ONLY permitted on solid bg-ink / bg-ink-deep surfaces. Never on sky canvas or glass.


________________


2. Typography
In Next.js, load fonts via next/font/google in app/layout.tsx — do not use @import in CSS. Apply font CSS variables to :root so Tailwind arbitrary values and plain CSS can both use them.


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


Role
	Tailwind class
	Size
	Weight
	Letter-spacing
	Hero title
	font-display text-[clamp(42px,6vw,72px)]
	clamp(42–72px)
	700
	-0.05em
	Section title
	font-display text-[clamp(28px,4vw,44px)]
	clamp(28–44px)
	700
	-0.03em
	Bento card title
	font-display text-lg
	18px
	600
	-0.02em
	Stat numbers
	font-display text-2xl
	22px
	700
	-0.03em
	Pricing amount
	font-display text-5xl
	40px
	700
	-0.05em
	Body / descriptions
	font-body text-sm to text-lg
	14–18px
	300–400
	0
	Nav links
	font-body text-sm
	14px
	400
	0
	Labels / badges
	font-body text-xs
	11–13px
	500
	0.1em
	Code / mono
	font-mono text-xs
	11–12px
	400–500
	0
	

________________


3. Layout Structure
Page Sections (top → bottom)
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
Spacing Scale
Token
	Value
	Usage
	Section padding
	80–100px vertical, 48px horizontal
	Between major sections
	Card padding
	28px
	Bento and price cards
	Card gap
	16px
	Grid gaps
	Component internal
	8–16px
	Inside cards
	

________________


4. Navigation
The navbar does not span the full page width. It floats as a centered, rounded-pill glass capsule with margins on both sides, sitting above the page content.
Layout & Positioning
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


Visual intent: The navbar should look like it's floating in mid-air above the sky canvas — nearly transparent, with the page visible behind it. Do NOT add a border-bottom or a flat bottom edge. The pill border wraps all the way around.
Behaviour on Scroll
On scroll, slightly increase opacity to stay readable:


window.addEventListener('scroll', () => {


  const nav = document.querySelector('nav');


  if (window.scrollY > 40) {


    nav.style.background = 'rgba(255, 255, 255, 0.78)';


  } else {


    nav.style.background = 'rgba(255, 255, 255, 0.55)';


  }


});
Wrapper Required
Since sticky works relative to the nearest scrolling ancestor, wrap the nav in a full-width container:


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
Contents
Logo: font-display font-bold text-xl text-ink. Includes a pulsing black dot (animate-pulse or custom Tailwind animation).


Links: font-body text-sm text-ink-muted hover:text-ink transition-colors. Use <Link href="#features"> etc. — all anchor links within /landing.


CTA Button — "Get started free":


* Tailwind: bg-ink text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:-translate-y-px hover:shadow-lg transition-all
* On click: router.push('/') via useRouter() from next/navigation


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


________________


5. Hero Section
Layout
// Tailwind classes


<section className="relative min-h-[92vh] flex flex-col items-center


                    justify-center text-center px-12 pt-20 pb-16 overflow-hidden">
Background — Sky Photo + Floating Orbs
The hero uses a real sky photo as its base background, provided as a project asset. Layer it under the glass content with a subtle light overlay to keep text readable.


import Image from 'next/image'


// Inside <section> — behind everything else


<div className="absolute inset-0 z-0">


  {/* Sky photo background */}


  <Image


    src="/assets/hero-sky.jpg"       // ← your provided sky photo


    alt=""


    fill


    priority


    className="object-cover object-center"


    quality={90}


  />


  {/* Soft white wash over photo to preserve readability */}


  <div className="absolute inset-0 bg-white/40" />


</div>


{/* Floating orbs sit on top of photo, behind text */}


<div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">


  <div className="orb orb1" />


  <div className="orb orb2" />


  <div className="orb orb3" />


</div>


{/* All hero text content at z-[2] */}


<div className="relative z-2 flex flex-col items-center">


  {/* badge, title, subtitle, CTA, waveform, screenshot */}


</div>


Sky photo placement:


* File: public/assets/hero-sky.jpg (place your provided sky image here)
* Next.js <Image fill> fills the entire section
* object-cover object-center crops it correctly at all viewports
* bg-white/40 overlay keeps text contrast safe — adjust opacity (30–55%) depending on how light/dark your sky photo is
Floating Orbs (layer on top of sky photo)
The orbs add motion depth on top of the photo. Reduce opacity slightly since the photo already provides the sky texture:


/* globals.css — orb animations */


.orb {


  position: absolute;


  border-radius: 50%;


  filter: blur(60px);


  opacity: 0.30;        /* reduced from 0.40 — photo provides sky base */


  animation: float-orb linear infinite;


}


.orb1 { width: 320px; height: 320px; background: #BAE0FF; top: -60px; left: -80px; animation-duration: 12s; }


.orb2 { width: 260px; height: 260px; background: #7DD3FC; bottom: -40px; right: -60px; animation-duration: 16s; animation-delay: -4s; }


.orb3 { width: 180px; height: 180px; background: #E0F2FE; top: 40%; left: 60%; animation-duration: 10s; animation-delay: -7s; }


@keyframes float-orb {


  0%, 100% { transform: translateY(0) scale(1); }


  50%       { transform: translateY(-30px) scale(1.06); }


}
Hero Badge
Glass pill · inline-flex · border-radius: 999px


background: rgba(255,255,255,0.75)


border: 1px solid --glass-border


padding: 6px 16px · font-size: 12px · color: --text-muted


Contains: green dot + text


animation: fadeSlideDown 0.7s ease both
Hero Title — Blur-to-Clear Reveal Animation
Effect: On page load, each word/line starts blurred (filter: blur(12px)) and invisible (opacity: 0), then one-by-one becomes sharp and visible with a stagger delay. This creates a "materialising from the sky" feel.


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


React/Next.js implementation — useEffect in a Client Component:


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
Highlight Underline (inside title)
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


The underline fires after all words have appeared (~1.2s delay).
Hero Subtitle & CTA
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
Hero Dashboard Screenshot Reveal
Immediately below the CTA buttons — still inside the hero section — the dashboard screenshot rises up slowly from below. This is the first visual the user sees of the product, before any scroll.


File: Place your provided dashboard screenshot at public/assets/dashboard.png
JSX — Next.js Image
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
CSS — Slow Rise-Up Reveal (globals.css)
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


Timing: Starts at 1.0s delay — after all hero words and CTA have appeared — so the screenshot feels like a natural "and here's what it looks like" reveal, not competing with the text.
Optional Parallax on Scroll
window.addEventListener('scroll', () => {


  const frame = document.querySelector('.hero-screenshot-frame');


  // Gently drift upward as user scrolls (depth illusion)


  frame.style.transform = `translateY(${window.scrollY * 0.12}px)`;


});


________________


Hero Waveform
Generated dynamically via JS — 38 bars with randomised heights, delays, and durations:


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


for (let i = 0; i < 38; i++) {


  bar.style.height           = (Math.random() * 32 + 8) + 'px';


  bar.style.animationDelay   = (Math.random() * 1.2) + 's';


  bar.style.animationDuration= (0.8 + Math.random() * 0.8) + 's';


  bar.style.opacity          = 0.45 + Math.random() * 0.5;


}


________________


6. Marquee Brand Strip
overflow: hidden


border-top + border-bottom: 1px solid --glass-border


background: rgba(255,255,255,0.40)


padding: 16px 0


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


Content: Brand names in Bricolage Grotesque 500, 14px, --text-muted, duplicated for seamless loop. Separated by a faint ✦ glyph.


________________


7. TTS Page Screenshot Section
This section sits after the Marquee strip. It replaces any coded mockup — a real screenshot of the TTS studio page is displayed here inside a browser-style frame. The purpose is to show the product's core interface in context.
Section Header
section-label: DM Sans 500, 12px, letter-spacing: 2px, uppercase, --text-muted


               text: "PRODUCT"


section-title: Bricolage Grotesque 700, clamp(28–44px), --text-primary, text-align: center


               text: "Everything you need to go from text to audio"


Both animate in via .reveal scroll class.
TTS Screenshot Frame
File: Place your provided TTS page screenshot at public/assets/tts-page.png


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


/* globals.css — 3D tilt on TTS frame */


.tts-frame {


  transform: perspective(1200px) rotateX(4deg) scale(0.97);


  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);


}


.tts-frame:hover {


  transform: perspective(1200px) rotateX(0deg) scale(1);


}


Note: Screenshot dimensions (width/height on <Image>) are used for aspect ratio only — the image fills its container at w-full. Set them to match your actual screenshot dimensions.


________________


8. Features — Bento Grid
Grid Layout
.bento-grid {


  display: grid;


  grid-template-columns: repeat(3, 1fr);


  gap: 16px;


}


Card sizes:


* .bento-card → 1 column
* .bento-card.wide → grid-column: span 2
Arrangement
Row 1: [ Wide card (2-col) ] [ Dark card (1-col) ]


Row 2: [ Card ]  [ Card ]  [ Wide dark card (2-col) ]
Standard Card Styles
.bento-card {


  background: rgba(255, 255, 255, 0.70);


  border: 1px solid var(--glass-border);


  border-radius: 16px;


  padding: 28px;


  backdrop-filter: blur(12px);


}


Dark variant:


.bento-card.dark {


  background: var(--black);


  border-color: rgba(255, 255, 255, 0.08);


  /* Title → #ffffff, Desc → rgba(255,255,255,0.55) */


}


Icon block: 40×40px, --black bg, border-radius: 10px, white icon inside.


________________


9. Flip Cards (3D Animation)
Which cards flip: Apply .flip-card class to any bento card to enable this. Recommended on the "Developer API" and "Real-time Streaming" cards.
HTML Structure
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
CSS
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
What to Show on Back Faces
Card (front)
	Card (back)
	Developer API
	Code snippet — curl / JSON example
	Real-time Streaming
	Live latency counter animation + "< 200ms" stat
	Ultra-realistic voices
	Voice selector UI with 3 sample voice names
	

________________


10. Mouse-Tracking 3D Tilt (Non-flip cards)
All non-flip bento cards get a live 3D tilt that follows the mouse:


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


________________


11. Scroll-Driven Reveal Animations
CSS
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
JS (IntersectionObserver)
const observer = new IntersectionObserver(entries => {


  entries.forEach(e => {


    if (e.isIntersecting) e.target.classList.add('visible');


  });


}, { threshold: 0.12 });


document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
What Gets .reveal
* Section labels
* Section titles (+ .reveal-delay-1)
* Dashboard frame (+ .reveal-delay-2)
* Each bento card (staggered delays)
* Each pricing card (staggered delays)


________________


12. Pricing Section
Layout
3 cards side-by-side, flex, gap: 20px, justify-content: center


Background: linear-gradient(180deg, transparent, rgba(186,224,255,0.30))
Card Styles
.price-card {


  background: rgba(255, 255, 255, 0.75);


  border: 1px solid var(--glass-border);


  border-radius: 20px;


  padding: 36px 32px;


  width: 260px;


  backdrop-filter: blur(12px);


  transition: transform 0.25s, box-shadow 0.25s;


}


.price-card:hover {


  transform: translateY(-6px);


  box-shadow: 0 24px 60px rgba(56, 189, 248, 0.15);


}


/* Featured (Pro) — solid black, white text */


.price-card.featured {


  background: var(--black);


  color: #ffffff;


  border-color: transparent;


  transform: scale(1.04);  /* always slightly larger */


}


Text on featured card:


* Plan name: rgba(255,255,255,0.50)
* Amount: #ffffff
* Period: rgba(255,255,255,0.45)
* Features: rgba(255,255,255,0.70)
* Check icons: var(--accent) (#38BDF8)


Text on standard cards:


* Plan name: --text-muted
* Amount: --text-primary
* Features: --text-muted
* Check icons: #16A34A


________________


13. Footer
padding: 32px 48px


border-top: 1px solid --glass-border


background: rgba(255,255,255,0.35)


display: flex, space-between


font-size: 13px, color: --text-muted


Contains: logo (left), copyright (center), links — Privacy / Terms / Docs (right).


________________


14. Animation Master Reference
Animation
	Element
	Keyframe
	Duration
	Delay
	Trigger
	fadeSlideDown
	Hero badge
	opacity 0→1, translateY -12→0
	0.7s
	0s
	Page load
	wordReveal
	Hero title words
	opacity 0→1, blur 12→0, translateY 16→0
	0.75s
	+0.10s per word
	Page load
	underlineReveal
	Highlight underline
	scaleX 0→1
	0.7s
	1.2s
	Page load
	fadeSlideUp
	Subtitle, CTA
	opacity 0→1, translateY 20→0
	0.8s
	0.6s / 0.75s
	Page load
	screenshotReveal
	Hero dashboard screenshot
	opacity 0→1, translateY 60→0, blur 4→0, scale 0.97→1
	1.2s
	1.0s
	Page load
	wave
	Waveform bars
	scaleY 0.3↔1
	0.8–1.6s random
	random
	Infinite loop
	pulse
	Logo dot
	scale 1↔1.4
	2s
	—
	Infinite loop
	float-orb
	BG orbs
	translateY 0↔-30px, scale 1↔1.06
	10–16s
	random
	Infinite loop
	marquee
	Brand strip
	translateX 0→-50%
	22s
	—
	Infinite loop
	nav opacity
	Glass pill nav
	rgba opacity 0.55→0.78
	instant
	—
	Scroll > 40px
	parallax drift
	Hero screenshot
	translateY += scrollY × 0.12
	—
	—
	Scroll (rAF)
	reveal
	All sections
	opacity 0→1, translateY 32→0
	0.7s
	0–0.4s stagger
	Scroll (IO)
	rotateY(180deg)
	Flip cards
	full Y-axis flip
	0.65s
	—
	Hover
	3D tilt
	Bento cards
	perspective rotateX/Y
	—
	—
	Mousemove
	rotateX(0deg)
	TTS frame
	tilt to flat
	0.6s
	—
	Hover
	

________________


15. Glassmorphism Utility Classes
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


________________


16. Screenshot Placement Guide
All screenshots use next/image <Image>. Place files in public/assets/ — Next.js serves this directory at the root path automatically.
Screenshot 1 — Dashboard (inside Hero section)
Property
	Value
	File path
	public/assets/dashboard.png
	src in JSX
	"/assets/dashboard.png"
	Wrapping element
	.hero-screenshot-frame div
	Animation
	screenshotReveal CSS — fires at 1.0s delay
	priority prop
	✅ Yes — above the fold
	Frame style
	Rounded corners, sky glow shadow, no browser chrome
	Screenshot 2 — TTS Studio Page (§7 section)
Property
	Value
	File path
	public/assets/tts-page.png
	src in JSX
	"/assets/tts-page.png"
	Wrapping element
	.tts-frame div inside browser chrome topbar
	Animation
	.reveal scroll class (IntersectionObserver)
	priority prop
	❌ No — below the fold
	Frame style
	Browser chrome topbar + rotateX(4deg) 3D tilt
	Hero Sky Background
Property
	Value
	File path
	public/assets/hero-sky.jpg
	src in JSX
	"/assets/hero-sky.jpg"
	Usage
	<Image fill priority> inside absolute inset-0 container
	Overlay
	bg-white/40 div on top — adjust opacity to taste
	priority prop
	✅ Yes — LCP element
	

________________


17. Project File & Folder Structure
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


│       ├── Hero.tsx            ← Hero section ('use client' for word-reveal useEffect)


│       ├── HeroTitle.tsx       ← Word-by-word blur reveal title


│       ├── Waveform.tsx        ← Animated waveform bars ('use client')


│       ├── Marquee.tsx         ← Infinite scroll brand strip


│       ├── TtsSection.tsx      ← TTS screenshot section (with IntersectionObserver)


│       ├── BentoGrid.tsx       ← Features grid


│       ├── FlipCard.tsx        ← 3D flip card component


│       ├── BentoCard.tsx       ← Standard tilt card ('use client' for mousemove)


│       ├── Pricing.tsx         ← Pricing 3-col section


│       └── Footer.tsx          ← Footer


│


├── public/


│   └── assets/


│       ├── hero-sky.jpg        ← ✅ You will provide — hero background sky photo


│       ├── dashboard.png       ← ✅ You will provide — dashboard screenshot (hero)


│       └── tts-page.png        ← ✅ You will provide — TTS studio screenshot (§7)


│


├── styles/


│   └── globals.css             ← CSS variables, keyframe animations, .reveal, .orb,


│                                  .hero-word, .hero-screenshot-frame, .tts-frame,


│                                  .flip-card, glass utilities


│


└── tailwind.config.ts          ← Custom colors, font families, animation extensions
Key Next.js Notes
* All interactive components (useEffect, useRouter, event handlers) need 'use client' at the top
* Static sections (Marquee text, Pricing card content, Footer) can stay as Server Components
* <Image> from next/image for all screenshots and the sky background — never raw <img> for above-fold images
* Scroll reveal uses IntersectionObserver inside a useEffect in a shared useReveal hook
* Font variables set on <html> in root layout.tsx — available everywhere via var(--font-display) and font-display Tailwind class
Routing
Route
	File
	Purpose
	/landing
	app/landing/page.tsx
	Public marketing page
	/
	app/page.tsx
	Home — app dashboard after sign-in
	

All CTA buttons ("Start for free", "Get started free") call router.push('/') from useRouter() in next/navigation.


________________


18. Implementation Checklist
Project Setup


* npx create-next-app@latest with App Router + Tailwind
* Configure tailwind.config.ts — custom colors (sky, ink, voice, positive), font families, animation keyframes
* Set up app/layout.tsx with next/font/google — Bricolage Grotesque, DM Sans, JetBrains Mono; apply all three variable classes to <html>
* Add globals.css — CSS vars for glass rgba values, @keyframes for all animations, .reveal, .orb, .hero-word, .hero-screenshot-frame, .tts-frame, .flip-card
* Create app/landing/page.tsx as the landing route
* Create app/page.tsx as the home/app route (/)
* Add Tabler Icons: npm install @tabler/icons-react


Assets — place in public/assets/


* hero-sky.jpg — your sky background photo ← you will provide
* dashboard.png — your dashboard screenshot ← you will provide
* tts-page.png — your TTS studio screenshot ← you will provide


Navigation (components/landing/Navbar.tsx)


* 'use client' — needs useRouter and scroll listener
* Wrapper div: sticky top-0 z-50 flex justify-center px-10 pt-4 pointer-events-none
* Nav pill: pointer-events-auto rounded-full border border-white/80 backdrop-blur-[24px]
* Scroll listener → increase background opacity past 40px
* All CTA buttons → router.push('/')


Hero (components/landing/Hero.tsx + HeroTitle.tsx)


* 'use client' on both
* Sky photo background via <Image fill priority> + bg-white/40 overlay
* 3 floating orbs with float-orb CSS animation
* Hero badge — glass pill with green dot
* HeroTitle.tsx — useEffect word-by-word .hero-word span injection + stagger delays
* Highlight span with ::after underline scaleX reveal at 1.2s
* Subtitle fadeSlideUp at 0.6s delay
* CTA row fadeSlideUp at 0.75s — primary button router.push('/')
* <Waveform /> component — 38 bars, randomised heights/delays via useEffect
* Dashboard screenshot: <Image> wrapped in .hero-screenshot-frame with screenshotReveal CSS animation at 1.0s delay
* Optional parallax: useEffect scroll listener on screenshot frame


Marquee (components/landing/Marquee.tsx)


* Duplicate brand list, infinite CSS marquee animation


TTS Section (components/landing/TtsSection.tsx)


* id="tts-section" for outline CTA scroll target
* .reveal class — useReveal hook with IntersectionObserver
* Browser chrome topbar (dark bar, traffic light dots, monospace URL)
* <Image> for TTS screenshot, width/height matching actual screenshot dimensions
* .tts-frame CSS — rotateX(4deg) → rotateX(0deg) on hover


Bento Grid (components/landing/BentoGrid.tsx + BentoCard.tsx + FlipCard.tsx)


* 'use client' on BentoCard.tsx (mousemove tilt)
* grid-cols-3 layout, .col-span-2 for wide cards
* Standard cards with mouse-tracking 3D tilt (onMouseMove, onMouseLeave)
* FlipCard.tsx — perspective-[1000px] wrapper, [transform-style:preserve-3d] inner, hover:[transform:rotateY(180deg)]
* Flip back faces: code snippet (API card), latency counter (Streaming card)
* .reveal with staggered transitionDelay on each card


Pricing (components/landing/Pricing.tsx)


* 3 cards, flex gap-5 justify-center
* Featured card: bg-ink text-white scale-[1.04]
* All cards hover:-translate-y-1.5 transition-transform
* Featured CTA → router.push('/')


Footer (components/landing/Footer.tsx)


* Logo + copyright + Privacy / Terms / Docs links


Scroll Reveal (shared hook)


* hooks/useReveal.ts — useEffect + IntersectionObserver, adds visible class, threshold: 0.12
* Add to globals.css: .reveal { opacity:0; transform:translateY(32px); transition:... } .reveal.visible { opacity:1; transform:none }


QA


* No text-white on sky/glass surfaces — only on bg-ink elements
* Add prefers-reduced-motion media query to disable/simplify animations
* next/image warning-free: all <Image> have width + height or fill
* backdrop-filter fallback: add @supports not (backdrop-filter: blur(1px)) fallback bg for nav + cards
* Mobile responsive: bento grid → grid-cols-1 on small, grid-cols-2 on md
* Lighthouse: priority on hero <Image> tags (sky bg + dashboard screenshot)


________________




Last updated: Next.js + Tailwind CSS spec — VoiceFlow TTS SaaS, route /landing → / — Glassmorphic Sky theme