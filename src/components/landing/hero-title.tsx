"use client";

import { useEffect, useRef } from "react";

export default function HeroTitle() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    let wordIndex = 0;
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent!.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        words.forEach((w) => {
          if (/\S/.test(w)) {
            const span = document.createElement("span");
            span.className = "hero-word inline-block";
            span.style.animationDelay = `${wordIndex * 0.08 + 0.05}s`;
            span.textContent = w;
            frag.appendChild(span);
            wordIndex++;
          } else {
            frag.appendChild(document.createTextNode(w));
          }
        });
        node.parentNode!.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(walk);
      }
    };
    Array.from(el.childNodes).forEach(walk);
  }, []);

  return (
    <h1
      ref={titleRef}
      className="font-bold text-center leading-[1.05] max-w-[820px] mb-6"
      style={{
        fontFamily: "var(--font-display-family)",
        color: "var(--ink)",
        fontSize: "clamp(36px, 6vw, 72px)",
        letterSpacing: "-0.05em",
      }}
    >
      Turn any text into{" "}
      <span className="highlight relative inline-block">natural speech</span>{" "}
      in seconds
    </h1>
  );
}
