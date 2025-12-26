'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Volume2, Save } from 'lucide-react';
import { speak } from '@/lib/tts';

export default function AdminPage() {
    const [cards, setCards] = useState([]);
    const [newCard, setNewCard] = useState({ question: '', hint: '', answer: '' });
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);
    const [password, setPassword] = useState('');

    useEffect(() => {
        // Basic password check for simplicity in v1
        const storedAuth = localStorage.getItem('admin_auth');
        if (storedAuth === 'true') setIsAuth(true);

        fetchCards();
    }, []);

    const fetchCards = async () => {
        const res = await fetch('/api/cards');
        const data = await res.json();
        setCards(data);
        setLoading(false);
    };

    const handleAuth = (e) => {
        e.preventDefault();
        if (password === 'learn123') { // Simple default password
            localStorage.setItem('admin_auth', 'true');
            setIsAuth(true);
        } else {
            alert('Wrong password');
        }
    };

    const addCard = async (e) => {
        e.preventDefault();
        const updatedCards = [...cards, { ...newCard, id: Date.now().toString() }];
        await saveToDb(updatedCards);
        setNewCard({ question: '', hint: '', answer: '' });
    };

    const deleteCard = async (id) => {
        const updatedCards = cards.filter(c => c.id !== id);
        await saveToDb(updatedCards);
    };

    const saveToDb = async (updatedCards) => {
        setCards(updatedCards);
        await fetch('/api/cards', {
            method: 'POST',
            body: JSON.stringify(updatedCards),
        });
    };

    const handleCsvImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/import', {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            fetchCards();
            alert('Import successful!');
        }
    };

    if (!isAuth) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <form onSubmit={handleAuth} className="glass" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
                    <h1 style={{ textAlign: 'center' }}>Admin Access</h1>
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
                </form>
            </div>
        );
    }

    return (
        <div className="container fade-in">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1>Học Từ Vựng <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Admin</span></h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {!process.env.NEXT_PUBLIC_KV_READY && <span style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>⚠️ KV Not Connected</span>}
                    <label className="btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                        <Upload size={18} /> Import CSV
                        <input type="file" accept=".csv" onChange={handleCsvImport} style={{ display: 'none' }} />
                    </label>
                </div>
            </header>

            <section className="glass" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <h3>Add New Card</h3>
                <form onSubmit={addCard}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>Question (English)</label>
                            <input
                                value={newCard.question}
                                onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Answer (Vietnamese)</label>
                            <input
                                value={newCard.answer}
                                onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Hint (Vietnamese - Optional)</label>
                        <textarea
                            value={newCard.hint}
                            onChange={(e) => setNewCard({ ...newCard, hint: e.target.value })}
                            rows="2"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <Plus size={18} /> Add Card
                        </button>
                        <button
                            type="button"
                            onClick={() => speak(newCard.question, 'en-US')}
                            className="btn-primary"
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--primary)' }}
                        >
                            <Volume2 size={18} /> Test English TTS
                        </button>
                    </div>
                </form>
            </section>

            <section>
                <h3>Card Library ({cards.length})</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {cards.map(card => (
                        <div key={card.id} className="glass" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                                <div style={{ fontWeight: '700', fontSize: '1.2rem', wordBreak: 'break-word' }}>{card.question}</div>
                                <div style={{ color: 'var(--text-muted)', wordBreak: 'break-word' }}>{card.answer}</div>
                                {card.hint && <div style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '0.5rem', wordBreak: 'break-word' }}>Hint: {card.hint}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => speak(card.question, 'en-US')} style={{ background: 'none', color: 'var(--text-muted)' }}>
                                    <Volume2 size={20} />
                                </button>
                                <button onClick={() => deleteCard(card.id)} style={{ background: 'none', color: 'var(--danger)' }}>
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {cards.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No cards yet. Create one or import CSV!</p>}
                </div>
            </section>
        </div>
    );
}
