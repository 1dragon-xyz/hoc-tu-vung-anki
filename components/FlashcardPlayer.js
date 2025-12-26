'use client';

import { useState, useEffect, useCallback } from 'react';
import { speak } from '@/lib/tts';
import { getNextReview, Rating } from '@/lib/fsrs';
import { playSound, vibrate, startBGM, stopBGM } from '@/lib/sounds';

export default function FlashcardPlayer({ cards, loading }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [sessionCards, setSessionCards] = useState([]);
    const [todayCards, setTodayCards] = useState([]); // Cards due within today
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [nextDueIn, setNextDueIn] = useState(null); // Minutes until next card
    const [isProcessing, setIsProcessing] = useState(false);

    // Initial load and filter cards
    useEffect(() => {
        const fetchProgress = async () => {
            if (cards.length > 0) {
                const now = new Date();
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);

                const dueNow = [];
                const dueToday = [];
                let soonestDue = null;

                for (const card of cards) {
                    try {
                        const res = await fetch(`/api/progress?cardId=${card.id}`);
                        const state = res.ok ? await res.json() : null;

                        if (!state || !state.due) {
                            dueNow.push({ ...card, state });
                        } else {
                            const dueDate = new Date(state.due);
                            if (dueDate <= now) {
                                dueNow.push({ ...card, state });
                            } else if (dueDate <= endOfToday) {
                                dueToday.push({ ...card, state, dueDate });
                                // Track soonest
                                if (!soonestDue || dueDate < soonestDue) {
                                    soonestDue = dueDate;
                                }
                            }
                        }
                    } catch (e) {
                        dueNow.push({ ...card, state: null });
                    }
                }

                setSessionCards(dueNow.sort(() => Math.random() - 0.5));
                setTodayCards(dueToday.sort((a, b) => a.dueDate - b.dueDate));

                if (soonestDue) {
                    const diffMs = soonestDue - now;
                    setNextDueIn(Math.max(1, Math.ceil(diffMs / 60000))); // At least 1 minute
                }
            }
        };
        fetchProgress();
    }, [cards]);

    const currentCard = sessionCards[currentIndex];

    // Arcade-style "Attract Mode" (Welcome loop)
    useEffect(() => {
        if (isGameStarted || isFinished || loading) return;

        const welcomeMessage = 'Chào bạn. Nhấn nút bất kỳ để bắt đầu học.';

        startBGM();
        speak(welcomeMessage, 'vi-VN');

        const interval = setInterval(() => {
            if (!isGameStarted && !isFinished) {
                speak(welcomeMessage, 'vi-VN');
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isGameStarted, isFinished, loading]);

    // Speak the finish message
    useEffect(() => {
        if (isFinished) {
            let message = 'Chúc mừng bạn! Bạn đã hoàn thành phần học hiện tại.';
            if (nextDueIn && todayCards.length > 0) {
                message += ` Thẻ tiếp theo sẽ sẵn sàng sau ${nextDueIn} phút. Bạn có ${todayCards.length} thẻ còn lại cho hôm nay. Nhấn B để tiếp tục, hoặc nhấn phím bất kỳ để nghỉ ngơi.`;
            } else if (todayCards.length > 0) {
                message += ` Bạn có ${todayCards.length} thẻ còn lại cho hôm nay. Nhấn B để tiếp tục.`;
            } else {
                message += ' Hẹn gặp lại bạn sau nhé!';
            }
            speak(message, 'vi-VN');
        }
    }, [isFinished, nextDueIn, todayCards.length]);

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

    // Idle Reminder System
    useEffect(() => {
        if (!isGameStarted || isFinished || isProcessing) return;

        let reminderTimeout;
        let repeatTimeout;

        const startTimer = () => {
            if (!showAnswer) {
                // To reveal
                reminderTimeout = setTimeout(() => {
                    speak('Nhấn nút bất kỳ để xem đáp án.', 'vi-VN');
                }, 15000); // 15s for thinking
            } else {
                // To rate
                reminderTimeout = setTimeout(() => {
                    speak('Nhấn A nếu chưa thuộc. B nếu đã thuộc.', 'vi-VN');
                }, 10000); // 10s for rating

                repeatTimeout = setTimeout(() => {
                    speak('Nhấn A nếu chưa thuộc. B nếu đã thuộc.', 'vi-VN');
                }, 25000); // Repeat once at 25s
            }
        };

        startTimer();

        return () => {
            clearTimeout(reminderTimeout);
            clearTimeout(repeatTimeout);
        };
    }, [isGameStarted, isFinished, isProcessing, showAnswer, currentIndex]);

    const handleRating = useCallback(async (rating) => {
        if (!currentCard || isProcessing || !showAnswer) return;
        setIsProcessing(true);

        const isGood = rating === Rating.Good;
        playSound(isGood ? 'success' : 'error');
        vibrate(isGood ? [50, 50, 50] : [200]);

        // Calculate and Save Progress (FSRS handles the scheduling)
        const nextState = getNextReview(currentCard.state, rating);
        await fetch('/api/progress', {
            method: 'POST',
            body: JSON.stringify({
                cardId: currentCard.id,
                cardState: nextState
            }),
        });

        // Update nextDueIn if this was an "Again" card
        if (rating === Rating.Again && nextState.due) {
            const diffMs = new Date(nextState.due) - new Date();
            const mins = Math.max(1, Math.ceil(diffMs / 60000));
            setNextDueIn(prev => prev ? Math.min(prev, mins) : mins);
            // Add to todayCards for "continue" option
            setTodayCards(prev => [...prev, { ...currentCard, state: nextState, dueDate: new Date(nextState.due) }].sort((a, b) => a.dueDate - b.dueDate));
        }

        setTimeout(() => {
            setShowAnswer(false);
            if (currentIndex < sessionCards.length - 1) {
                const nextIdx = currentIndex + 1;
                setCurrentIndex(nextIdx);
            } else {
                setIsFinished(true);
            }
            setIsProcessing(false);
        }, 1200);
    }, [currentCard, currentIndex, sessionCards, isProcessing, showAnswer]);

    useEffect(() => {
        if (isGameStarted && !isFinished && currentCard) {
            playCard(currentCard);
        }
    }, [currentIndex, isGameStarted, isFinished]);

    const repeatContent = useCallback(() => {
        if (!currentCard) return;
        speak('Nghe lại.', 'vi-VN');
        setTimeout(() => {
            if (showAnswer) {
                speak(currentCard.answer, 'vi-VN');
            } else {
                playCard(currentCard);
            }
        }, 800);
    }, [currentCard, showAnswer, playCard]);

    const startPractice = useCallback(() => {
        if (sessionCards.length === 0) {
            if (todayCards.length > 0) {
                speak(`Không có thẻ nào đến hạn ngay bây giờ. Bạn có ${todayCards.length} thẻ còn lại cho hôm nay. Nhấn B để tiếp tục.`, 'vi-VN');
                setIsFinished(true);
            } else {
                speak('Hôm nay bạn đã học xong hết rồi! Hẹn gặp lại sau nhé.', 'vi-VN');
                setIsFinished(true);
            }
            return;
        }
        setIsGameStarted(true);
        setIsFinished(false);
        setCurrentIndex(0);
        setShowAnswer(false);
        stopBGM();
        playSound('connect');
    }, [sessionCards, todayCards]);

    const continueTodayCards = useCallback(() => {
        if (todayCards.length === 0) return;
        // Move todayCards to sessionCards and restart
        setSessionCards(todayCards.sort(() => Math.random() - 0.5));
        setTodayCards([]);
        setNextDueIn(null);
        setCurrentIndex(0);
        setShowAnswer(false);
        setIsFinished(false);
        setIsGameStarted(true);
        stopBGM();
        playSound('connect');
        speak('Tiếp tục học thêm!', 'vi-VN');
    }, [todayCards]);

    // Keyboard + Gamepad handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();

            // Welcome or Finished screen
            if (!isGameStarted || isFinished) {
                if (key === 'b' && isFinished && todayCards.length > 0) {
                    e.preventDefault();
                    continueTodayCards();
                    return;
                }
                if (['a', 'b', 'y', ' ', 'enter'].includes(key)) {
                    e.preventDefault();
                    if (isFinished) {
                        window.location.reload();
                    } else {
                        startBGM();
                        startPractice();
                    }
                }
                return;
            }

            // In-Game
            if (!showAnswer) {
                if (key === 'y') {
                    e.preventDefault();
                    repeatContent();
                } else if (['a', 'b', ' ', 'enter'].includes(key)) {
                    e.preventDefault();
                    revealAnswer();
                }
            } else {
                if (key === 'a') { e.preventDefault(); handleRating(Rating.Again); }
                if (key === 'b') { e.preventDefault(); handleRating(Rating.Good); }
                if (key === 'y') { e.preventDefault(); repeatContent(); }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        window.handleGamepadButton = (btnIdx) => {
            if (!isGameStarted || isFinished) {
                if (btnIdx === 1 && isFinished && todayCards.length > 0) {
                    continueTodayCards();
                    return;
                }
                if (isFinished) {
                    window.location.reload();
                } else {
                    startBGM();
                    startPractice();
                }
                return;
            }

            if (!showAnswer) {
                if (btnIdx === 3) { // Y Button
                    repeatContent();
                } else { // A or B Button
                    revealAnswer();
                }
            } else {
                if (btnIdx === 0) handleRating(Rating.Again);
                if (btnIdx === 1) handleRating(Rating.Good);
                if (btnIdx === 3) repeatContent();
            }
        };

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGameStarted, isFinished, showAnswer, handleRating, revealAnswer, repeatContent, startPractice, continueTodayCards, todayCards.length]);

    return (
        <div className="fade-in" style={{ height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="glass" style={{ width: '100%', padding: '4rem', textAlign: 'center', position: 'relative' }}>
                {isFinished ? (
                    <div style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '3.5rem', marginBottom: '2rem', color: 'var(--success)' }}>🎉 Chúc mừng!</h2>
                        <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Bạn đã hoàn thành phần học hiện tại.</p>

                        {nextDueIn && todayCards.length > 0 && (
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                ⏰ Thẻ tiếp theo sẽ sẵn sàng sau khoảng <strong>{nextDueIn} phút</strong>.
                            </p>
                        )}

                        {todayCards.length > 0 && (
                            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                                Bạn có <strong>{todayCards.length}</strong> thẻ còn lại cho hôm nay.
                            </p>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {todayCards.length > 0 && (
                                <button
                                    onClick={continueTodayCards}
                                    className="btn-primary"
                                    style={{ fontSize: '1.2rem', padding: '1rem 2rem', background: 'var(--success)' }}
                                >
                                    B: Học tiếp ({todayCards.length} thẻ)
                                </button>
                            )}
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-primary"
                                style={{ fontSize: '1.2rem', padding: '1rem 2rem', background: 'var(--card-bg)', border: '1px solid var(--primary)' }}
                            >
                                Phím khác: Nghỉ ngơi
                            </button>
                        </div>
                    </div>
                ) : !isGameStarted ? (
                    <div style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Sẵn sàng</h2>
                        <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Nhấn phím bất kỳ trên tay cầm hoặc bàn phím để bắt đầu học...</p>
                    </div>
                ) : (
                    <>
                        <div style={{ position: 'absolute', top: '1rem', right: '2rem', color: 'var(--text-muted)' }}>
                            Thẻ {currentIndex + 1} / {sessionCards.length}
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
