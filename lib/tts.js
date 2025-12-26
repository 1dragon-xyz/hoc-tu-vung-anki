export const speak = (text, lang = 'en-US') => {
    if (typeof window === 'undefined') return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    // Find the BEST available voice
    const voices = window.speechSynthesis.getVoices();

    // Priority: 1. Google/Microsoft Online (Neural), 2. Enhanced/Premium, 3. Default
    const bestVoice = voices
        .filter(v => v.lang.startsWith(lang.split('-')[0]))
        .sort((a, b) => {
            const score = (v) => {
                let s = 0;
                if (v.name.includes('Google') || v.name.includes('Neural')) s += 10;
                if (v.name.includes('Enhanced') || v.name.includes('Premium')) s += 5;
                if (v.localService) s += 1;
                return s;
            };
            return score(b) - score(a);
        })[0];

    if (bestVoice) {
        utterance.voice = bestVoice;
        console.log(`Using voice: ${bestVoice.name}`);
    }

    // Natural settings
    utterance.rate = lang === 'en-US' ? 0.9 : 1.0; // Slightly slower for English learners
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
    if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
    }
};
