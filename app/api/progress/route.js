import { NextResponse } from 'next/server';
import { saveProgress, getProgress, getAllProgress } from '@/lib/db';

// Demo hosts that should not save progress
const DEMO_HOSTS = ['hearki.1dragon.xyz'];

function isDemoRequest(request) {
    const referer = request.headers.get('referer') || '';
    return DEMO_HOSTS.some(host => referer.includes(host));
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const cardId = searchParams.get('cardId');

    // Demo mode: return empty progress (all cards appear as new)
    if (isDemoRequest(request)) {
        return NextResponse.json(null);
    }

    if (!cardId) {
        // Return all progress for this user
        const allProgress = await getAllProgress(userId);
        return NextResponse.json(allProgress);
    }

    const progress = await getProgress(userId, cardId);
    return NextResponse.json(progress);
}

export async function POST(request) {
    // Demo mode: pretend to save but don't actually
    if (isDemoRequest(request)) {
        return NextResponse.json({ success: true, demo: true });
    }

    const { userId, cardId, cardState } = await request.json();
    if (!cardId || !cardState) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    await saveProgress(userId || 'default', cardId, cardState);
    return NextResponse.json({ success: true });
}
