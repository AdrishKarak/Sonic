"use client";

import { useEffect, useRef } from "react";
import {
  Mic,
  Zap,
  Globe,
  Code,
  Headphones,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Global Voice Library",
    desc: "20+ sample voices from various countries including the UK, USA, India, Canada, Australia, and Russia.",
    wide: true,
    dark: false,
    flip: false,
  },
  {
    icon: Headphones,
    title: "Contextual Modes",
    desc: "Specify the exact delivery style you need—from professional narration to casual conversation or podcasting.",
    wide: false,
    dark: true,
    flip: false,
  },
  {
    icon: Sparkles,
    title: "Instant Voice Cloning",
    desc: "Clone your own custom voice with just 10+ seconds of audio. Your digital twin, ready in seconds.",
    wide: false,
    dark: false,
    flip: false,
  },
  {
    icon: Mic,
    title: "In-Platform Recording",
    desc: "Record your audio samples directly within the platform. No external recording software required.",
    wide: false,
    dark: false,
    flip: false,
  },
  {
    icon: Zap,
    title: "Pay As You Go",
    desc: "Pay only for what you use, no extra charges. Synthesize up to 5,000 characters at a time.",
    wide: false,
    dark: true,
    flip: true,
    backTitle: "Transparent Usage",
    backCode: `Max Request: 5000 chars\nBase Fee: $0\nSubscriptions: None`,
    backBadge: "True Flexibility",
  },
];

export default function BentoGrid() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );

    sectionRef.current
      ?.querySelectorAll(".reveal")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Mouse tilt for non-flip cards
  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    isFlip: boolean
  ) => {
    if (isFlip) return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px) scale(1.012)`;
  };

  const handleMouseLeave = (
    e: React.MouseEvent<HTMLDivElement>,
    isFlip: boolean
  ) => {
    if (isFlip) return;
    e.currentTarget.style.transform = "";
  };

  return (
    <section
      id="features"
      ref={sectionRef}
      className="flex flex-col items-center gap-5 py-24 px-6 sm:px-12"
      style={{ background: "var(--sky-canvas)" }}
    >
      <span
        className="reveal font-medium text-xs tracking-[0.15em] uppercase"
        style={{
          fontFamily: "var(--font-body-family)",
          color: "var(--ink-muted)",
        }}
      >
        Features
      </span>

      <h2
        className="reveal font-bold text-center max-w-[600px] mb-6"
        style={{
          fontFamily: "var(--font-display-family)",
          color: "var(--ink)",
          fontSize: "clamp(28px, 4vw, 44px)",
          letterSpacing: "-0.03em",
          transitionDelay: "0.1s",
        }}
      >
        Everything your voice needs
      </h2>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-[960px]">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          const delay = `${0.1 + i * 0.08}s`;

          if (feature.flip) {
            return (
              <div
                key={feature.title}
                className={`reveal flip-card ${feature.wide ? "md:col-span-2" : ""}`}
                style={{ transitionDelay: delay }}
              >
                <div className="flip-inner">
                  {/* Front */}
                  <div
                    className="flip-front p-7 flex flex-col justify-between group"
                    style={{
                      background: feature.dark
                        ? "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)"
                        : "linear-gradient(145deg, #ffffff 0%, #f0f0f0 100%)",
                      border: `1px solid ${feature.dark ? "rgba(255,255,255,0.12)" : "rgba(255, 255, 255, 0.8)"}`,
                      boxShadow: feature.dark 
                        ? "inset 0 1px 1px rgba(255,255,255,0.05), 0 12px 40px rgba(0,0,0,0.15)"
                        : "inset 0 1px 1px rgba(255,255,255,0.8), 0 12px 40px rgba(56, 189, 248, 0.05)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div>
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center mb-6 shadow-sm"
                        style={{
                          background: feature.dark 
                            ? "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)" 
                            : "linear-gradient(135deg, var(--sky-400) 0%, var(--sky-500) 100%)",
                          border: feature.dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.3)",
                        }}
                      >
                        <Icon
                          size={22}
                          color="white"
                          className="drop-shadow-md"
                        />
                      </div>
                      <div
                        className="text-xl font-semibold mb-2 tracking-tight"
                        style={{
                          fontFamily: "var(--font-display-family)",
                          color: feature.dark ? "white" : "var(--ink-deep)",
                        }}
                      >
                        {feature.title}
                      </div>
                      <div
                        className="text-[15px] leading-relaxed"
                        style={{
                          fontFamily: "var(--font-body-family)",
                          color: feature.dark
                            ? "rgba(255,255,255,0.65)"
                            : "var(--ink-muted)",
                        }}
                      >
                        {feature.desc}
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className="flip-back flex flex-col justify-between"
                    style={{
                      background: "linear-gradient(145deg, #0f172a 0%, #020617 100%)",
                      border: "1px solid rgba(56, 189, 248, 0.2)",
                      boxShadow: "0 12px 40px rgba(14, 165, 233, 0.15)",
                    }}
                  >
                    <div
                      className="text-lg font-semibold"
                      style={{
                        fontFamily: "var(--font-display-family)",
                        color: "white",
                      }}
                    >
                      {feature.backTitle}
                    </div>
                    <pre className="code-snippet border-white/10 bg-black/40 shadow-inner rounded-xl">{feature.backCode}</pre>
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mt-2"
                      style={{ color: "var(--sky-400)" }}
                    >
                      {feature.backBadge}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={feature.title}
              className={`reveal rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${feature.wide ? "md:col-span-2" : ""}`}
              style={{
                background: feature.dark
                  ? "linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)"
                  : "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 100%)",
                border: `1px solid ${feature.dark ? "rgba(255,255,255,0.12)" : "rgba(255, 255, 255, 0.8)"}`,
                backdropFilter: "blur(20px)",
                boxShadow: feature.dark 
                  ? "inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 30px rgba(0,0,0,0.1)"
                  : "inset 0 1px 1px rgba(255,255,255,0.8), 0 8px 30px rgba(56, 189, 248, 0.05)",
                transitionDelay: delay,
                cursor: "default",
              }}
              onMouseMove={(e) => handleMouseMove(e, false)}
              onMouseLeave={(e) => handleMouseLeave(e, false)}
            >
              <div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-6 shadow-sm"
                  style={{
                    background: feature.dark 
                      ? "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)" 
                      : "linear-gradient(135deg, var(--sky-400) 0%, var(--sky-500) 100%)",
                    border: feature.dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <Icon
                    size={22}
                    color="white"
                    className="drop-shadow-md"
                  />
                </div>
                <div
                  className="text-xl font-semibold mb-2 tracking-tight"
                  style={{
                    fontFamily: "var(--font-display-family)",
                    color: feature.dark ? "white" : "var(--ink-deep)",
                  }}
                >
                  {feature.title}
                </div>
                <div
                  className="text-[15px] leading-relaxed"
                  style={{
                    fontFamily: "var(--font-body-family)",
                    color: feature.dark
                      ? "rgba(255,255,255,0.65)"
                      : "var(--ink-muted)",
                  }}
                >
                  {feature.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
