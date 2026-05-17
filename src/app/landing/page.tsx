import Link from "next/link";
import { UserButton, Show } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h1 className="text-4xl font-bold mb-8">Welcome to Resonance</h1>
            
            <div className="flex gap-4">
                <Show when="signed-in">
                    <Button asChild size="lg">
                        <Link href="/">Start</Link>
                    </Button>
                </Show>
                <Show when="signed-out">
                    <Button asChild size="lg">
                        <Link href="/sign-up">Start</Link>
                    </Button>
                </Show>
            </div>

            <div className="flex gap-4 mt-4">
                <Show when="signed-out">
                    <Button asChild variant="outline">
                        <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/sign-up">Sign Up</Link>
                    </Button>
                </Show>
                
                <Show when="signed-in">
                    <UserButton />
                </Show>
            </div>
        </div>
    );
}
