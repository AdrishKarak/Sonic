import { WavyBackground } from "@/components/ui/wavy-background";

export function HeroPattern() {
    return (
        <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
            <WavyBackground
                colors={["#2DD4BF", "#22D3EE", "#38BDF8", "#818CF8"]}
                blur={0}
                speed="fast"
                waveOpacity={0.3}
                waveWidth={50}
                waveCount={6}
                containerClassName="h-full w-full"
                className="hidden"
            />
        </div>
    );
}
