'use client';

import { useState } from 'react';
import { Mail, Check, AlertCircle } from 'lucide-react';

export default function RegisterForm() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus('success');
                setMessage('Chúng tôi đã gửi link cá nhân vào email của bạn. Vui lòng kiểm tra (cả hòm thư rác).');
            } else {
                const data = await res.json();
                setStatus('error');
                setMessage(data.error || 'Có lỗi xảy ra. Vui lòng thử lại.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Lỗi kết nối. Vui lòng thử lại.');
        }
    };

    if (status === 'success') {
        return (
            <div className="glass" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px', margin: '2rem auto' }}>
                <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                    <Check size={48} style={{ margin: '0 auto' }} />
                </div>
                <h3>Tuyệt vời!</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{message}</p>
                <button
                    onClick={() => setStatus('idle')}
                    className="btn-primary"
                    style={{ marginTop: '1.5rem', background: 'var(--card-bg)', border: '1px solid var(--primary)' }}
                >
                    Đóng
                </button>
            </div>
        );
    }

    return (
        <div className="glass" style={{ padding: '2rem', maxWidth: '400px', margin: '2rem auto' }}>
            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Học từ vựng lâu dài?</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Nhập email để nhận link cá nhân. Hearki sẽ lưu lại tiến độ học của riêng bạn.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} /> Email của bạn
                    </label>
                    <input
                        type="email"
                        placeholder="example@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%' }}
                    />
                </div>

                {status === 'error' && (
                    <div style={{ color: 'var(--danger)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={14} /> {message}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={status === 'loading'}
                    style={{ width: '100%', padding: '0.8rem' }}
                >
                    {status === 'loading' ? 'Đang xử lý...' : 'Tạo không gian của tôi'}
                </button>
            </form>

            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
                Không cần mật khẩu. Chỉ cần một đường link duy nhất.
            </p>
        </div>
    );
}
