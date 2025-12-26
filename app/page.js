'use client';

import { useState, useEffect } from 'react';
import FlashcardPlayer from '@/components/FlashcardPlayer';
import GamepadHandler from '@/components/GamepadHandler';

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
          setCards([
            { id: 'default-1', question: 'Hello', answer: 'Xin chào', hint: 'Lời chào phổ biến' },
            { id: 'default-2', question: 'Book', answer: 'Quyển sách', hint: 'Dùng để đọc' },
            { id: 'default-3', question: 'Orange', answer: 'Quả cam', hint: 'Trái cây màu cam' }
          ]);
        } else {
          setCards(data);
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setCards([
          { id: 'error-1', question: 'Hello', answer: 'Xin chào', hint: 'App is in offline mode' },
          { id: 'error-2', question: 'Book', answer: 'Quyển sách', hint: 'Testing mode' },
          { id: 'error-3', question: 'Orange', answer: 'Quả cam', hint: 'Demo data' }
        ]);
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
      <FlashcardPlayer cards={cards} />

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Thiết kế dành riêng cho Người khiếm thị • Hội kết nối: Xbox One Controller
      </footer>
    </main>
  );
}
