export const speak = (text, lang = 'en-US') => {
    if (typeof window === 'undefined') return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Slightly slower for clarity

    // Find a suitable voice if possible
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang));
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
    if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
    }
};
