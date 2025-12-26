// Web Audio API helper to generate notification sounds without external files
let audioCtx = null;
let bgmOscillators = [];
let bgmGain = null;
let isBgmPlaying = false;

const initAudio = () => {
    if (!audioCtx && typeof window !== 'undefined') {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
};

export const startBGM = () => {
    if (typeof window === 'undefined' || isBgmPlaying) return;
    initAudio();
    if (!audioCtx) return;

    isBgmPlaying = true;
    bgmGain = audioCtx.createGain();
    bgmGain.connect(audioCtx.destination);
    bgmGain.gain.setValueAtTime(0, audioCtx.currentTime);
    bgmGain.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 2); // Fade in subtlely

    // Simple 8-bit style pulsing melody loop
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    let startTime = audioCtx.currentTime + 0.1;

    // Schedule 30 seconds of loop (it's lightweight)
    for (let i = 0; i < 60; i++) {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notes[i % notes.length], startTime + (i * 0.5));

        noteGain.gain.setValueAtTime(0, startTime + (i * 0.5));
        noteGain.gain.linearRampToValueAtTime(1, startTime + (i * 0.5) + 0.05);
        noteGain.gain.linearRampToValueAtTime(0, startTime + (i * 0.5) + 0.4);

        osc.connect(noteGain);
        noteGain.connect(bgmGain);

        osc.start(startTime + (i * 0.5));
        osc.stop(startTime + (i * 0.5) + 0.5);
        bgmOscillators.push(osc);
    }
};

export const stopBGM = () => {
    if (bgmGain) {
        bgmGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); // Quick fade out
        setTimeout(() => {
            bgmOscillators.forEach(osc => { try { osc.stop(); } catch (e) { } });
            bgmOscillators = [];
            isBgmPlaying = false;
        }, 500);
    }
};

export const playSound = (type) => {
    if (typeof window === 'undefined') return;
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch (type) {
        case 'success': // High "ding"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'error': // Low "buzz"
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
            break;
        case 'connect': // Upward sweep
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
    }
};

export const vibrate = (pattern = [100]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }

    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
        const gamepads = navigator.getGamepads();
        for (const gp of gamepads) {
            if (gp && gp.vibrationActuator) {
                gp.vibrationActuator.playEffect('dual-rumble', {
                    startDelay: 0,
                    duration: pattern[0] || 100,
                    weakMagnitude: 0.5,
                    strongMagnitude: 0.5
                }).catch(() => { });
            }
        }
    }
};
