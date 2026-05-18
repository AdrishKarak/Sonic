"use client";

import { useEffect, useRef } from "react";

export default function Waveform() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    for (let i = 0; i < 38; i++) {
      const bar = document.createElement("div");
      bar.style.width = "3px";
      bar.style.background = "var(--ink)";
      bar.style.borderRadius = "2px";
      bar.style.height = `${Math.random() * 32 + 8}px`;
      bar.style.animationDelay = `${Math.random() * 1.2}s`;
      bar.style.animationDuration = `${0.8 + Math.random() * 0.8}s`;
      bar.style.opacity = `${0.45 + Math.random() * 0.5}`;
      bar.style.animation = `wave ${0.8 + Math.random() * 0.8}s ease-in-out ${Math.random() * 1.2}s infinite`;
      container.appendChild(bar);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-[3px] justify-center"
      style={{ animation: "fadeSlideUp 0.8s 0.9s ease both" }}
      aria-hidden="true"
    />
  );
}
