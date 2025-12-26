'use client';

import { useState, useEffect, useCallback } from 'react';
import { speak, stopSpeaking } from '@/lib/tts';
import { getNextReview, Rating } from '@/lib/fsrs';
import { Volume2, HelpCircle, CheckCircle, RotateCcw } from 'lucide-react';

export default function FlashcardPlayer({ cards }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [sessionCards, setSessionCards] = useState([]);
    const [isGameStarted, setIsGameStarted] = useState(false);

    // Filter cards due for review (simplified for v1: just show all in order)
    useEffect(() => {
        if (cards.length > 0) {
            setSessionCards(cards);
        }
    }, [cards]);

    const currentCard = sessionCards[currentIndex];

    const playCard = useCallback((card) => {
        if (!card) return;

        // 1. Play Question (English)
        speak(card.question, 'en-US');

        // 2. Play Hint after 2s (if exists)
        if (card.hint) {
            setTimeout(() => {
                speak(`Gợi ý. ${card.hint}`, 'vi-VN');
            }, 2500);
        }
    }, []);

    const handleRating = async (rating) => {
        if (!currentCard) return;

        // Reveal answer and speak it
        setShowAnswer(true);
        speak(currentCard.answer, 'vi-VN');

        // Calculate next review (FSRS) - saving locally for v1
        const updatedState = getNextReview(currentCard.state, rating);

        // Move to next card after 3s
        setTimeout(() => {
            setShowAnswer(false);
            if (currentIndex < sessionCards.length - 1) {
                setCurrentIndex(prev => prev + 1);
                playCard(sessionCards[currentIndex + 1]);
            } else {
                speak('Đã hoàn thành bài học hôm nay. Hẹn gặp lại nhé!', 'vi-VN');
                setIsGameStarted(false);
            }
        }, 3000);
    };

    const startPractice = () => {
        setIsGameStarted(true);
        setCurrentIndex(0);
        playCard(sessionCards[0]);
    };

    // Expose methods for GamepadHandler
    useEffect(() => {
        window.handleGamepadButton = (btnIdx) => {
            if (!isGameStarted) {
                if (btnIdx === 0) startPractice(); // A to start
                return;
            }

            if (btnIdx === 0) handleRating(Rating.Again); // A = Again
            if (btnIdx === 1) handleRating(Rating.Good);  // B = Good
            if (btnIdx === 3) playCard(currentCard);      // Y = Repeat
        };
    }, [isGameStarted, currentCard, playCard, currentIndex, sessionCards]);

    if (!isGameStarted) {
        return (
            <div className="glass fade-in" style={{ padding: '4rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Học Từ Vựng</h1>
                <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '3rem' }}>
                    {cards.length > 0 ? `Bạn có ${cards.length} thẻ cần học.` : 'Chưa có thẻ nào được tải.'}
                </p>
                <button
                    onClick={startPractice}
                    className="btn-primary"
                    style={{ fontSize: '1.5rem', padding: '1.5rem 3rem' }}
                >
                    Nhấn A để bắt đầu
                </button>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div className="glass" style={{ width: '100%', padding: '4rem', textAlign: 'center', position: 'relative' }}>
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
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ background: 'var(--danger)', width: '3rem', height: '3rem', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
                        <span>Chưa thuộc</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ background: 'var(--warning)', width: '3rem', height: '3rem', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Y</div>
                        <span>Nghe lại</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ background: 'var(--success)', width: '3rem', height: '3rem', borderRadius: '50%', margin: '0 auto 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>B</div>
                        <span>Đã thuộc</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
