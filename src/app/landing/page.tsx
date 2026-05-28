import type { Metadata } from "next";
import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import Marquee from "@/components/landing/marquee";
import TtsSection from "@/components/landing/tts-section";
import BentoGrid from "@/components/landing/bento-grid";
import Pricing from "@/components/landing/pricing";
import Footer from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Sonic — AI Text-to-Speech & Voice Cloning",
  description:
    "Studio-quality text-to-speech for creators, developers, and teams. Turn any text into natural speech in seconds.",
};

export default function LandingPage() {
  return (
    <div style={{ background: "var(--sky-canvas)" }}>
      <Navbar />
      <Hero />
      <Marquee />
      <TtsSection />
      <BentoGrid />
      <Pricing />
      <Footer />
    </div>
  );
}
