import { kv } from '@vercel/kv';

const hasKV = !!process.env.KV_REST_API_URL;
let mockDb = { cards: [], progress: {} };

export const getCards = async (userId = 'default') => {
    try {
        if (!hasKV) {
            console.warn('Vercel KV not configured. Using mock data.');
            return mockDb.cards;
        }
        return await kv.get(`cards:${userId}`) || [];
    } catch (error) {
        console.error('Database Error (getCards):', error);
        return mockDb.cards;
    }
};

export const saveCards = async (userId = 'default', cards) => {
    try {
        if (!hasKV) {
            mockDb.cards = cards;
            return;
        }
        await kv.set(`cards:${userId}`, cards);
    } catch (error) {
        console.error('Database Error (saveCards):', error);
        mockDb.cards = cards;
    }
};

export const saveProgress = async (userId, cardId, cardState) => {
    try {
        const key = `progress:${userId}`;
        if (!hasKV) {
            if (!mockDb.progress[key]) mockDb.progress[key] = {};
            mockDb.progress[key][cardId] = cardState;
            return;
        }
        await kv.hset(key, { [cardId]: cardState });
    } catch (error) {
        console.error('Database Error (saveProgress):', error);
    }
};

export const getProgress = async (userId, cardId) => {
    try {
        const key = `progress:${userId}`;
        if (!hasKV) {
            return mockDb.progress[key] ? mockDb.progress[key][cardId] : null;
        }
        return await kv.hget(key, cardId);
    } catch (error) {
        console.error('Database Error (getProgress):', error);
        return null;
    }
};

export const getAllProgress = async (userId = 'default') => {
    try {
        const hashKey = `progress:${userId}`;
        if (!hasKV) {
            return mockDb.progress[hashKey] || {};
        }

        // Return only the hash data for now to ensure speed and stability
        const results = await kv.hgetall(hashKey) || {};
        return results;
    } catch (error) {
        console.error('Database Error (getAllProgress):', error);
        return {};
    }
};

export const registerUser = async (email, token) => {
    try {
        if (!hasKV) return true;
        await kv.set(`user:${token}`, { email, createdAt: new Date().toISOString() });
        // Optional: save index of emails if needed
        return true;
    } catch (error) {
        console.error('Database Error (registerUser):', error);
        return false;
    }
};

export const getUserByToken = async (token) => {
    try {
        if (!hasKV) return null;
        return await kv.get(`user:${token}`);
    } catch (error) {
        console.error('Database Error (getUserByToken):', error);
        return null;
    }
};
