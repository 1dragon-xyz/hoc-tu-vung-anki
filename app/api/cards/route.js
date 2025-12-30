import { NextResponse } from 'next/server';
import { getCards, saveCards } from '@/lib/db';

import { getAllProgress } from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user') || 'default';
    const includeProgress = searchParams.get('includeProgress') === 'true';

    if (includeProgress) {
        const [cards, progress] = await Promise.all([
            getCards(userId),
            getAllProgress(userId)
        ]);
        return NextResponse.json({ cards, progress });
    }

    const cards = await getCards(userId);
    return NextResponse.json(cards);
}

export async function POST(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user') || 'default';
    const cards = await request.json();
    await saveCards(userId, cards);
    return NextResponse.json({ success: true });
}

export async function PATCH(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user') || 'default';
    const updatedCard = await request.json();
    const cards = await getCards(userId);
    const index = cards.findIndex(c => c.id === updatedCard.id);

    if (index !== -1) {
        cards[index] = { ...cards[index], ...updatedCard };
        await saveCards(userId, cards);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
}
