'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { speak } from '@/lib/tts';
import { getNextReview, Rating } from '@/lib/fsrs';
import { playSound, vibrate, startBGM, stopBGM } from '@/lib/sounds';

export default function FlashcardPlayer({ cards, initialProgress = null, isLoading, demoMode = false, userId = 'default' }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [sessionCards, setSessionCards] = useState([]);
    const [todayCards, setTodayCards] = useState([]);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(true);
    const [nextDueIn, setNextDueIn] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [gamepadConnected, setGamepadConnected] = useState(false);

    // Track initialization to avoid running effects too early
    const isReadyRef = useRef(false);

    // 1. Load progress and initialize session
    useEffect(() => {
        const fetchProgress = async () => {
            if (cards.length > 0) {
                setLoadingProgress(true);
                const now = new Date();
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);

                const dueNow = [];
                const dueToday = [];
                let soonestDue = null;

                try {
                    let allProgress = initialProgress || {};
                    if (!initialProgress && !demoMode) {
                        const res = await fetch(`/api/progress?userId=${userId || 'default'}`);
                        allProgress = res.ok ? await res.json() : {};
                    }

                    for (const card of cards) {
                        const state = allProgress[card.id] || null;
                        if (demoMode || !state || !state.due) {
                            dueNow.push({ ...card, state: state });
                        } else {
                            const dueDate = new Date(state.due);
                            if (dueDate <= now) {
                                dueNow.push({ ...card, state });
                            } else if (dueDate <= endOfToday) {
                                dueToday.push({ ...card, state, dueDate });
                                if (!soonestDue || dueDate < soonestDue) soonestDue = dueDate;
                            }
                        }
                    }
                } catch (e) {
                    cards.forEach(c => dueNow.push({ ...c, state: null }));
                }

                setSessionCards(dueNow.sort(() => Math.random() - 0.5));
                setTodayCards(dueToday.sort((a, b) => a.dueDate - b.dueDate));
                if (soonestDue) setNextDueIn(Math.max(1, Math.ceil((soonestDue - now) / 60000)));
                setLoadingProgress(false);
                isReadyRef.current = true;
            } else if (!isLoading) {
                setLoadingProgress(false);
                isReadyRef.current = true;
            }
        };
        fetchProgress();
    }, [cards, demoMode, userId, initialProgress, isLoading]);

    const startPractice = useCallback(() => {
        if (sessionCards.length === 0) {
            setIsFinished(true);
            return;
        }
        setCurrentIndex(0);
        setShowAnswer(false);
        setIsGameStarted(true);
        setIsFinished(false);
        stopBGM();
        playSound('connect');
    }, [sessionCards]);

    const handleStartClick = useCallback(() => {
        setHasInteracted(true);
        const gpInfo = gamepadConnected ? 'Tay cầm đã sẵn sàng.' : 'Chưa kết nối tay cầm.';
        speak(`Bắt đầu. ${gpInfo}`, 'vi-VN');

        // Auto-start if data is ready
        if (isReadyRef.current && !loadingProgress && !isLoading) {
            startPractice();
        }
    }, [gamepadConnected, loadingProgress, isLoading, startPractice]);

    // Handle gamepad connection in this component too for status reporting
    useEffect(() => {
        const checkGP = () => {
            if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
            const gps = navigator.getGamepads();
            const connected = !!gps[0];
            setGamepadConnected(connected);
        };
        const interval = setInterval(checkGP, 1000);
        return () => clearInterval(interval);
    }, []);

    // Guidance voice
    useEffect(() => {
        if (!hasInteracted) {
            const interval = setInterval(() => {
                speak('Chào chú. Chạm vào màn hình để bắt đầu học.', 'vi-VN');
            }, 15000);
            return () => clearInterval(interval);
        }
    }, [hasInteracted]);

    const playCard = useCallback((card) => {
        if (!card) return;
        speak(card.question, 'en-US');
        if (card.hint) {
            setTimeout(() => speak(`Gợi ý. ${card.hint}`, 'vi-VN'), 2500);
        }
    }, []);

    const revealAnswer = useCallback(() => {
        if (!sessionCards[currentIndex] || isProcessing || showAnswer) return;
        setShowAnswer(true);
        vibrate([50]);
        speak(sessionCards[currentIndex].answer, 'vi-VN');
    }, [sessionCards, currentIndex, isProcessing, showAnswer]);

    const handleRating = useCallback(async (rating) => {
        const currentCard = sessionCards[currentIndex];
        if (!currentCard || isProcessing || !showAnswer) return;
        setIsProcessing(true);

        const isGood = rating === Rating.Good;
        playSound(isGood ? 'success' : 'error');
        vibrate(isGood ? [50, 50, 50] : [200]);

        const nextState = getNextReview(currentCard.state, rating);

        if (!demoMode) {
            fetch('/api/progress', {
                method: 'POST',
                body: JSON.stringify({ userId, cardId: currentCard.id, cardState: nextState }),
            }).catch(() => { });
        }

        setTimeout(() => {
            setShowAnswer(false);
            if (currentIndex < sessionCards.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setIsFinished(true);
            }
            setIsProcessing(false);
        }, 1200);
    }, [sessionCards, currentIndex, isProcessing, showAnswer, demoMode, userId]);

    // Keyboard and Gamepad integration
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();

            if (!hasInteracted) {
                if ([' ', 'enter', 'a', 'b', 'y'].includes(key)) {
                    e.preventDefault();
                    handleStartClick();
                }
                return;
            }

            if (isFinished) {
                if ([' ', 'enter', 'a', 'b', 'y'].includes(key)) {
                    e.preventDefault();
                    window.location.reload();
                }
                return;
            }

            if (!isGameStarted) return;

            if (!showAnswer) {
                if (key === 'y') { e.preventDefault(); playCard(sessionCards[currentIndex]); }
                else if (['a', 'b', ' ', 'enter'].includes(key)) { e.preventDefault(); revealAnswer(); }
            } else {
                if (key === 'a') { e.preventDefault(); handleRating(Rating.Again); }
                else if (key === 'b') { e.preventDefault(); handleRating(Rating.Good); }
                else if (key === 'y') { e.preventDefault(); playCard(sessionCards[currentIndex]); }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.handleGamepadButton = (idx) => {
            if (!hasInteracted) { handleStartClick(); return; }
            if (isFinished) { window.location.reload(); return; }
            if (!isGameStarted) return;

            if (!showAnswer) {
                if (idx === 3) playCard(sessionCards[currentIndex]);
                else revealAnswer();
            } else {
                if (idx === 0) handleRating(Rating.Again);
                if (idx === 1) handleRating(Rating.Good);
                if (idx === 3) playCard(sessionCards[currentIndex]);
            }
        };

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasInteracted, isFinished, isGameStarted, showAnswer, currentIndex, sessionCards, handleStartClick, handleRating, playCard, revealAnswer]);

    useEffect(() => {
        if (isGameStarted && !isFinished && sessionCards[currentIndex]) {
            playCard(sessionCards[currentIndex]);
        }
    }, [currentIndex, isGameStarted, isFinished, sessionCards, playCard]);

    // UI Rendering
    if (!hasInteracted) {
        return (
            <div
                style={{ position: 'fixed', inset: 0, background: 'var(--card-bg)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 1000 }}
                onClick={handleStartClick}
            >
                <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '2rem' }}>
                    <h1 style={{ fontSize: '4rem' }}>Hearki</h1>
                    <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Chào chú. Chạm bất kỳ đâu để học.</p>
                    <div style={{ marginTop: '2rem', color: gamepadConnected ? 'var(--success)' : 'var(--danger)' }}>
                        Tay cầm: {gamepadConnected ? 'Đã kết nối' : 'Chưa kết nối'}
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading || loadingProgress) {
        return <div style={{ textAlign: 'center', padding: '5rem' }}><h2>Đang tải...</h2></div>;
    }

    if (isFinished) {
        return (
            <div className="glass" style={{ padding: '4rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '3rem', color: 'var(--success)' }}>Xong rồi!</h2>
                <p style={{ fontSize: '1.5rem' }}>Chú đã hoàn thành bài học.</p>
                <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '2rem' }}>Học lại</button>
            </div>
        );
    }

    const currentCard = sessionCards[currentIndex];

    return (
        <div className="fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="glass" style={{ padding: '4rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '1rem', right: '2rem', opacity: 0.5 }}>
                    {currentIndex + 1} / {sessionCards.length}
                </div>
                <h2 style={{ fontSize: '4rem' }}>{currentCard?.question}</h2>
                <div style={{ minHeight: '4rem', marginTop: '2rem' }}>
                    {showAnswer ? (
                        <h3 style={{ fontSize: '2.5rem', color: 'var(--success)' }}>{currentCard?.answer}</h3>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>Chạm để xem đáp án</p>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginTop: '4rem' }}>
                    <button onClick={() => showAnswer ? handleRating(Rating.Again) : revealAnswer()} style={{ background: 'none' }}>
                        <div style={{ background: 'var(--danger)', width: '4rem', height: '4rem', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>A</div>
                        <div style={{ marginTop: '0.5rem' }}>{showAnswer ? 'Chưa thuộc' : 'Đáp án'}</div>
                    </button>
                    <button onClick={() => playCard(currentCard)} style={{ background: 'none' }}>
                        <div style={{ background: 'var(--warning)', width: '4rem', height: '4rem', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Y</div>
                        <div style={{ marginTop: '0.5rem' }}>Nghe lại</div>
                    </button>
                    <button onClick={() => showAnswer ? handleRating(Rating.Good) : revealAnswer()} style={{ background: 'none' }}>
                        <div style={{ background: 'var(--success)', width: '4rem', height: '4rem', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>B</div>
                        <div style={{ marginTop: '0.5rem' }}>{showAnswer ? 'Đã thuộc' : 'Đáp án'}</div>
                    </button>
                </div>
            </div>
        </div>
    );
}
