import { FSRS, Rating, createEmptyCard } from 'ts-fsrs';

const fsrs = new FSRS();

export const getNextReview = (card = null, rating) => {
    // If no card exists, create a new one
    const item = card || createEmptyCard();

    // Calculate next state based on rating (1=Again, 3=Good)
    const scheduledDays = fsrs.repeat(item, new Date())[rating];

    return {
        ...scheduledDays.card,
        lastReview: new Date(),
    };
};

export { Rating };
