"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="px-6 sm:px-12 py-8"
      style={{
        borderTop: "1px solid var(--glass-border)",
        background: "rgba(255,255,255,0.35)",
      }}
    >
      <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/landing" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Sonic" width={24} height={24} />
          <span
            className="font-bold text-sm"
            style={{
              fontFamily: "var(--font-display-family)",
              color: "var(--ink)",
            }}
          >
            Sonic
          </span>
        </Link>

        {/* Copyright */}
        <p
          className="text-xs"
          style={{
            fontFamily: "var(--font-body-family)",
            color: "var(--ink-muted)",
          }}
        >
          © {new Date().getFullYear()} Sonic. All rights reserved.
        </p>

        {/* Links */}
        <div className="flex items-center gap-5">
          {["Privacy", "Terms", "Docs"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs transition-colors"
              style={{
                fontFamily: "var(--font-body-family)",
                color: "var(--ink-muted)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--ink-muted)")
              }
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
