import { TextToSpeechView } from "@/features/text-to-speech/views/text-to-speech-view";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Resonance | Text to Speech",
}

export default function TextToSpeechPage() {
    return (
        <TextToSpeechView />
    );
}