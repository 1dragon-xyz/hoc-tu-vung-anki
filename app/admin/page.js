'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Volume2, Save, Edit3, X } from 'lucide-react';
import { speak } from '@/lib/tts';
import { getUserToken } from '@/lib/mode';

export default function AdminPage() {
    const [cards, setCards] = useState([]);
    const [newCard, setNewCard] = useState({ question: '', hint: '', answer: '' });
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);
    const [password, setPassword] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ question: '', answer: '', hint: '' });

    const [token, setToken] = useState(null);

    useEffect(() => {
        // Basic password check for simplicity in v1
        const storedAuth = localStorage.getItem('admin_auth');
        if (storedAuth === 'true') setIsAuth(true);

        const currentToken = getUserToken();
        setToken(currentToken);
    }, []);

    useEffect(() => {
        if (isAuth) {
            fetchCards();
        } else {
            setLoading(false);
        }
    }, [isAuth, token]);

    const fetchCards = async () => {
        const url = token ? `/api/cards?user=${token}` : '/api/cards';
        const res = await fetch(url);
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
        if (!confirm('Are you sure you want to delete this card?')) return;
        const updatedCards = cards.filter(c => c.id !== id);
        await saveToDb(updatedCards);
    };

    const startEditing = (card) => {
        setEditingId(card.id);
        setEditData({ question: card.question, answer: card.answer, hint: card.hint || '' });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditData({ question: '', answer: '', hint: '' });
    };

    const updateCard = async (id) => {
        const updatedCards = cards.map(c => c.id === id ? { ...c, ...editData } : c);
        await saveToDb(updatedCards);
        setEditingId(null);
    };

    const saveToDb = async (updatedCards) => {
        setCards(updatedCards);
        const url = token ? `/api/cards?user=${token}` : '/api/cards';
        await fetch(url, {
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
                        <div key={card.id} className="glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {editingId === card.id ? (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="input-group">
                                            <label>Question</label>
                                            <input
                                                value={editData.question}
                                                onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label>Answer</label>
                                            <input
                                                value={editData.answer}
                                                onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Hint (Optional)</label>
                                        <input
                                            value={editData.hint}
                                            onChange={(e) => setEditData({ ...editData, hint: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => updateCard(card.id)} className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--success)' }}>
                                            <Save size={16} /> Save
                                        </button>
                                        <button onClick={cancelEditing} className="btn-primary" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--primary)' }}>
                                            <X size={16} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                                        <div style={{ fontWeight: '700', fontSize: '1.2rem', wordBreak: 'break-word' }}>{card.question}</div>
                                        <div style={{ color: 'var(--text-muted)', wordBreak: 'break-word' }}>{card.answer}</div>
                                        {card.hint && <div style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: '0.5rem', wordBreak: 'break-word' }}>Hint: {card.hint}</div>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => speak(card.question, 'en-US')} style={{ background: 'none', color: 'var(--text-muted)', padding: '0.5rem' }}>
                                            <Volume2 size={20} />
                                        </button>
                                        <button onClick={() => startEditing(card)} style={{ background: 'none', color: 'var(--primary)', padding: '0.5rem' }}>
                                            <Edit3 size={20} />
                                        </button>
                                        <button onClick={() => deleteCard(card.id)} style={{ background: 'none', color: 'var(--danger)', padding: '0.5rem' }}>
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {cards.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No cards yet. Create one or import CSV!</p>}
                </div>
            </section>
        </div>
    );
}
