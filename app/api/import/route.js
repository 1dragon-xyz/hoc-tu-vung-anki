import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import { getCards, saveCards } from '@/lib/db';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const content = await file.text();
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        const existingCards = await getCards();
        const newCards = records.map((record, index) => ({
            id: (Date.now() + index).toString(),
            question: record.question || record.Question || record.english,
            hint: record.hint || record.Hint || '',
            answer: record.answer || record.Answer || record.vietnamese,
        }));

        await saveCards([...existingCards, ...newCards]);

        return NextResponse.json({ success: true, count: newCards.length });
    } catch (error) {
        console.error('Import error:', error);
        return NextResponse.json({ error: 'Failed to parse CSV' }, { status: 500 });
    }
}
