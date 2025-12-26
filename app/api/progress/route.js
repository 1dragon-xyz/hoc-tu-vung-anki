import { NextResponse } from 'next/server';
import { saveProgress, getProgress } from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const cardId = searchParams.get('cardId');

    if (!cardId) return NextResponse.json({ error: 'Missing cardId' }, { status: 400 });

    const progress = await getProgress(userId, cardId);
    return NextResponse.json(progress);
}

export async function POST(request) {
    const { userId, cardId, cardState } = await request.json();
    if (!cardId || !cardState) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    await saveProgress(userId || 'default', cardId, cardState);
    return NextResponse.json({ success: true });
}
