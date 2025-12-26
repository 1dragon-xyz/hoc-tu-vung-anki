'use client';

import { useState, useEffect, useCallback } from 'react';
import { speak } from '@/lib/tts';
import { getNextReview, Rating } from '@/lib/fsrs';
import { playSound, vibrate } from '@/lib/sounds';

export default function FlashcardPlayer({ cards }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [sessionCards, setSessionCards] = useState([]);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Initial load and filter cards
    useEffect(() => {
        const fetchProgress = async () => {
            if (cards.length > 0) {
                const now = new Date();
                const session = [];

                for (const card of cards) {
                    try {
                        const res = await fetch(`/api/progress?cardId=${card.id}`);
                        const state = res.ok ? await res.json() : null;

                        // FSRS Logic: if no state or nextReview <= now, it's due
                        if (!state || !state.due || new Date(state.due) <= now) {
                            session.push({ ...card, state });
                        }
                    } catch (e) {
                        session.push({ ...card, state: null });
                    }
                }

                // Shuffle session cards
                setSessionCards(session.sort(() => Math.random() - 0.5));
            }
        };
        fetchProgress();
    }, [cards]);

    const currentCard = sessionCards[currentIndex];

    const playCard = useCallback((card) => {
        if (!card) return;
        speak(card.question, 'en-US');
        if (card.hint) {
            setTimeout(() => {
                speak(`Gợi ý. ${card.hint}`, 'vi-VN');
            }, 2500);
        }
    }, []);

    const handleRating = useCallback(async (rating) => {
        if (!currentCard || isProcessing) return;
        setIsProcessing(true);

        setShowAnswer(true);
        const isGood = rating === Rating.Good;

        // Feedback Cue: Sound + Vibration + Speech
        playSound(isGood ? 'success' : 'error');
        vibrate(isGood ? [50, 50, 50] : [200]);

        speak(currentCard.answer, 'vi-VN');

        // Calculate and Save Progress
        const nextState = getNextReview(currentCard.state, rating);
        await fetch('/api/progress', {
            method: 'POST',
            body: JSON.stringify({
                cardId: currentCard.id,
                cardState: nextState
            }),
        });

        setTimeout(() => {
            setShowAnswer(false);
            if (currentIndex < sessionCards.length - 1) {
                const nextIdx = currentIndex + 1;
                setCurrentIndex(nextIdx);
                playCard(sessionCards[nextIdx]);
            } else {
                speak('Đã hoàn thành bài học hôm nay. Hẹn gặp lại nhé!', 'vi-VN');
                setIsGameStarted(false);
            }
            setIsProcessing(false);
        }, 3000);
    }, [currentCard, currentIndex, sessionCards, playCard, isProcessing]);

    const repeatCard = useCallback(() => {
        if (currentCard) playCard(currentCard);
    }, [currentCard, playCard]);

    const startPractice = useCallback(() => {
        if (sessionCards.length === 0) {
            speak('Chưa có thẻ nào cần học. Chúc bạn một ngày vui vẻ!', 'vi-VN');
            return;
        }
        setIsGameStarted(true);
        setCurrentIndex(0);
        setShowAnswer(false);
        playSound('connect');
        playCard(sessionCards[0]);
    }, [sessionCards, playCard]);

    // Keyboard + Gamepad handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (!isGameStarted) {
                if (['a', 'b', 'y', ' ', 'enter'].includes(key)) {
                    e.preventDefault();
                    startPractice();
                }
                return;
            }
            if (key === 'a') { e.preventDefault(); handleRating(Rating.Again); }
            if (key === 'b') { e.preventDefault(); handleRating(Rating.Good); }
            if (key === 'y') { e.preventDefault(); repeatCard(); }
        };

        window.addEventListener('keydown', handleKeyDown);

        window.handleGamepadButton = (btnIdx) => {
            if (!isGameStarted) {
                startPractice();
                return;
            }
            if (btnIdx === 0) handleRating(Rating.Again);
            if (btnIdx === 1) handleRating(Rating.Good);
            if (btnIdx === 3) repeatCard();
        };

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGameStarted, handleRating, repeatCard, startPractice]);

    return (
        <div className="fade-in" style={{ height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="glass" style={{ width: '100%', padding: '4rem', textAlign: 'center', position: 'relative' }}>
                {!isGameStarted ? (
                    <div style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Sẵn sàng</h2>
                        <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Nhấn phím bất kỳ trên tay cầm hoặc bàn phím để bắt đầu học...</p>
                    </div>
                ) : (
                    <>
                        <div style={{ position: 'absolute', top: '1rem', right: '2rem', color: 'var(--text-muted)' }}>
                            {currentIndex + 1} / {sessionCards.length}
                        </div>

                        <h2 style={{ fontSize: '4rem', marginBottom: '1rem' }}>{currentCard?.question}</h2>

                        <div style={{ minHeight: '4rem' }}>
                            {showAnswer ? (
                                <h3 style={{ fontSize: '2.5rem', color: 'var(--success)', marginTop: '2rem' }}>{currentCard?.answer}</h3>
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Nghe và chọn...</p>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginTop: '4rem' }}>
                            <button
                                onClick={() => handleRating(Rating.Again)}
                                disabled={isProcessing}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: isProcessing ? 0.5 : 1 }}
                            >
                                <div style={{ background: 'var(--danger)', width: '4rem', height: '4rem', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: 'white' }}>A</div>
                                <span style={{ color: 'var(--text-main)' }}>Chưa thuộc</span>
                            </button>
                            <button
                                onClick={repeatCard}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <div style={{ background: 'var(--warning)', width: '4rem', height: '4rem', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: 'white' }}>Y</div>
                                <span style={{ color: 'var(--text-main)' }}>Nghe lại</span>
                            </button>
                            <button
                                onClick={() => handleRating(Rating.Good)}
                                disabled={isProcessing}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: isProcessing ? 0.5 : 1 }}
                            >
                                <div style={{ background: 'var(--success)', width: '4rem', height: '4rem', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: 'white' }}>B</div>
                                <span style={{ color: 'var(--text-main)' }}>Đã thuộc</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
