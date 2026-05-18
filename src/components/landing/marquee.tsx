const brands = [
  "Spotify",
  "YouTube",
  "Audible",
  "Notion",
  "Linear",
  "Vercel",
  "Stripe",
  "Shopify",
  "Discord",
  "Figma",
];

export default function Marquee() {
  const items = [...brands, ...brands];

  return (
    <div
      className="overflow-hidden py-4"
      style={{
        borderTop: "1px solid var(--glass-border)",
        borderBottom: "1px solid var(--glass-border)",
        background: "rgba(255, 255, 255, 0.40)",
      }}
    >
      <div
        className="flex gap-12 w-max"
        style={{ animation: "marquee 22s linear infinite" }}
      >
        {items.map((brand, i) => (
          <span
            key={`${brand}-${i}`}
            className="text-sm font-medium whitespace-nowrap flex items-center gap-4"
            style={{
              fontFamily: "var(--font-display-family)",
              color: "var(--ink-muted)",
            }}
          >
            {brand}
            <span className="text-xs opacity-40">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
