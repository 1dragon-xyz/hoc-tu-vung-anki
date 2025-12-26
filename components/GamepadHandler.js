'use client';

import { useEffect, useRef } from 'react';
import { speak } from '@/lib/tts';
import { playSound } from '@/lib/sounds';

export default function GamepadHandler({ onButtonPress, onConnect }) {
    const requestRef = useRef();
    const gamepadRef = useRef(null);
    const buttonStates = useRef({});

    const pollGamepad = () => {
        const gamepads = navigator.getGamepads();
        const gp = gamepads[0]; // Take the first connected gamepad

        if (gp) {
            if (!gamepadRef.current) {
                console.log('Gamepad connected:', gp.id);
                playSound('connect');
                speak('Đã kết nối tay cầm Xbox', 'vi-VN');
                if (onConnect) onConnect();
            }
            gamepadRef.current = gp;

            // Button mappings for Xbox One
            // 0: A
            // 1: B
            // 2: X
            // 3: Y
            // ...

            const buttons = [0, 1, 3]; // A, B, Y
            buttons.forEach(idx => {
                const isPressed = gp.buttons[idx].pressed;
                const prevState = buttonStates.current[idx];

                if (isPressed && !prevState) {
                    // Button down event
                    onButtonPress(idx);
                }
                buttonStates.current[idx] = isPressed;
            });
        } else if (gamepadRef.current) {
            console.log('Gamepad disconnected');
            speak('Mất kết nối tay cầm', 'vi-VN');
            gamepadRef.current = null;
        }

        requestRef.current = requestAnimationFrame(pollGamepad);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(pollGamepad);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return null; // This component doesn't render anything
}
