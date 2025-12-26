import { kv } from '@vercel/kv';

const hasKV = !!process.env.KV_REST_API_URL;
let mockDb = { cards: [], progress: {} };

export const getCards = async () => {
    try {
        if (!hasKV) {
            console.warn('Vercel KV not configured. Using mock data.');
            return mockDb.cards;
        }
        return await kv.get('cards') || [];
    } catch (error) {
        console.error('Database Error (getCards):', error);
        return mockDb.cards;
    }
};

export const saveCards = async (cards) => {
    try {
        if (!hasKV) {
            mockDb.cards = cards;
            return;
        }
        await kv.set('cards', cards);
    } catch (error) {
        console.error('Database Error (saveCards):', error);
        mockDb.cards = cards;
    }
};

export const saveProgress = async (userId, cardId, cardState) => {
    try {
        const key = `progress:${userId}:${cardId}`;
        if (!hasKV) {
            mockDb.progress[key] = cardState;
            return;
        }
        await kv.set(key, cardState);
    } catch (error) {
        console.error('Database Error (saveProgress):', error);
    }
};

export const getProgress = async (userId, cardId) => {
    try {
        const key = `progress:${userId}:${cardId}`;
        if (!hasKV) {
            return mockDb.progress[key];
        }
        return await kv.get(key);
    } catch (error) {
        console.error('Database Error (getProgress):', error);
        return null;
    }
};
