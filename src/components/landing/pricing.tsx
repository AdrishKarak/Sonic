"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Type, Sparkles, Zap, ArrowRight } from "lucide-react";

const usageRates = [
  {
    icon: Type,
    label: "TTS Generation",
    rate: "$0.03",
    per: "per 100 words",
    desc: "Only pay when you synthesize speech",
  },
  {
    icon: Sparkles,
    label: "Voice Cloning",
    rate: "$0.25",
    per: "per custom voice",
    desc: "Create high-fidelity digital clones",
  },
  {
    icon: Zap,
    label: "Exploration",
    rate: "Free",
    per: "always",
    desc: "Test features & hear voices for free",
  },
];

export default function Pricing() {
  const router = useRouter();
  const { isSignedIn } = useUser();
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

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="flex flex-col items-center gap-5 py-24 px-6 sm:px-12 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--sky-canvas), rgba(186,224,255,0.15))",
      }}
    >
      {/* Decorative background glow */}
      <div
        className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle, var(--sky-400) 0%, transparent 70%)",
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-[960px]">
        {/* Header */}
        <span
          className="reveal font-medium text-xs tracking-[0.15em] uppercase mb-4"
          style={{
            fontFamily: "var(--font-body-family)",
            color: "var(--sky-500)",
          }}
        >
          Pricing
        </span>

        <h2
          className="reveal font-bold text-center max-w-[600px] mb-4"
          style={{
            fontFamily: "var(--font-display-family)",
            color: "var(--ink)",
            fontSize: "clamp(32px, 5vw, 48px)",
            letterSpacing: "-0.03em",
            transitionDelay: "0.1s",
            lineHeight: 1.1,
          }}
        >
          Pay only for what you use
        </h2>

        <p
          className="reveal text-lg max-w-[500px] text-center mb-12"
          style={{
            fontFamily: "var(--font-body-family)",
            color: "var(--ink-muted)",
            transitionDelay: "0.15s",
            lineHeight: 1.6,
          }}
        >
          Roaming around, experimenting, and listening to sample voices are completely free. You only pay when you synthesize speech or clone voices.
        </p>

        <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch justify-center">
          {/* Free tier meter card */}
          <div
            className="reveal flex-1 max-w-[500px] w-full p-8 lg:p-10 flex flex-col justify-between rounded-[2rem] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            style={{
              background: "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(20px)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.8), 0 12px 40px rgba(56, 189, 248, 0.08)",
              transitionDelay: "0.2s",
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <span
                  className="text-xl font-semibold tracking-tight"
                  style={{
                    fontFamily: "var(--font-display-family)",
                    color: "var(--ink)",
                  }}
                >
                  Free to explore
                </span>
                <span
                  className="text-[11px] px-3 py-1.5 rounded-full uppercase tracking-wider font-semibold"
                  style={{
                    color: "var(--sky-500)",
                    background: "rgba(56, 189, 248, 0.1)",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                  }}
                >
                  always free
                </span>
              </div>

              <div
                className="w-full p-4 rounded-xl relative"
                style={{
                  background: "rgba(14, 165, 233, 0.05)",
                  border: "1px solid rgba(14, 165, 233, 0.1)",
                }}
              >
                <div
                  className="text-[14px] leading-relaxed"
                  style={{ fontFamily: "var(--font-body-family)", color: "var(--ink)" }}
                >
                  <strong>Create an account for free!</strong> No subscriptions, no hidden fees. You can browse voices and test the platform at zero cost.
                </div>
              </div>
            </div>

            <div
              className="mt-10 pt-8 flex flex-col gap-2"
              style={{ borderTop: "1px solid rgba(14, 165, 233, 0.15)" }}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="text-5xl font-bold tracking-tighter"
                  style={{
                    fontFamily: "var(--font-display-family)",
                    color: "var(--ink)",
                  }}
                >
                  $0
                </span>
                <span className="text-sm font-medium" style={{ color: "var(--ink-muted)" }}>
                  subscription fee
                </span>
              </div>
              <p
                className="text-[14px] leading-relaxed mt-2"
                style={{
                  fontFamily: "var(--font-body-family)",
                  color: "var(--ink-muted)",
                }}
              >
                Billed securely based on strict usage. Invoiced automatically via Polar.
              </p>
            </div>
          </div>

          {/* Rate cards */}
          <div className="flex-1 max-w-[500px] w-full flex flex-col gap-4">
            {usageRates.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="reveal flex items-center p-6 gap-5 rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  style={{
                    background: "linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.75) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.8), 0 8px 30px rgba(56, 189, 248, 0.05)",
                    transitionDelay: `${0.3 + index * 0.1}s`,
                  }}
                >
            <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                 style={{
                   background: "linear-gradient(135deg, var(--sky-400) 0%, var(--sky-500) 100%)",
                   border: "1px solid rgba(255,255,255,0.3)",
                 }}>
              <Icon size={22} color="white" strokeWidth={2} className="drop-shadow-md" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1 gap-2 flex-wrap">
                <h4
                  className="font-semibold text-[15px]"
                  style={{
                    fontFamily: "var(--font-display-family)",
                    color: "var(--ink)",
                  }}
                >
                  {item.label}
                </h4>
                <div className="flex items-baseline gap-1">
                  <span
                    className="font-bold text-lg"
                    style={{ color: "var(--ink)" }}
                  >
                    {item.rate}
                  </span>
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {item.per}
                  </span>
                </div>
              </div>
              <p
                className="text-[13px] truncate"
                style={{
                  fontFamily: "var(--font-body-family)",
                  color: "var(--ink-muted)",
                }}
              >
                {item.desc}
              </p>
            </div>
          </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div
          className="reveal flex flex-col items-center gap-4 mt-12 w-full"
          style={{ transitionDelay: "0.6s" }}
        >
          <button
            onClick={() => router.push(isSignedIn ? "/" : "/sign-up")}
            className="text-white rounded-xl px-10 py-4 text-[16px] font-medium
                         flex items-center gap-2 group transition-all hover:shadow-[0_8px_30px_rgba(14,165,233,0.3)]"
            style={{ background: "var(--ink)" }}
          >
            <span>Start for free — no card required</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="https://polar.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] flex items-center gap-1.5 transition-colors mt-2"
            style={{ color: "var(--ink-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--ink-muted)")
            }
          >
            <span>Secure billing powered by</span>
            <span className="font-semibold text-sky-500 hover:text-sky-600 transition-colors">
              Polar ↗
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
