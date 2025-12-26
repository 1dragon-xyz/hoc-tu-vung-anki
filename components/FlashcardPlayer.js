'use client';

import { useState, useEffect, useCallback } from 'react';
import { speak } from '@/lib/tts';
import { getNextReview, Rating } from '@/lib/fsrs';
import { playSound, vibrate, startBGM, stopBGM } from '@/lib/sounds';

export default function FlashcardPlayer({ cards, loading }) {
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

    // Arcade-style "Attract Mode" (Welcome loop)
    useEffect(() => {
        if (isGameStarted || loading) return;

        const welcomeMessage = 'Chào bạn. Nhấn nút bất kỳ để bắt đầu học.';

        startBGM();
        speak(welcomeMessage, 'vi-VN');

        const interval = setInterval(() => {
            if (!isGameStarted) {
                speak(welcomeMessage, 'vi-VN');
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isGameStarted, loading]);

    const playCard = useCallback((card) => {
        if (!card) return;
        speak(card.question, 'en-US');
        if (card.hint) {
            setTimeout(() => {
                speak(`Gợi ý. ${card.hint}`, 'vi-VN');
            }, 2500);
        }
    }, []);

    const revealAnswer = useCallback(() => {
        if (!currentCard || isProcessing || showAnswer) return;
        setShowAnswer(true);
        vibrate([50]);
        speak(currentCard.answer, 'vi-VN');
    }, [currentCard, isProcessing, showAnswer]);

    const handleRating = useCallback(async (rating) => {
        if (!currentCard || isProcessing || !showAnswer) return;
        setIsProcessing(true);

        const isGood = rating === Rating.Good;
        playSound(isGood ? 'success' : 'error');
        vibrate(isGood ? [50, 50, 50] : [200]);

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
        }, 1200); // Shorter transition for better feel
    }, [currentCard, currentIndex, sessionCards, playCard, isProcessing, showAnswer]);

    const repeatContent = useCallback(() => {
        if (!currentCard) return;
        if (showAnswer) {
            speak(currentCard.answer, 'vi-VN');
        } else {
            playCard(currentCard);
        }
    }, [currentCard, showAnswer, playCard]);

    const startPractice = useCallback(() => {
        if (sessionCards.length === 0) {
            speak('Chưa có thẻ nào cần học. Chúc bạn một ngày vui vẻ!', 'vi-VN');
            return;
        }
        setIsGameStarted(true);
        setCurrentIndex(0);
        setShowAnswer(false);
        stopBGM();
        playSound('connect');
        playCard(sessionCards[0]);
    }, [sessionCards, playCard]);

    // Keyboard + Gamepad handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();

            // Start Screen
            if (!isGameStarted) {
                if (['a', 'b', 'y', ' ', 'enter'].includes(key)) {
                    e.preventDefault();
                    startBGM();
                    startPractice();
                }
                return;
            }

            // In-Game
            if (!showAnswer) {
                // Any key to reveal
                if (['a', 'b', 'y', ' ', 'enter'].includes(key)) {
                    e.preventDefault();
                    revealAnswer();
                }
            } else {
                // Rate or Repeat
                if (key === 'a') { e.preventDefault(); handleRating(Rating.Again); }
                if (key === 'b') { e.preventDefault(); handleRating(Rating.Good); }
                if (key === 'y') { e.preventDefault(); repeatContent(); }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        window.handleGamepadButton = (btnIdx) => {
            if (!isGameStarted) {
                startBGM();
                startPractice();
                return;
            }

            if (!showAnswer) {
                revealAnswer();
            } else {
                if (btnIdx === 0) handleRating(Rating.Again);
                if (btnIdx === 1) handleRating(Rating.Good);
                if (btnIdx === 3) repeatContent();
            }
        };

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGameStarted, showAnswer, handleRating, revealAnswer, repeatContent, startPractice]);

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
                                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{isProcessing ? 'Đang chuyển...' : 'Hãy suy nghĩ... Nhấn nút bất kỳ để xem đáp án'}</p>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginTop: '4rem' }}>
                            {/* Visual buttons for reference, though logic is handled by global listeners */}
                            <button
                                onClick={() => showAnswer ? handleRating(Rating.Again) : revealAnswer()}
                                disabled={isProcessing}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: isProcessing ? 0.5 : 1 }}
                            >
                                <div style={{ background: 'var(--danger)', width: '4rem', height: '4rem', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: 'white' }}>A</div>
                                <span style={{ color: 'var(--text-main)' }}>{showAnswer ? 'Chưa thuộc' : 'Xem đáp án'}</span>
                            </button>
                            <button
                                onClick={repeatContent}
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <div style={{ background: 'var(--warning)', width: '4rem', height: '4rem', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: 'white' }}>Y</div>
                                <span style={{ color: 'var(--text-main)' }}>Nghe lại</span>
                            </button>
                            <button
                                onClick={() => showAnswer ? handleRating(Rating.Good) : revealAnswer()}
                                disabled={isProcessing}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: isProcessing ? 0.5 : 1 }}
                            >
                                <div style={{ background: 'var(--success)', width: '4rem', height: '4rem', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem', color: 'white' }}>B</div>
                                <span style={{ color: 'var(--text-main)' }}>{showAnswer ? 'Đã thuộc' : 'Xem đáp án'}</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
