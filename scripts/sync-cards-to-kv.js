#!/usr/bin/env node
/**
 * Sync local cards.json to Vercel KV
 * 
 * Usage:
 *   1. Make sure you have KV_REST_API_URL and KV_REST_API_TOKEN in .env.local
 *   2. Run: node scripts/sync-cards-to-kv.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const KV_REST_API_URL = process.env.KV_REST_API_URL;
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN;

if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    console.error('❌ Error: KV_REST_API_URL and KV_REST_API_TOKEN must be set in .env.local');
    console.log('\n📝 To get these values, run:');
    console.log('   vercel env pull .env.local');
    console.log('\n   Or manually add from Vercel Dashboard → Storage → KV');
    process.exit(1);
}

async function syncCards() {
    // Read local cards.json
    const cardsPath = path.join(__dirname, '..', 'data', 'cards.json');

    if (!fs.existsSync(cardsPath)) {
        console.error('❌ Error: data/cards.json not found');
        process.exit(1);
    }

    const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
    console.log(`📦 Found ${cards.length} cards in local data/cards.json`);

    // Push to Vercel KV using REST API
    console.log('🚀 Syncing to Vercel KV...');

    const response = await fetch(`${KV_REST_API_URL}/set/cards:default`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cards),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('❌ Failed to sync:', error);
        process.exit(1);
    }

    console.log('✅ Successfully synced cards to Vercel KV!');
    console.log(`   Total: ${cards.length} cards`);
}

syncCards().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
