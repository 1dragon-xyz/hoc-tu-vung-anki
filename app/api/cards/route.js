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
