import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
        }

        // Generate a random token
        const token = crypto.randomBytes(16).toString('hex');

        // Save to DB
        const success = await registerUser(email, token);

        if (!success) {
            return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
        }

        // In a real app, send actual email here
        // For now, we simulate success
        console.log(`[AUTH] New registration: ${email} -> token: ${token}`);
        console.log(`[AUTH] Link: https://hearki.1dragon.xyz?token=${token}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Registration API Error:', error);
        return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
    }
}
