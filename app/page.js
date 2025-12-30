'use client';

import { useState, useEffect } from 'react';
import FlashcardPlayer from '@/components/FlashcardPlayer';
import GamepadHandler from '@/components/GamepadHandler';

// 10 Sample cards for demo purposes
const DEMO_CARDS = [
  { id: 'demo-1', question: 'Hello', answer: 'Xin chào', hint: 'Lời chào phổ biến' },
  { id: 'demo-2', question: 'Goodbye', answer: 'Tạm biệt', hint: 'Khi chia tay' },
  { id: 'demo-3', question: 'Thank you', answer: 'Cảm ơn', hint: 'Thể hiện lòng biết ơn' },
  { id: 'demo-4', question: 'Water', answer: 'Nước', hint: 'Uống khi khát' },
  { id: 'demo-5', question: 'Food', answer: 'Thức ăn', hint: 'Ăn khi đói' },
  { id: 'demo-6', question: 'Friend', answer: 'Bạn bè', hint: 'Người thân thiết' },
  { id: 'demo-7', question: 'Family', answer: 'Gia đình', hint: 'Những người thân yêu' },
  { id: 'demo-8', question: 'Happy', answer: 'Vui vẻ', hint: 'Cảm xúc tích cực' },
  { id: 'demo-9', question: 'Love', answer: 'Yêu thương', hint: 'Tình cảm sâu sắc' },
  { id: 'demo-10', question: 'Help', answer: 'Giúp đỡ', hint: 'Hỗ trợ người khác' },
];

export default function Home() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cards')
      .then(res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        if (!data || data.length === 0) {
          setCards(DEMO_CARDS);
        } else {
          setCards(data);
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setCards(DEMO_CARDS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleButtonPress = (btnIdx) => {
    if (window.handleGamepadButton) {
      window.handleGamepadButton(btnIdx);
    }
  };

  // Audio feedback for loading state
  useEffect(() => {
    if (loading) {
      import('@/lib/tts').then(({ speak }) => {
        speak('Đang tải thẻ học. Vui lòng chờ.', 'vi-VN');
      });
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Đang tải thẻ học...</p>
      </div>
    );
  }

  return (
    <main className="container">
      <GamepadHandler onButtonPress={handleButtonPress} />
      <FlashcardPlayer cards={cards} loading={loading} />

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <strong>Hearki</strong> • Audio Flashcards for the Visually Impaired
      </footer>
    </main>
  );
}
