"use client";

//import { useSuspenseQuery } from "@tanstack/react-query";

//import { useTRPC } from "@/trpc/client";
import { TextInputPanel } from "@/features/text-to-speech/components/text-input-panel";
import { VoicePreviewPlaceholder } from "@/features/text-to-speech/components/voice-preview-placeholder";
import { SettingsPanel } from "@/features/text-to-speech/components/settings-panel";
//import {
//  TextToSpeechForm,
//  defaultTTSValues,
// type TTSFormValues
//} from "@/features/text-to-speech/components/text-to-speech-form";
//import { TTSVoicesProvider } from "../contexts/tts-voices-context";

export function TextToSpeechView() {
    return (
        <>
            {/* <TTSVoicesProvider value={{ customVoices, systemVoices, allVoices }}>
      <TextToSpeechForm defaultValues={defaultValues}> */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
                <div className="flex min-h-0 flex-1 flex-col">
                    <TextInputPanel />
                    <VoicePreviewPlaceholder />
                </div>
                <SettingsPanel />
            </div>
            {/* </TextToSpeechForm>*/}
            {/*</TTSVoicesProvider>*/}
        </>
    );
}