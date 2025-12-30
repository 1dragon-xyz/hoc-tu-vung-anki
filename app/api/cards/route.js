import { NextResponse } from 'next/server';
import { getCards, saveCards } from '@/lib/db';

export async function GET() {
    const cards = await getCards();
    return NextResponse.json(cards);
}

export async function POST(request) {
    const cards = await request.json();
    await saveCards(cards);
    return NextResponse.json({ success: true });
}

export async function PATCH(request) {
    const updatedCard = await request.json();
    const cards = await getCards();
    const index = cards.findIndex(c => c.id === updatedCard.id);

    if (index !== -1) {
        cards[index] = { ...cards[index], ...updatedCard };
        await saveCards(cards);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
}
