'use client';

// Demo mode hosts - these domains will run in demo mode (no progress saved)
const DEMO_HOSTS = [
    'hearki.1dragon.xyz',
];

/**
 * Check if the current session is in demo mode based on hostname and token
 * @returns {boolean} true if running on a demo domain and NO token is present
 */
export function isDemo() {
    if (typeof window === 'undefined') return false;

    // Check if there's a token in URL or localStorage
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || localStorage.getItem('hearki_token');

    // If we have a token, we are in personalized mode, not demo
    if (token) return false;

    const hostname = window.location.hostname;
    return DEMO_HOSTS.some(host => hostname.includes(host));
}

/**
 * Get the current user token/ID
 * @returns {string|null} token or null if in demo mode
 */
export function getUserToken() {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || localStorage.getItem('hearki_token');
    return token;
}

/**
 * Check if the current session is in private/personal mode
 * @returns {boolean} true if running on a private domain or has a token
 */
export function isPrivate() {
    return !isDemo();
}
